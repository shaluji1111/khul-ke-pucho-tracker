import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const generateId = () => randomUUID();

// All task routes require authentication
router.use(authenticateToken);

// Create a new task (Admin sets assignment, Employee self-assigns)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, type, assigned_to, deadline } = req.body;

    if (!title || typeof title !== 'string' || title.length > 200) {
        res.status(400).json({ error: 'Title is required and must be under 200 characters' });
        return;
    }

    if (description && (typeof description !== 'string' || description.length > 2000)) {
        res.status(400).json({ error: 'Description must be under 2000 characters' });
        return;
    }

    // Employee logic: can only self-assign 'miscellaneous' tasks
    if (req.user?.role !== 'admin') {
        if (!title) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }
        try {
            const id = generateId();
            await db.execute({
                sql: 'INSERT INTO tasks (id, title, description, type, assigned_to, deadline, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                args: [id, title as string, description ? (description as string) : null, 'miscellaneous', req.user?.id as string, deadline ? (deadline as string) : null, req.user?.id as string]
            });
            res.status(201).json({ id, title, type: 'miscellaneous', assigned_to: req.user?.id, status: 'pending', deadline, created_by: req.user?.id });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create self-assigned task' });
        }
        return;
    }

    // Admin logic
    if (!title || !type || !assigned_to) {
        res.status(400).json({ error: 'Title, type, and assigned_to are required' });
        return;
    }

    try {
        const id = generateId();
        await db.execute({
            sql: 'INSERT INTO tasks (id, title, description, type, assigned_to, deadline, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [id, title as string, description ? (description as string) : null, type as string, assigned_to as string, deadline ? (deadline as string) : null, req.user?.id as string]
        });

        res.status(201).json({ id, title, type, assigned_to, status: 'pending', deadline, created_by: req.user?.id });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Create Recurring Task
router.post('/recurring', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, assigned_to } = req.body;
    if (!title || typeof title !== 'string' || title.length > 200) {
        res.status(400).json({ error: 'Title is required and must be under 200 characters' });
        return;
    }
    if (!assigned_to || typeof assigned_to !== 'string') {
        res.status(400).json({ error: 'assigned_to is required' });
        return;
    }
    if (description && (typeof description !== 'string' || description.length > 2000)) {
        res.status(400).json({ error: 'Description must be under 2000 characters' });
        return;
    }
    try {
        const id = generateId();
        await db.execute({
            sql: 'INSERT INTO recurring_tasks (id, title, description, assigned_to) VALUES (?, ?, ?, ?)',
            args: [id, title as string, description ? (description as string) : null, assigned_to as string]
        });
        res.status(201).json({ id, title, description, assigned_to });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create recurring task' });
    }
});

// Get Recurring Tasks
router.get('/recurring', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await db.execute(`
            SELECT rt.*, u.name as assignee_name 
            FROM recurring_tasks rt 
            JOIN users u ON rt.assigned_to = u.id 
            ORDER BY rt.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recurring tasks' });
    }
});

// Delete Recurring Task
router.delete('/recurring/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await db.execute({ sql: 'DELETE FROM recurring_tasks WHERE id = ?', args: [req.params.id as string] });
        res.json({ message: 'Recurring task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete recurring task' });
    }
});

// Update task status (Employee or Admin)
router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
    }

    try {
        const completedAtQuery = status === 'completed' ? `DATETIME('now')` : 'NULL';

        // Ensure employee can only update their own tasks, but admin can update any
        const verifySql = req.user?.role === 'admin'
            ? 'SELECT id FROM tasks WHERE id = ?'
            : 'SELECT id FROM tasks WHERE id = ? AND assigned_to = ?';

        const args: any[] = req.user?.role === 'admin' ? [id as string] : [id as string, req.user?.id as string];

        const taskCheck = await db.execute({ sql: verifySql, args });

        if (taskCheck.rows.length === 0) {
            res.status(404).json({ error: 'Task not found or unauthorized' });
            return;
        }

        await db.execute({
            sql: `UPDATE tasks SET status = ?, completed_at = ${completedAtQuery} WHERE id = ?`,
            args: [status as string, id as string]
        });

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Update a specific task (Employees can only update tasks they created)
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }

    try {
        // Only allow edits if user is admin, OR if user is employee AND created the task
        const verifySql = req.user?.role === 'admin'
            ? 'SELECT id FROM tasks WHERE id = ?'
            : 'SELECT id FROM tasks WHERE id = ? AND created_by = ?';

        const args: any[] = req.user?.role === 'admin' ? [id as string] : [id as string, req.user?.id as string];

        const taskCheck = await db.execute({ sql: verifySql, args });

        if (taskCheck.rows.length === 0) {
            res.status(403).json({ error: 'Unauthorized to edit this task' });
            return;
        }

        await db.execute({
            sql: 'UPDATE tasks SET title = ? WHERE id = ?',
            args: [title as string, id as string]
        });

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete a specific task (Employees can only delete tasks they created)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const verifySql = req.user?.role === 'admin'
            ? 'SELECT id FROM tasks WHERE id = ?'
            : 'SELECT id FROM tasks WHERE id = ? AND created_by = ?';

        const args: any[] = req.user?.role === 'admin' ? [id as string] : [id as string, req.user?.id as string];

        const taskCheck = await db.execute({ sql: verifySql, args });

        if (taskCheck.rows.length === 0) {
            res.status(403).json({ error: 'Unauthorized to delete this task' });
            return;
        }

        await db.execute({
            sql: 'DELETE FROM tasks WHERE id = ?',
            args: [id as string]
        });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Get tasks (Admin sees all, Employee sees only theirs)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            // Fetch all recurring task templates assigned to the user
            const recurringResult = await db.execute({
                sql: 'SELECT * FROM recurring_tasks WHERE assigned_to = ?',
                args: [req.user?.id!]
            });

            // Fetch the daily tasks that have already been generated today for the user
            const todaysTasksResult = await db.execute({
                sql: "SELECT title FROM tasks WHERE assigned_to = ? AND type = 'daily' AND DATE(created_at, 'localtime') = DATE('now', 'localtime')",
                args: [req.user?.id!]
            });

            // Create a set of existing daily task titles for quick lookup
            const existingTitles = new Set(todaysTasksResult.rows.map(r => r.title as string));

            // Generate a new task for any recurring template that hasn't been instantiated today
            for (const rt of recurringResult.rows) {
                if (!existingTitles.has(rt.title as string)) {
                    await db.execute({
                        sql: 'INSERT INTO tasks (id, title, description, type, assigned_to) VALUES (?, ?, ?, ?, ?)',
                        args: [generateId(), rt.title as string, rt.description ? (rt.description as string) : null, 'daily', req.user?.id!]
                    });
                }
            }
        }

        let result;
        if (req.user?.role === 'admin') {
            result = await db.execute(`
        SELECT t.*, u.name as assignee_name 
        FROM tasks t 
        JOIN users u ON t.assigned_to = u.id 
        ORDER BY t.created_at DESC
      `);
        } else {
            result = await db.execute({
                sql: 'SELECT * FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC',
                args: [req.user?.id!]
            });
        }
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Admin performance metrics
router.get('/metrics', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        let dateCondition = "DATE(t.created_at, 'localtime') = DATE('now', 'localtime')";
        let args: any[] = [];

        if (startDate && endDate) {
            dateCondition = "DATE(t.created_at, 'localtime') >= DATE(?) AND DATE(t.created_at, 'localtime') <= DATE(?)";
            args = [startDate, endDate];
        }

        const query = `
      SELECT 
        u.id, 
        u.name,
        SUM(CASE WHEN t.type = 'daily' AND t.status = 'completed' AND ${dateCondition} THEN 1 ELSE 0 END) as daily_completed,
        SUM(CASE WHEN t.type = 'daily' AND ${dateCondition} THEN 1 ELSE 0 END) as daily_total,
        SUM(CASE WHEN t.type = 'miscellaneous' AND t.status = 'completed' AND ${dateCondition} THEN 1 ELSE 0 END) as extra_completed,
        ROUND(AVG(CASE WHEN t.status = 'completed' AND ${dateCondition} 
            THEN (JULIANDAY(t.completed_at) - JULIANDAY(t.created_at)) * 24 ELSE NULL END), 1) as avg_completion_hours,
        SUM(CASE WHEN t.status = 'completed' AND t.deadline IS NOT NULL AND t.completed_at > t.deadline AND ${dateCondition} THEN 1 ELSE 0 END) as overdue_count
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      WHERE u.role = 'employee'
      GROUP BY u.id, u.name
    `;

        // We repeat the arguments because dateCondition is used 5 times in the query
        const finalArgs = [...args, ...args, ...args, ...args, ...args];

        const result = await db.execute({
            sql: query,
            args: finalArgs
        });

        const metricsWithPoints = result.rows.map((row: any) => ({
            ...row,
            total_points: (Number(row.daily_completed || 0) * 10) + (Number(row.extra_completed || 0) * 25)
        }));

        res.json(metricsWithPoints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// Detailed employee report
router.get('/employee-report/:userId', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        let dateCondition = "DATE(t.created_at, 'localtime') >= DATE('now', '-30 days')";
        let args: any[] = [userId];

        if (startDate && endDate) {
            dateCondition = "DATE(t.created_at, 'localtime') >= DATE(?) AND DATE(t.created_at, 'localtime') <= DATE(?)";
            args = [userId, startDate, endDate];
        }

        // 1. Daily points trend
        const pointsTrendQuery = `
            SELECT
                DATE(t.created_at, 'localtime') as date,
                SUM(CASE WHEN t.type = 'daily' AND t.status = 'completed' THEN 10 ELSE 0 END) +
                SUM(CASE WHEN t.type = 'miscellaneous' AND t.status = 'completed' THEN 25 ELSE 0 END) as points
            FROM tasks t
            WHERE t.assigned_to = ? AND ${dateCondition}
            GROUP BY date
            ORDER BY date ASC
        `;

        // 2. Task types breakdown
        const typeBreakdownQuery = `
            SELECT
                type,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM tasks
            WHERE assigned_to = ? AND ${dateCondition}
            GROUP BY type
        `;

        // 3. Completion vs Deadlines
        const deadlineQuery = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' AND deadline IS NOT NULL AND completed_at <= deadline THEN 1 ELSE 0 END) as on_time,
                SUM(CASE WHEN status = 'completed' AND deadline IS NOT NULL AND completed_at > deadline THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'pending' AND deadline IS NOT NULL AND DATE('now') > DATE(deadline) THEN 1 ELSE 0 END) as overdue_pending
            FROM tasks
            WHERE assigned_to = ? AND ${dateCondition}
        `;

        const [trend, types, deadLines] = await Promise.all([
            db.execute({ sql: pointsTrendQuery, args }),
            db.execute({ sql: typeBreakdownQuery, args }),
            db.execute({ sql: deadlineQuery, args })
        ]);

        res.json({
            trend: trend.rows,
            types: types.rows,
            deadLines: deadLines.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employee report' });
    }
});

export default router;
