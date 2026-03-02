import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { db } from '../db/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
}
const SECRET = JWT_SECRET || 'supersecret';

// Helper to generate IDs
const generateId = () => randomUUID();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
    const { name, password } = req.body;

    if (!name || typeof name !== 'string' || name.length > 50) {
        res.status(400).json({ error: 'Invalid name' });
        return;
    }

    if (!password || typeof password !== 'string' || password.length > 100) {
        res.status(400).json({ error: 'Invalid password' });
        return;
    }

    try {
        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE name = ?',
            args: [name]
        });

        const user = result.rows[0];

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password_hash as string);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Seed an initial admin if database is empty
router.post('/init', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await db.execute('SELECT COUNT(*) as count FROM users');
        const count = result.rows[0].count as number;

        if (count > 0) {
            res.status(400).json({ error: 'Database already initialized' });
            return;
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const id = generateId();

        await db.execute({
            sql: 'INSERT INTO users (id, name, role, password_hash) VALUES (?, ?, ?, ?)',
            args: [id, 'admin', 'admin', hashedPassword]
        });

        res.json({ message: 'Admin user created. Login with admin / admin123' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Initialization failed' });
    }
});

export default router;
