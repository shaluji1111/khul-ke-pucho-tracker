import { randomUUID } from 'crypto';
import { db } from './db/client';

const generateId = () => randomUUID();

// Derive today's date in IST (UTC+5:30)
const getTodayIst = () => {
    const nowUtcMs = Date.now();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(nowUtcMs + istOffsetMs).toISOString().split('T')[0];
};

// Get current IST datetime string for DB insertion
const getIstNow = () => {
    const nowUtcMs = Date.now();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(nowUtcMs + istOffsetMs).toISOString().replace('T', ' ').split('.')[0];
};

// Generate daily tasks for all users based on recurring templates
export const generateDailyTasksForAllUsers = async () => {
    try {
        console.log('Running daily task generation for all users...');
        const todayIst = getTodayIst();
        const istNow = getIstNow();

        const recurringResult = await db.execute('SELECT * FROM recurring_tasks');

        for (const rt of recurringResult.rows) {
            // Check if the user is currently on an approved leave (using IST date)
            const onLeaveResult = await db.execute({
                sql: "SELECT id FROM leaves WHERE user_id = ? AND status = 'approved' AND ? >= DATE(start_date) AND ? <= DATE(end_date)",
                args: [rt.assigned_to as string, todayIst, todayIst]
            });

            if (onLeaveResult.rows.length > 0) {
                continue; // Skip generating tasks if on an approved leave
            }

            // Check if this specific task has already been generated today (using IST date)
            const todaysTasksResult = await db.execute({
                sql: "SELECT id FROM tasks WHERE assigned_to = ? AND title = ? AND type = 'daily' AND DATE(created_at) = ?",
                args: [rt.assigned_to as string, rt.title as string, todayIst]
            });

            if (todaysTasksResult.rows.length === 0) {
                // Insert with IST-based created_at so DATE(created_at) = todayIst
                await db.execute({
                    sql: 'INSERT INTO tasks (id, title, description, type, assigned_to, points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    args: [generateId(), rt.title as string, rt.description ? (rt.description as string) : null, 'daily', rt.assigned_to as string, 10, istNow]
                });
            }
        }
        console.log('Daily tasks generation complete.');
    } catch (error) {
        console.error('Error generating daily tasks for all users:', error);
    }
};


