import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "@/app";
import { db, resetDb, validUser } from "@/test/helpers";

import { users } from "@features/auth/auth.schema";

describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
        const res = await request(app).post("/api/v1/auth/register").send(validUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("Registration successful");

        // Verify user was created in database
        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });

        expect(user).toBeDefined();
        expect(user!.email).toBe(validUser.email);
        expect(user!.isEmailVerified).toBe(false);
        expect(user!.role).toBe("user");
        // Password should be hashed, not plain text
        expect(user!.password).not.toBe(validUser.password);
    });

    it("should return 409 if email already exists", async () => {
        // Register first time
        await request(app).post("/api/v1/auth/register").send(validUser);

        // Try to register again with same email
        const res = await request(app).post("/api/v1/auth/register").send(validUser);

        expect(res.status).toBe(409);
        expect(res.body.message).toContain("already exists");
    });

    it("should return 400 for invalid email format", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ email: "not-an-email", password: "Password1!" });

        expect(res.status).toBe(400);
    });

    it("should return 400 for weak password", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ email: "test@example.com", password: "weak" });

        expect(res.status).toBe(400);
    });

    it("should return 400 for missing fields", async () => {
        const res = await request(app).post("/api/v1/auth/register").send({});

        expect(res.status).toBe(400);
    });

    it("should reject extra fields (strict schema)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ ...validUser, role: "admin" });

        expect(res.status).toBe(400);
    });

    it("should have a clean database after resetDb", async () => {
        // Register a user
        await request(app).post("/api/v1/auth/register").send(validUser);

        // Reset DB
        await resetDb();

        // Verify DB is empty
        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });

        expect(user).toBeUndefined();
    });
});
