const { createClient } = require("@libsql/client");

const db = createClient({
    url: "file:local.db",
});

async function check() {
    try {
        const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error(error);
    }
}

check();
