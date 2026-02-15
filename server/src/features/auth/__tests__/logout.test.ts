import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "@/app";
import { db, loginUser, validUser } from "@/test/helpers";

import { refreshTokens, users } from "@features/auth/auth.schema";

describe("DELETE /api/v1/auth/logout", () => {
    it("should logout successfully and clear cookies", async () => {
        const cookies = await loginUser();

        const res = await request(app).delete("/api/v1/auth/logout").set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("Logged out");

        // Cookies should be cleared (set to empty with past expiry)
        const setCookies = res.headers["set-cookie"] as unknown as string[];
        const cookieStr = setCookies.join("; ");
        expect(cookieStr).toContain("accessToken=;");
        expect(cookieStr).toContain("refreshToken=;");
    });

    it("should remove the refresh token from the database", async () => {
        const cookies = await loginUser();

        const user = await db.query.users.findFirst({
            where: eq(users.email, validUser.email),
        });

        // Token exists before logout
        const tokensBefore = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.userId, user!.id),
        });
        expect(tokensBefore.length).toBe(1);

        await request(app).delete("/api/v1/auth/logout").set("Cookie", cookies);

        // Token deleted after logout
        const tokensAfter = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.userId, user!.id),
        });
        expect(tokensAfter.length).toBe(0);
    });

    it("should handle logout gracefully without cookies", async () => {
        const res = await request(app).delete("/api/v1/auth/logout");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
