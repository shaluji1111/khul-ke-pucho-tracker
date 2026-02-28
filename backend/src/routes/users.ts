import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const generateId = () => Math.random().toString(36).substring(2, 11);

// All user routes require admin
router.use(authenticateToken, requireAdmin);

// Get all users
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await db.execute('SELECT id, name, role, created_at FROM users');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/', async (req: Request, res: Response): Promise<void> => {
    const { name, role, password, designation } = req.body;
    if (!name || !role || !password) {
        res.status(400).json({ error: 'Name, role, and password required' });
        return;
    }

    if (role !== 'admin' && role !== 'employee') {
        res.status(400).json({ error: 'Invalid role' });
        return;
    }

    try {
        const id = generateId();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute({
            sql: 'INSERT INTO users (id, name, role, designation, password_hash) VALUES (?, ?, ?, ?, ?)',
            args: [id, name as string, role as string, designation ? (designation as string) : null, hashedPassword]
        });

        res.status(201).json({ id, name, role, designation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Delete user
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        // Prevent deleting the primary admin account
        const userResult = await db.execute({
            sql: 'SELECT name, role FROM users WHERE id = ?',
            args: [id as string]
        });

        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // If the user being deleted is the primary 'admin', block it.
        if (userResult.rows[0].name === 'admin' && userResult.rows[0].role === 'admin') {
            res.status(403).json({ error: 'Cannot delete the primary administrator account.' });
            return;
        }

        await db.execute({
            sql: 'DELETE FROM users WHERE id = ?',
            args: [id as string]
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
