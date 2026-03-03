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
    const { start_date, end_date, reason } = req.body;
    const userId = req.user?.id!;

    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start and end dates are required' });
    }

    try {
        try {
            const startDateObj = new Date(start_date);
            const requestedMonday = new Date(startDateObj);
            const day = requestedMonday.getDay();
            const diff = requestedMonday.getDate() - day + (day === 0 ? -6 : 1);
            requestedMonday.setDate(diff);
            const mondayStr = requestedMonday.toISOString().split('T')[0];

            const weekConfig = await db.execute({
                sql: 'SELECT is_open FROM week_configs WHERE week_start_date = ?',
                args: [mondayStr]
            });

            const isExplicitlyOpen = weekConfig.rows.length > 0 && weekConfig.rows[0].is_open === 1;

            if (!isExplicitlyOpen) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // 1. Current Week Rule: Always locked
                const currentMonday = new Date(today);
                const currentDay = currentMonday.getDay();
                currentMonday.setDate(currentMonday.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

                if (mondayStr === currentMonday.toISOString().split('T')[0]) {
                    return res.status(400).json({ error: 'Current week is locked for leave submissions.' });
                }

                // 2. Next Week Rule: Locked starting Friday
                const nextMonday = new Date(currentMonday);
                nextMonday.setDate(nextMonday.getDate() + 7);

                if (mondayStr === nextMonday.toISOString().split('T')[0]) {
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
                sql: 'INSERT INTO leaves (id, user_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
                args: [id, userId, start_date, end_date, reason || null]
            });

            res.status(201).json({ id, start_date, end_date, reason, status: 'pending' });
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
            args: [status, req.params.id]
        });
        res.json({ message: `Leave ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update leave status' });
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
