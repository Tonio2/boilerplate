import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "@/app";
import { db, loginUser, validUser } from "@/test/helpers";

import { refreshTokens, users } from "@features/auth/auth.schema";

describe("DELETE /api/v1/auth/delete-account", () => {
    it("should delete the account with correct password and confirmation", async () => {
        const cookies = await loginUser();

        const res = await request(app)
            .delete("/api/v1/auth/delete-account")
            .set("Cookie", cookies)
            .send({ password: validUser.password, confirmDeletion: true });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("Account deleted");

        // User should no longer exist in the database
        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });
        expect(user).toBeUndefined();
    });

    it("should clear cookies on account deletion", async () => {
        const cookies = await loginUser();

        const res = await request(app)
            .delete("/api/v1/auth/delete-account")
            .set("Cookie", cookies)
            .send({ password: validUser.password, confirmDeletion: true });

        const setCookies = res.headers["set-cookie"] as unknown as string[];
        const cookieStr = setCookies.join("; ");
        expect(cookieStr).toContain("accessToken=;");
        expect(cookieStr).toContain("refreshToken=;");
    });

    it("should delete all refresh tokens for the user", async () => {
        const cookies = await loginUser();

        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });

        // Token exists before deletion
        const tokensBefore = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.userId, user!.id),
        });
        expect(tokensBefore.length).toBe(1);

        await request(app)
            .delete("/api/v1/auth/delete-account")
            .set("Cookie", cookies)
            .send({ password: validUser.password, confirmDeletion: true });

        // All tokens gone
        const tokensAfter = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.userId, user!.id),
        });
        expect(tokensAfter.length).toBe(0);
    });

    it("should return 401 for wrong password", async () => {
        const cookies = await loginUser();

        const res = await request(app)
            .delete("/api/v1/auth/delete-account")
            .set("Cookie", cookies)
            .send({ password: "WrongPassword1!", confirmDeletion: true });

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("Invalid password");

        // User should still exist
        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });
        expect(user).toBeDefined();
    });

    it("should return 400 when confirmDeletion is false", async () => {
        const cookies = await loginUser();

        const res = await request(app)
            .delete("/api/v1/auth/delete-account")
            .set("Cookie", cookies)
            .send({ password: validUser.password, confirmDeletion: false });

        expect(res.status).toBe(400);
    });

    it("should return 400 when confirmDeletion is missing", async () => {
        const cookies = await loginUser();

        const res = await request(app)
            .delete("/api/v1/auth/delete-account")
            .set("Cookie", cookies)
            .send({ password: validUser.password });

        expect(res.status).toBe(400);
    });

    it("should return 401 without authentication", async () => {
        const res = await request(app)
            .delete("/api/v1/auth/delete-account")
            .send({ password: validUser.password, confirmDeletion: true });

        expect(res.status).toBe(401);
    });

    it("should return 400 for missing password", async () => {
        const cookies = await loginUser();

        const res = await request(app)
            .delete("/api/v1/auth/delete-account")
            .set("Cookie", cookies)
            .send({ confirmDeletion: true });

        expect(res.status).toBe(400);
    });
});
