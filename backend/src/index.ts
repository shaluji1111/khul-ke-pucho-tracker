import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import tasksRoutes from './routes/tasks';
import leavesRoutes from './routes/leaves';
import { db } from './db/client';
import { generateDailyTasksForAllUsers } from './cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Vercel-compatible cron endpoint
app.get('/api/cron/daily', async (req, res) => {
    try {
        await generateDailyTasksForAllUsers();
        res.status(200).json({ success: true, message: 'Daily tasks generated' });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/leaves', leavesRoutes);

// Run lightweight runtime migrations for deployment ease
const initializeDb = async () => {
    try {
        await db.execute('ALTER TABLE tasks ADD COLUMN points INTEGER DEFAULT 0;');
        console.log('Added points column automatically.');
        await db.execute("UPDATE tasks SET points = 10 WHERE type = 'daily' AND points = 0;");
        await db.execute("UPDATE tasks SET points = 25 WHERE type = 'miscellaneous' AND (points IS NULL OR points = 0);");
    } catch (e: any) {
        if (e.message && !e.message.includes('duplicate column name')) {
            console.log('Runtime migration (tasks) info:', e.message);
        }
    }

    try {
        await db.execute("ALTER TABLE leaves ADD COLUMN type TEXT NOT NULL DEFAULT 'planned';");
        console.log('Added type column to leaves automatically.');
    } catch (e: any) {
        if (e.message && !e.message.includes('duplicate column name')) {
            console.log('Runtime migration (leaves) info:', e.message);
        }
    }
};

initializeDb().then(() => {
    if (process.env.NODE_ENV !== 'production') {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
});

// Export the app for Vercel serverless function
export default app;
