import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../db/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const generateId = () => randomUUID();

// All user routes require admin
router.use(authenticateToken, requireAdmin);

// Get all users
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await db.execute('SELECT id, name, full_name, designation, role, created_at FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/', async (req: Request, res: Response): Promise<void> => {
    const { name, full_name, role, password, designation } = req.body;
    if (!name || typeof name !== 'string' || name.length > 50) {
        res.status(400).json({ error: 'JS ID (name) is required and must be under 50 characters' });
        return;
    }
    if (!role || (role !== 'admin' && role !== 'employee')) {
        res.status(400).json({ error: 'Valid role is required (admin or employee)' });
        return;
    }
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 100) {
        res.status(400).json({ error: 'Password must be between 8 and 100 characters' });
        return;
    }
    if (full_name && (typeof full_name !== 'string' || full_name.length > 100)) {
        res.status(400).json({ error: 'Full name must be under 100 characters' });
        return;
    }
    if (designation && (typeof designation !== 'string' || designation.length > 100)) {
        res.status(400).json({ error: 'Designation must be under 100 characters' });
        return;
    }

    try {
        const id = generateId();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute({
            sql: 'INSERT INTO users (id, name, full_name, role, designation, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
            args: [id, name as string, full_name ? (full_name as string) : null, role as string, designation ? (designation as string) : null, hashedPassword]
        });

        res.status(201).json({ id, name, full_name, role, designation });
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

// Update user
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { full_name, role, password, designation } = req.body;

    if (role && role !== 'admin' && role !== 'employee') {
        res.status(400).json({ error: 'Invalid role' });
        return;
    }

    try {
        // Prevent editing the primary admin account role to employee
        const userResult = await db.execute({
            sql: 'SELECT name, role FROM users WHERE id = ?',
            args: [id as string]
        });

        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (userResult.rows[0].name === 'admin' && role === 'employee') {
            res.status(403).json({ error: 'Cannot change the role of the primary administrator account.' });
            return;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.execute({
                sql: 'UPDATE users SET full_name = ?, role = ?, designation = ?, password_hash = ? WHERE id = ?',
                args: [full_name ? (full_name as string) : null, role as string, designation ? (designation as string) : null, hashedPassword, id as string]
            });
        } else {
            await db.execute({
                sql: 'UPDATE users SET full_name = ?, role = ?, designation = ? WHERE id = ?',
                args: [full_name ? (full_name as string) : null, role as string, designation ? (designation as string) : null, id as string]
            });
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
