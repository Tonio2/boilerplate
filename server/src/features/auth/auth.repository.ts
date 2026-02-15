import { and, eq, gt } from "drizzle-orm";

import { db } from "@config/db";

import { refreshTokens, users } from "./auth.schema";

export const authRepository = {
    findUserByEmail: (email: string) => db.query.users.findFirst({ where: eq(users.email, email) }),

    findUserById: (id: string) => db.query.users.findFirst({ where: eq(users.id, id) }),

    createUser: (email: string, hashedPassword: string) =>
        db
            .insert(users)
            .values({ email, password: hashedPassword, isEmailVerified: false })
            .returning()
            .then((rows) => rows[0]),

    updateUserEmailVerified: (userId: string) =>
        db.update(users).set({ isEmailVerified: true }).where(eq(users.id, userId)),

    updateUserPassword: (userId: string, hashedPassword: string) =>
        db
            .update(users)
            .set({
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            })
            .where(eq(users.id, userId)),

    setPasswordResetToken: (userId: string, tokenHash: string, expiresAt: number) =>
        db
            .update(users)
            .set({
                passwordResetToken: tokenHash,
                passwordResetExpires: expiresAt,
            })
            .where(eq(users.id, userId)),

    clearPasswordResetToken: (userId: string) =>
        db
            .update(users)
            .set({
                passwordResetToken: null,
                passwordResetExpires: null,
            })
            .where(eq(users.id, userId)),

    findUserByResetToken: (tokenHash: string) =>
        db.query.users.findFirst({
            where: and(
                eq(users.passwordResetToken, tokenHash),
                gt(users.passwordResetExpires, Date.now())
            ),
        }),

    insertRefreshToken: (token: string, userId: string) =>
        db.insert(refreshTokens).values({ token, userId }),

    findRefreshToken: (tokenHash: string) =>
        db.query.refreshTokens.findFirst({ where: eq(refreshTokens.token, tokenHash) }),

    deleteRefreshToken: (tokenHash: string) =>
        db.delete(refreshTokens).where(eq(refreshTokens.token, tokenHash)),

    deleteAllUserRefreshTokens: (userId: string) =>
        db.delete(refreshTokens).where(eq(refreshTokens.userId, userId)),

    findUserRefreshTokens: (userId: string) =>
        db.query.refreshTokens.findMany({ where: eq(refreshTokens.userId, userId) }),

    deleteUser: (userId: string) => db.delete(users).where(eq(users.id, userId)),
};

export type AuthRepository = typeof authRepository;
