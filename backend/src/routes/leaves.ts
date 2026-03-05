import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// Get all leaves (Admin) or user's leaves (Employee)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        let result;
        if (req.user?.role === 'admin') {
            result = await db.execute(`
                SELECT l.*, u.name as user_name 
                FROM leaves l 
                JOIN users u ON l.user_id = u.id 
                ORDER BY l.start_date DESC
            `);
        } else {
            result = await db.execute({
                sql: 'SELECT * FROM leaves WHERE user_id = ? ORDER BY start_date DESC',
                args: [req.user?.id!]
            });
        }
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

// Submit a leave request
router.post('/', async (req: AuthRequest, res: Response) => {
    const { start_date, end_date, reason, type } = req.body;
    const userId = req.user?.id!;
    const leaveType = type === 'unplanned' ? 'unplanned' : 'planned';

    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start and end dates are required' });
    }

    try {
        const startDateObj = new Date(start_date);
        const requestedMonday = new Date(startDateObj);
        const day = requestedMonday.getDay();
        const diff = requestedMonday.getDate() - day + (day === 0 ? -6 : 1);
        requestedMonday.setDate(diff);
        const mondayStr = `${requestedMonday.getFullYear()}-${String(requestedMonday.getMonth() + 1).padStart(2, '0')}-${String(requestedMonday.getDate()).padStart(2, '0')}`;

        const weekConfig = await db.execute({
            sql: 'SELECT is_open FROM week_configs WHERE week_start_date = ?',
            args: [mondayStr]
        });

        const isExplicitlyOpen = weekConfig.rows.length > 0 && weekConfig.rows[0].is_open === 1;

        if (leaveType === 'planned' && !isExplicitlyOpen) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Current Week Rule: Always locked
            const currentMonday = new Date(today);
            const currentDay = currentMonday.getDay();
            currentMonday.setDate(currentMonday.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
            const currentMondayStr = `${currentMonday.getFullYear()}-${String(currentMonday.getMonth() + 1).padStart(2, '0')}-${String(currentMonday.getDate()).padStart(2, '0')}`;

            if (mondayStr === currentMondayStr) {
                return res.status(400).json({ error: 'Current week is locked for leave submissions.' });
            }

            // 2. Next Week Rule: Locked starting Friday
            const nextMonday = new Date(currentMonday);
            nextMonday.setDate(nextMonday.getDate() + 7);
            const nextMondayStr = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`;

            if (mondayStr === nextMondayStr) {
                const todayDay = today.getDay(); // 0=Sun, 5=Fri, 6=Sat
                if (todayDay === 5 || todayDay === 6 || todayDay === 0) {
                    return res.status(400).json({ error: 'Next week is locked for submissions starting Friday.' });
                }
            }

            // 3. 3-Day General Lead Time Rule
            const diffTime = startDateObj.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 3) {
                return res.status(400).json({ error: 'Leaves must be scheduled at least 3 days in advance.' });
            }
        }

        const id = randomUUID();
        await db.execute({
            sql: 'INSERT INTO leaves (id, user_id, start_date, end_date, reason, type) VALUES (?, ?, ?, ?, ?, ?)',
            args: [id, userId, start_date, end_date, reason || null, leaveType]
        });

        res.status(201).json({ id, start_date, end_date, reason, type: leaveType, status: 'pending' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit leave request' });
    }
});

// Admin: Update leave status
router.patch('/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await db.execute({
            sql: 'UPDATE leaves SET status = ? WHERE id = ?',
            args: [status as string, req.params.id as string]
        });

        // If approved, instantly clean up any daily tasks that overlap with the leave dates
        if (status === 'approved') {
            const leaveCheck = await db.execute({
                sql: 'SELECT user_id, start_date, end_date FROM leaves WHERE id = ?',
                args: [req.params.id as string]
            });
            if (leaveCheck.rows.length > 0) {
                const leave = leaveCheck.rows[0];
                await db.execute({
                    sql: `DELETE FROM tasks WHERE assigned_to = ? AND type = 'daily' AND DATE(created_at, 'localtime') >= DATE(?) AND DATE(created_at, 'localtime') <= DATE(?)`,
                    args: [leave.user_id as string, leave.start_date as string, leave.end_date as string]
                });
            }
        }

        res.json({ message: `Leave ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update leave status' });
    }
});

// Admin: Declare Company Holiday for all employees
router.post('/holiday', requireAdmin, async (req: AuthRequest, res: Response) => {
    const { date, reason } = req.body;

    if (!date) {
        return res.status(400).json({ error: 'Date is required for a holiday' });
    }

    try {
        // Fetch all employees
        const employees = await db.execute("SELECT id FROM users WHERE role = 'employee'");

        // Create an approved holiday leave for every single employee individually
        // so that they can optionally delete it if they want to work
        for (const emp of employees.rows) {
            const id = randomUUID();
            await db.execute({
                sql: 'INSERT INTO leaves (id, user_id, start_date, end_date, reason, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                args: [id, emp.id as string, date, date, reason || 'Company Holiday', 'holiday', 'approved']
            });

            // Also delete any existing daily tasks for them on this day just in case they were generated
            await db.execute({
                sql: `DELETE FROM tasks WHERE assigned_to = ? AND type = 'daily' AND DATE(created_at, 'localtime') = DATE(?)`,
                args: [emp.id as string, date]
            });
        }

        res.status(201).json({ message: 'Company Holiday declared successfully for all employees' });
    } catch (error) {
        console.error('Error creating holiday:', error);
        res.status(500).json({ error: 'Failed to create company holiday' });
    }
});

// Get Week Configs
router.get('/week-configs', async (req: AuthRequest, res: Response) => {
    try {
        const result = await db.execute('SELECT * FROM week_configs ORDER BY week_start_date DESC LIMIT 10');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch week configs' });
    }
});

// Delete a leave (Allows employees to cancel their leave, OR cancel an auto-generated holiday to work)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const leaveId = req.params.id as string;
        const userId = req.user?.id! as string;

        // Ensure user can only delete their own leaves unless they are an admin
        const verifySql = req.user?.role === 'admin'
            ? 'SELECT id FROM leaves WHERE id = ?'
            : 'SELECT id FROM leaves WHERE id = ? AND user_id = ?';

        const args: any[] = req.user?.role === 'admin' ? [leaveId] : [leaveId, userId];

        const check = await db.execute({ sql: verifySql, args });
        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Unauthorized to delete this leave' });
        }

        await db.execute({
            sql: 'DELETE FROM leaves WHERE id = ?',
            args: [leaveId]
        });

        res.json({ message: 'Leave deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete leave' });
    }
});

// Admin: Toggle Week Open Status
router.post('/week-configs', requireAdmin, async (req: AuthRequest, res: Response) => {
    const { week_start_date, is_open } = req.body;
    if (!week_start_date) return res.status(400).json({ error: 'week_start_date is required' });

    try {
        const id = randomUUID();
        await db.execute({
            sql: `INSERT INTO week_configs (id, week_start_date, is_open) 
                  VALUES (?, ?, ?) 
                  ON CONFLICT(week_start_date) DO UPDATE SET is_open = excluded.is_open`,
            args: [id, week_start_date, is_open ? 1 : 0]
        });
        res.json({ message: 'Week configuration updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update week configuration' });
    }
});

export default router;
