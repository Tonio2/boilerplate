import { sql } from "drizzle-orm";
import request from "supertest";

import app from "@/app";

import { db } from "@config/db";

/**
 * Truncate all tables in the test database.
 * Call this in beforeEach() to ensure a clean state for each test.
 */
export async function resetDb() {
    await db.execute(sql`
        TRUNCATE TABLE refresh_tokens, users CASCADE
    `);
}

export const validUser = {
    email: "test@example.com",
    password: "Password1!",
};

export async function registerUser() {
    return request(app).post("/api/v1/auth/register").send(validUser);
}

export async function loginUser(): Promise<string[]> {
    await registerUser();
    const res = await request(app).post("/api/v1/auth/login").send(validUser);
    return res.headers["set-cookie"] as unknown as string[];
}

export { db };
