import { db } from './src/db/client';

async function alterDb() {
    try {
        await db.execute('ALTER TABLE tasks ADD COLUMN deadline DATETIME;');
        console.log('Added deadline to tasks.');
    } catch (e: any) {
        if (e.message && e.message.includes('duplicate column name')) {
            console.log('deadline column already exists.');
        } else {
            console.error('Error adding deadline:', e);
        }
    }

    try {
        await db.execute('DROP TABLE IF EXISTS recurring_tasks');
        await db.execute(`
            CREATE TABLE recurring_tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                assigned_to TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Created recurring_tasks table with assigned_to.');
    } catch (error) {
        console.error('Failed to create recurring_tasks:', error);
    }
}

alterDb();
