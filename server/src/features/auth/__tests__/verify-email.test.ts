import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "@/app";
import { db, loginUser, registerUser, validUser } from "@/test/helpers";

import env from "@config/env";

import { users } from "@features/auth/auth.schema";

import type { StringValue } from "ms";

async function registerAndGetUserId(): Promise<string> {
    await registerUser();
    const user = await db.query.users.findFirst({
        where: eq(users.email, validUser.email),
    });
    return user!.id;
}

/** Generate a valid email verification token */
function createEmailToken(userId: string, expiresIn: StringValue = "1h") {
    return jwt.sign({ userId }, env.JWT_EMAIL_SECRET, { expiresIn });
}

// ============================================
// VERIFY EMAIL
// ============================================
describe("POST /api/v1/auth/verify-email", () => {
    it("should verify email with a valid token", async () => {
        const userId = await registerAndGetUserId();
        const token = createEmailToken(userId);

        const res = await request(app).post("/api/v1/auth/verify-email").send({ token });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("Email verified");

        // Verify in database
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        expect(user!.isEmailVerified).toBe(true);
    });

    it("should return 400 for an already verified email", async () => {
        const userId = await registerAndGetUserId();
        const token = createEmailToken(userId);

        // Verify once
        await request(app).post("/api/v1/auth/verify-email").send({ token });

        // Try to verify again
        const res = await request(app).post("/api/v1/auth/verify-email").send({ token });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("already verified");
    });

    it("should return 400 for an invalid token", async () => {
        const res = await request(app)
            .post("/api/v1/auth/verify-email")
            .send({ token: "invalid.jwt.token" });

        expect(res.status).toBe(400);
    });

    it("should return 400 for an expired token", async () => {
        const userId = await registerAndGetUserId();
        // Create a token that's already expired
        const token = createEmailToken(userId, "0s");

        // Small delay to ensure expiration
        await new Promise((r) => setTimeout(r, 50));

        const res = await request(app).post("/api/v1/auth/verify-email").send({ token });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Invalid or expired");
    });

    it("should return 400 for missing token", async () => {
        const res = await request(app).post("/api/v1/auth/verify-email").send({});

        expect(res.status).toBe(400);
    });
});

// ============================================
// RESEND VERIFICATION
// ============================================
describe("POST /api/v1/auth/resend-verification", () => {
    it("should resend verification email for an unverified user", async () => {
        const cookies = await loginUser();

        const res = await request(app)
            .post("/api/v1/auth/resend-verification")
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("Verification email sent");
    });

    it("should return 400 if email is already verified", async () => {
        await loginUser();

        // Manually verify the email in DB
        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });
        await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, user!.id));

        // Need to re-login to get a token with isEmailVerified=true
        const loginRes = await request(app).post("/api/v1/auth/login").send(validUser);
        const newCookies = loginRes.headers["set-cookie"] as unknown as string[];

        const res = await request(app)
            .post("/api/v1/auth/resend-verification")
            .set("Cookie", newCookies);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("already verified");
    });

    it("should return 401 without authentication", async () => {
        const res = await request(app).post("/api/v1/auth/resend-verification");

        expect(res.status).toBe(401);
    });
});
