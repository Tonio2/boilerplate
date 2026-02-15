import crypto from "crypto";

import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "@/app";
import { db, loginUser, registerUser, validUser } from "@/test/helpers";

import { refreshTokens, users } from "@features/auth/auth.schema";

/**
 * Manually insert a reset token into the DB for testing,
 * bypassing the email flow. Returns the raw (unhashed) token.
 */
async function createResetToken(email: string, expiresIn = 15 * 60 * 1000): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await db
        .update(users)
        .set({
            passwordResetToken: hashedToken,
            passwordResetExpires: Date.now() + expiresIn,
        })
        .where(eq(users.email, email));

    return rawToken;
}

// ============================================
// FORGOT PASSWORD
// ============================================
describe("POST /api/v1/auth/forgot-password", () => {
    it("should return 200 for an existing email", async () => {
        await registerUser();

        const res = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: validUser.email });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should store a hashed reset token and expiration in the database", async () => {
        await registerUser();

        await request(app).post("/api/v1/auth/forgot-password").send({ email: validUser.email });

        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });

        expect(user!.passwordResetToken).toBeDefined();
        expect(user!.passwordResetToken).not.toBeNull();
        expect(user!.passwordResetExpires).toBeDefined();
        // Expiration should be in the future
        expect(user!.passwordResetExpires).toBeGreaterThan(Date.now());
    });

    it("should return the same 200 response for a non-existent email (anti-enumeration)", async () => {
        const resExisting = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: "nobody@example.com" });

        expect(resExisting.status).toBe(200);
        expect(resExisting.body.success).toBe(true);
    });

    it("should return the same message for existing and non-existing emails", async () => {
        await registerUser();

        const resExisting = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: validUser.email });

        const resNonExisting = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: "nobody@example.com" });

        expect(resExisting.body.message).toBe(resNonExisting.body.message);
    });

    it("should return 400 for invalid email format", async () => {
        const res = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: "not-an-email" });

        expect(res.status).toBe(400);
    });

    it("should return 400 for missing email", async () => {
        const res = await request(app).post("/api/v1/auth/forgot-password").send({});

        expect(res.status).toBe(400);
    });
});

// ============================================
// RESET PASSWORD
// ============================================
describe("POST /api/v1/auth/reset-password", () => {
    it("should reset the password with a valid token", async () => {
        await registerUser();
        const rawToken = await createResetToken(validUser.email);

        const newPassword = "NewPassword1!";
        const res = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: rawToken, password: newPassword });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Should be able to login with the new password
        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: validUser.email, password: newPassword });

        expect(loginRes.status).toBe(200);
    });

    it("should clear the reset token from the database after use", async () => {
        await registerUser();
        const rawToken = await createResetToken(validUser.email);

        await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: rawToken, password: "NewPassword1!" });

        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });

        expect(user!.passwordResetToken).toBeNull();
        expect(user!.passwordResetExpires).toBeNull();
    });

    it("should invalidate all refresh tokens after password reset", async () => {
        await loginUser();
        const rawToken = await createResetToken(validUser.email);

        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });

        // Should have a refresh token from login
        const tokensBefore = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.userId, user!.id),
        });
        expect(tokensBefore.length).toBe(1);

        await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: rawToken, password: "NewPassword1!" });

        // All refresh tokens should be deleted
        const tokensAfter = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.userId, user!.id),
        });
        expect(tokensAfter.length).toBe(0);
    });

    it("should reject an old password after reset", async () => {
        await registerUser();
        const rawToken = await createResetToken(validUser.email);

        await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: rawToken, password: "NewPassword1!" });

        // Old password should no longer work
        const loginRes = await request(app).post("/api/v1/auth/login").send(validUser);

        expect(loginRes.status).toBe(401);
    });

    it("should return 400 for an expired token", async () => {
        await registerUser();
        // Create a token that expired 1ms ago
        const rawToken = await createResetToken(validUser.email, -1);

        const res = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: rawToken, password: "NewPassword1!" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Invalid or expired");
    });

    it("should return 400 for an invalid token", async () => {
        await registerUser();

        const res = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: "invalid-token", password: "NewPassword1!" });

        expect(res.status).toBe(400);
    });

    it("should return 400 for a weak new password", async () => {
        await registerUser();
        const rawToken = await createResetToken(validUser.email);

        const res = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: rawToken, password: "weak" });

        expect(res.status).toBe(400);
    });

    it("should return 400 for missing fields", async () => {
        const res = await request(app).post("/api/v1/auth/reset-password").send({});

        expect(res.status).toBe(400);
    });
});
