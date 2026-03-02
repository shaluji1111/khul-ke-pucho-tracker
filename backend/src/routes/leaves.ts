import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const generateId = () => randomUUID();

router.use(authenticateToken);

// Helper to get Monday of the week for a given date
const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
};

// Get leave availability and user's leaves for a range of weeks
router.get('/config', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await db.execute('SELECT * FROM week_configs ORDER BY week_start_date DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch week configurations' });
    }
});

// Admin: Set week configuration
router.post('/config', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    const { week_start_date, is_accepting, deadline } = req.body;
    if (!week_start_date) {
        res.status(400).json({ error: 'week_start_date is required' });
        return;
    }
    try {
        await db.execute({
            sql: `INSERT INTO week_configs (week_start_date, is_accepting, deadline)
                  VALUES (?, ?, ?)
                  ON CONFLICT(week_start_date) DO UPDATE SET
                  is_accepting = excluded.is_accepting,
                  deadline = excluded.deadline`,
            args: [week_start_date, is_accepting ? 1 : 0, deadline || null]
        });
        res.json({ message: 'Week configuration updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update week configuration' });
    }
});

// Get leaves (Admin: all, Employee: own)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role === 'admin') {
            const result = await db.execute(`
                SELECT l.*, u.name as user_name
                FROM leaves l
                JOIN users u ON l.user_id = u.id
                ORDER BY l.leave_date DESC
            `);
            res.json(result.rows);
        } else {
            const result = await db.execute({
                sql: 'SELECT * FROM leaves WHERE user_id = ? ORDER BY leave_date DESC',
                args: [req.user?.id!]
            });
            res.json(result.rows);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

// Employee: Add leave
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const { leave_date } = req.body;
    if (!leave_date) {
        res.status(400).json({ error: 'leave_date is required' });
        return;
    }

    const leaveDateObj = new Date(leave_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Rule: Cannot add leave 1 or 2 days ahead
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 3);

    const monday = getMonday(leaveDateObj);

    try {
        // Check week configuration
        const configResult = await db.execute({
            sql: 'SELECT * FROM week_configs WHERE week_start_date = ?',
            args: [monday]
        });

        const config = configResult.rows[0] as any;

        // Admin override: If no config exists, or is_accepting is 0, check the default rule
        // BUT if admin HAS specifically allowed it, we bypass the 1-2 days rule?
        // User said: "if they want that employee should be able to add leaves to roaster this week (which should not be allowed by default) then the admin can do so"

        const isSpecificallyAllowed = config && config.is_accepting === 1;
        const deadlinePassed = config && config.deadline && new Date() > new Date(config.deadline);

        if (!isSpecificallyAllowed) {
            if (leaveDateObj < minDate) {
                res.status(400).json({ error: 'Leaves must be booked at least 3 days in advance unless specifically allowed by admin.' });
                return;
            }
        }

        if (deadlinePassed) {
            res.status(400).json({ error: 'The deadline for booking leaves for this week has passed.' });
            return;
        }

        const id = generateId();
        await db.execute({
            sql: 'INSERT INTO leaves (id, user_id, leave_date) VALUES (?, ?, ?)',
            args: [id, req.user?.id!, leave_date]
        });

        res.status(201).json({ id, leave_date });
    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Leave already exists for this date' });
        } else {
            res.status(500).json({ error: 'Failed to add leave' });
        }
    }
});

// Delete leave
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const verifySql = req.user?.role === 'admin'
            ? 'SELECT id FROM leaves WHERE id = ?'
            : 'SELECT id FROM leaves WHERE id = ? AND user_id = ?';
        const args: any[] = req.user?.role === 'admin' ? [req.params.id as string] : [req.params.id as string, req.user?.id as string];

        const check = await db.execute({ sql: verifySql, args });
        if (check.rows.length === 0) {
            res.status(404).json({ error: 'Leave not found' });
            return;
        }

        await db.execute({ sql: 'DELETE FROM leaves WHERE id = ?', args: [req.params.id as string] });
        res.json({ message: 'Leave deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete leave' });
    }
});

export default router;
