import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "@/app";
import { closeDb, db, resetDb } from "@/test/helpers";

import { refreshTokens, users } from "@features/auth/auth.schema";

beforeEach(async () => {
    await resetDb();
});

afterAll(async () => {
    await closeDb();
});

describe("POST /api/v1/auth/register", () => {
    const validUser = {
        email: "test@example.com",
        password: "Password1!",
    };

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

describe("POST /api/v1/auth/login", () => {
    const validUser = {
        email: "test@example.com",
        password: "Password1!",
    };

    beforeEach(async () => {
        // Register a user for login tests
        await request(app).post("/api/v1/auth/register").send(validUser);
    });

    it("should login successfully with valid credentials", async () => {
        const res = await request(app).post("/api/v1/auth/login").send(validUser);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe(validUser.email);
        expect(res.body.user.role).toBe("user");
        expect(res.body.user.id).toBeDefined();
        // Password should not be in response
        expect(res.body.user.password).toBeUndefined();
    });

    it("should set httpOnly cookies on login", async () => {
        const res = await request(app).post("/api/v1/auth/login").send(validUser);

        const cookies = res.headers["set-cookie"] as unknown as string[];
        expect(cookies).toBeDefined();

        const cookieStr = cookies.join("; ");
        expect(cookieStr).toContain("accessToken");
        expect(cookieStr).toContain("refreshToken");
        expect(cookieStr).toContain("HttpOnly");
    });

    it("should store a hashed refresh token in the database", async () => {
        await request(app).post("/api/v1/auth/login").send(validUser);

        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });

        const tokens = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.userId, user!.id),
        });

        expect(tokens.length).toBe(1);
        // Token in DB should be hashed (not raw JWT)
        expect(tokens[0].token).not.toContain(".");
    });

    it("should return 401 for wrong password", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: validUser.email, password: "WrongPassword1!" });

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("Invalid email or password");
    });

    it("should return 401 for non-existent email", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "nobody@example.com", password: "Password1!" });

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("Invalid email or password");
    });

    it("should return the same error for wrong email and wrong password", async () => {
        const wrongEmail = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "nobody@example.com", password: "Password1!" });

        const wrongPassword = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: validUser.email, password: "WrongPassword1!" });

        // Same message to prevent email enumeration
        expect(wrongEmail.body.message).toBe(wrongPassword.body.message);
    });

    it("should return 400 for missing fields", async () => {
        const res = await request(app).post("/api/v1/auth/login").send({});

        expect(res.status).toBe(400);
    });

    it("should return 400 for invalid email format", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "not-an-email", password: "Password1!" });

        expect(res.status).toBe(400);
    });
});
