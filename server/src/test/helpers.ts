import { sql } from "drizzle-orm";

import { db, pool } from "@config/db";

/**
 * Truncate all tables in the test database.
 * Call this in beforeEach() to ensure a clean state for each test.
 */
export async function resetDb() {
    await db.execute(sql`
        TRUNCATE TABLE refresh_tokens, users CASCADE
    `);
}

/**
 * Close the database pool connection.
 * Call this in afterAll() to clean up after tests.
 */
export async function closeDb() {
    await pool.end();
}

export { db };
