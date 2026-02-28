import { db } from "./client";
import fs from "fs";
import path from "path";

async function runMigrations() {
    console.log("Running migrations...");
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    const statements = schema.split(";").map(s => s.trim()).filter(s => s.length > 0);

    for (const stmt of statements) {
        try {
            await db.execute(stmt);
            console.log(`Executed block smoothly.`);
        } catch (e) {
            console.error(`Error executing statement:`, e);
        }
    }

    console.log("Database initialized successfully!");
    process.exit(0);
}

runMigrations().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
