import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "@/app";
import { db, registerUser, validUser } from "@/test/helpers";

import { refreshTokens, users } from "@features/auth/auth.schema";

describe("POST /api/v1/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
        await registerUser();
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
        await registerUser();
        const res = await request(app).post("/api/v1/auth/login").send(validUser);

        const cookies = res.headers["set-cookie"] as unknown as string[];
        expect(cookies).toBeDefined();

        const cookieStr = cookies.join("; ");
        expect(cookieStr).toContain("accessToken");
        expect(cookieStr).toContain("refreshToken");
        expect(cookieStr).toContain("HttpOnly");
    });

    it("should store a hashed refresh token in the database", async () => {
        await registerUser();
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
        await registerUser();
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
        await registerUser();
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
