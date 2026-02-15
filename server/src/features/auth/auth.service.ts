import crypto from "crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import env from "@config/env";

import { ApiError } from "@features/errors";
import { logger } from "@features/logger";

import { type AuthRepository } from "./auth.repository";
import { type DecodedToken } from "./auth.type";

type EmailSender = (to: string, subject: string, html: string) => Promise<unknown>;

function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function createTokens(userId: string, role: string, isEmailVerified: boolean) {
    const accessToken = jwt.sign({ id: userId, role, isEmailVerified }, env.JWT_ACCESS_SECRET, {
        expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken };
}

export function createAuthService(repo: AuthRepository, emailSender: EmailSender) {
    return {
        async register(email: string, password: string) {
            const existingUser = await repo.findUserByEmail(email);
            if (existingUser) {
                throw ApiError.conflict("An account with this email already exists");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await repo.createUser(email, hashedPassword);

            const token = jwt.sign({ userId: newUser.id }, env.JWT_EMAIL_SECRET, {
                expiresIn: "1h",
            });
            const verificationURL = `${env.CLIENT_URL}/verify-email/${token}`;

            emailSender(
                newUser.email,
                "Email Verification",
                `<p>Welcome! Please verify your email by clicking <a href="${verificationURL}">here</a>.</p>
             <p>This link will expire in 1 hour.</p>`
            ).catch((err) => {
                logger.error("Error sending verification email:", err);
            });

            return {
                message: "Registration successful. Please check your email to verify your account.",
            };
        },

        async login(email: string, password: string) {
            const user = await repo.findUserByEmail(email);
            const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;

            if (!user || !isValidPassword) {
                throw ApiError.unauthorized("Invalid email or password");
            }

            const { accessToken, refreshToken } = createTokens(
                user.id,
                user.role,
                user.isEmailVerified
            );
            const hashedRefreshToken = hashToken(refreshToken);
            await repo.insertRefreshToken(hashedRefreshToken, user.id);

            return {
                accessToken,
                refreshToken,
                user: { id: user.id, email: user.email, role: user.role },
            };
        },

        async logout(rawRefreshToken: string | undefined) {
            if (rawRefreshToken) {
                await repo.deleteRefreshToken(hashToken(rawRefreshToken));
            }
        },

        async refresh(rawRefreshToken: string | undefined) {
            if (!rawRefreshToken) {
                throw ApiError.unauthorized("Refresh token required");
            }

            const decoded = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as DecodedToken;
            const hashed = hashToken(rawRefreshToken);

            const tokenDoc = await repo.findRefreshToken(hashed);
            if (!tokenDoc || tokenDoc.userId !== decoded.id) {
                throw ApiError.unauthorized("Invalid refresh token");
            }

            await repo.deleteRefreshToken(hashed);

            const user = await repo.findUserById(decoded.id);
            if (!user) {
                throw ApiError.notFound("User not found");
            }

            const { accessToken, refreshToken: newRefreshToken } = createTokens(
                user.id,
                user.role,
                user.isEmailVerified
            );
            await repo.insertRefreshToken(hashToken(newRefreshToken), decoded.id);

            return { accessToken, refreshToken: newRefreshToken };
        },

        async me(userId: string) {
            const user = await repo.findUserById(userId);
            if (!user) {
                throw ApiError.notFound("User not found");
            }

            return {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            };
        },

        async forgotPassword(email: string) {
            const user = await repo.findUserByEmail(email);

            if (!user) {
                return;
            }

            const resetToken = crypto.randomBytes(32).toString("hex");
            const resetTokenHash = hashToken(resetToken);

            await repo.setPasswordResetToken(user.id, resetTokenHash, Date.now() + 15 * 60 * 1000);

            const resetURL = `${env.CLIENT_URL}/reset-password/${resetToken}`;

            try {
                await emailSender(
                    user.email,
                    "Password Reset Request",
                    `<p>You requested to reset your password. Click the link below to reset it:</p>
             <a href="${resetURL}">Reset Password</a>
             <p>This link will expire in 15 minutes.</p>
             <p>If you didn't request this, please ignore this email.</p>`
                );
            } catch {
                await repo.clearPasswordResetToken(user.id);
                throw ApiError.internal(
                    "Failed to send password reset email. Please try again later."
                );
            }
        },

        async resetPassword(token: string, newPassword: string) {
            const resetTokenHash = hashToken(token);

            const user = await repo.findUserByResetToken(resetTokenHash);
            if (!user) {
                throw ApiError.badRequest("Invalid or expired password reset token");
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await repo.updateUserPassword(user.id, hashedPassword);
            await repo.deleteAllUserRefreshTokens(user.id);
        },

        async verifyEmail(token: string) {
            let decoded: { userId: string };
            try {
                decoded = jwt.verify(token, env.JWT_EMAIL_SECRET) as { userId: string };
            } catch {
                throw ApiError.badRequest("Invalid or expired verification token");
            }

            const user = await repo.findUserById(decoded.userId);
            if (!user) {
                throw ApiError.notFound("User not found");
            }

            if (user.isEmailVerified) {
                throw ApiError.badRequest("Email already verified");
            }

            await repo.updateUserEmailVerified(user.id);
        },

        async resendVerificationEmail(userId: string) {
            const user = await repo.findUserById(userId);
            if (!user) {
                throw ApiError.notFound("No account found with this email");
            }

            if (user.isEmailVerified) {
                throw ApiError.badRequest("Email already verified");
            }

            const token = jwt.sign({ userId: user.id }, env.JWT_EMAIL_SECRET, {
                expiresIn: "1h",
            });
            const verificationURL = `${env.CLIENT_URL}/verify-email/${token}`;

            try {
                await emailSender(
                    user.email,
                    "Email Verification",
                    `<p>Verify your email by clicking <a href="${verificationURL}">here</a>.</p>
             <p>This link will expire in 1 hour.</p>`
                );
            } catch {
                throw ApiError.internal(
                    "Failed to send verification email. Please try again later."
                );
            }
        },

        async exportUserData(userId: string) {
            const user = await repo.findUserById(userId);
            if (!user) {
                throw ApiError.notFound("User not found");
            }

            const userRefreshTokens = await repo.findUserRefreshTokens(user.id);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                activeSessions: userRefreshTokens.length,
                exportDate: new Date().toISOString(),
            };
        },

        async deleteAccount(userId: string, password: string) {
            const user = await repo.findUserById(userId);
            if (!user) {
                throw ApiError.notFound("User not found");
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw ApiError.unauthorized("Invalid password");
            }

            await repo.deleteAllUserRefreshTokens(user.id);
            await repo.deleteUser(user.id);
        },
    };
}

export type AuthService = ReturnType<typeof createAuthService>;
