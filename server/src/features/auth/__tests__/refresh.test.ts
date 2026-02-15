import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "@/app";
import { db, loginUser } from "@/test/helpers";

describe("POST /api/v1/auth/refresh", () => {
    it("should refresh tokens successfully with a valid refresh token", async () => {
        const cookies = await loginUser();

        const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("Token refreshed");

        // Should set new cookies
        const newCookies = res.headers["set-cookie"] as unknown as string[];
        const cookieStr = newCookies.join("; ");
        expect(cookieStr).toContain("accessToken");
        expect(cookieStr).toContain("refreshToken");
    });

    it("should rotate the refresh token (old token deleted, new one stored)", async () => {
        const cookies = await loginUser();

        // Count tokens before refresh
        const tokensBefore = await db.query.refreshTokens.findMany();
        expect(tokensBefore.length).toBe(1);

        await request(app).post("/api/v1/auth/refresh").set("Cookie", cookies);

        // Should still have exactly 1 token (old deleted, new created)
        const tokensAfter = await db.query.refreshTokens.findMany();
        expect(tokensAfter.length).toBe(1);

        // The token hash should be different
        expect(tokensAfter[0].token).not.toBe(tokensBefore[0].token);
    });

    it("should reject a reused (old) refresh token after rotation", async () => {
        const cookies = await loginUser();

        // First refresh — succeeds and rotates the token
        await request(app).post("/api/v1/auth/refresh").set("Cookie", cookies);

        // Second refresh with the same (now old) cookie — should fail
        const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookies);

        expect(res.status).toBe(401);
    });

    it("should return 401 when no refresh token cookie is provided", async () => {
        const res = await request(app).post("/api/v1/auth/refresh");

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("Refresh token required");
    });

    it("should return 401 for an invalid refresh token", async () => {
        const res = await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", ["refreshToken=invalid.jwt.token"]);

        expect(res.status).toBe(401);
    });

    it("should issue new cookies with HttpOnly flag", async () => {
        const cookies = await loginUser();

        const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookies);

        const newCookies = res.headers["set-cookie"] as unknown as string[];
        const cookieStr = newCookies.join("; ");
        expect(cookieStr).toContain("HttpOnly");
    });
});
