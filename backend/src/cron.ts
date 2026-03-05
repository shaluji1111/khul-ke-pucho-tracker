import { randomUUID } from 'crypto';
import { db } from './db/client';

const generateId = () => randomUUID();

// Generate daily tasks for all users based on recurring templates
export const generateDailyTasksForAllUsers = async () => {
    try {
        console.log('Running daily task generation for all users...');
        const recurringResult = await db.execute('SELECT * FROM recurring_tasks');

        for (const rt of recurringResult.rows) {
            // Check if the user is currently on an approved leave (or holiday) today
            const onLeaveResult = await db.execute({
                sql: "SELECT id FROM leaves WHERE user_id = ? AND status = 'approved' AND DATE('now', 'localtime') >= DATE(start_date) AND DATE('now', 'localtime') <= DATE(end_date)",
                args: [rt.assigned_to as string]
            });

            if (onLeaveResult.rows.length > 0) {
                continue; // Skip generating tasks if on an approved leave
            }

            // Check if this specific user already has this specific daily task generated for today
            const todaysTasksResult = await db.execute({
                sql: "SELECT id FROM tasks WHERE assigned_to = ? AND title = ? AND type = 'daily' AND DATE(created_at, 'localtime') = DATE('now', 'localtime')",
                args: [rt.assigned_to as string, rt.title as string]
            });

            if (todaysTasksResult.rows.length === 0) {
                await db.execute({
                    sql: 'INSERT INTO tasks (id, title, description, type, assigned_to, points) VALUES (?, ?, ?, ?, ?, ?)',
                    args: [generateId(), rt.title as string, rt.description ? (rt.description as string) : null, 'daily', rt.assigned_to as string, 10]
                });
            }
        }
        console.log('Daily tasks generation complete.');
    } catch (error) {
        console.error('Error generating daily tasks for all users:', error);
    }
};


