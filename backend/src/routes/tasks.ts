import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const generateId = () => Math.random().toString(36).substring(2, 11);

// All task routes require authentication
router.use(authenticateToken);

// Create a new task (Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, type, assigned_to } = req.body;
    if (!title || !type || !assigned_to) {
        res.status(400).json({ error: 'Title, type, and assigned_to are required' });
        return;
    }

    try {
        const id = generateId();
        await db.execute({
            sql: 'INSERT INTO tasks (id, title, description, type, assigned_to) VALUES (?, ?, ?, ?, ?)',
            args: [id, title as string, description ? (description as string) : null, type as string, assigned_to as string]
        });

        res.status(201).json({ id, title, type, assigned_to, status: 'pending' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
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

        const args = req.user?.role === 'admin' ? [id as string] : [id as string, req.user?.id as string];

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

// Get tasks (Admin sees all, Employee sees only theirs)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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
        const result = await db.execute(`
      SELECT 
        u.id, 
        u.name,
        SUM(CASE WHEN t.type = 'daily' AND t.status = 'completed' THEN 1 ELSE 0 END) as daily_completed,
        SUM(CASE WHEN t.type = 'daily' THEN 1 ELSE 0 END) as daily_total,
        SUM(CASE WHEN t.type = 'miscellaneous' AND t.status = 'completed' THEN 1 ELSE 0 END) as extra_completed
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      WHERE u.role = 'employee'
      GROUP BY u.id, u.name
    `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

export default router;
