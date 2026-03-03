import { db } from "./client";

async function migrate() {
    try {
        console.log("Adding points column to tasks table...");
        await db.execute("ALTER TABLE tasks ADD COLUMN points INTEGER DEFAULT 0;");
        console.log("Successfully added points column.");

        console.log("Setting default points for existing tasks...");
        await db.execute("UPDATE tasks SET points = 10 WHERE type = 'daily';");
        await db.execute("UPDATE tasks SET points = 25 WHERE type = 'miscellaneous';");
        console.log("Migration complete.");
    } catch (error) {
        // Column might already exist if migration was partially run
        if (error instanceof Error && error.message.includes("duplicate column name")) {
            console.log("Points column already exists, skipping ALTER.");
            await db.execute("UPDATE tasks SET points = 10 WHERE type = 'daily' AND points = 0;");
            await db.execute("UPDATE tasks SET points = 25 WHERE type = 'miscellaneous' AND points = 0;");
            console.log("Migration complete (updated existing).");
        } else {
            console.error("Migration failed:", error);
        }
    }
}

migrate();
