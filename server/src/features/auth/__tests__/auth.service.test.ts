import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

import env from "@config/env";

import { type AuthRepository } from "../auth.repository";
import { createAuthService } from "../auth.service";

// Pre-computed bcrypt hash for "Password1!" to keep tests synchronous where possible
const VALID_PASSWORD = "Password1!";
let HASHED_PASSWORD: string;

type MockedAuthRepository = {
    [K in keyof AuthRepository]: ReturnType<typeof vi.fn>;
};

function createMockRepo(): MockedAuthRepository {
    return {
        findUserByEmail: vi.fn(),
        findUserById: vi.fn(),
        createUser: vi.fn(),
        updateUserEmailVerified: vi.fn(),
        updateUserPassword: vi.fn(),
        setPasswordResetToken: vi.fn(),
        clearPasswordResetToken: vi.fn(),
        findUserByResetToken: vi.fn(),
        insertRefreshToken: vi.fn(),
        findRefreshToken: vi.fn(),
        deleteRefreshToken: vi.fn(),
        deleteAllUserRefreshTokens: vi.fn(),
        findUserRefreshTokens: vi.fn(),
        deleteUser: vi.fn(),
    };
}

function createService(repo: MockedAuthRepository, emailSender = vi.fn()) {
    return createAuthService(repo as unknown as AuthRepository, emailSender);
}

function makeUser(overrides: Record<string, unknown> = {}) {
    return {
        id: "user-1",
        email: "test@example.com",
        password: HASHED_PASSWORD,
        role: "user",
        isEmailVerified: false,
        passwordResetToken: null,
        passwordResetExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

beforeEach(async () => {
    HASHED_PASSWORD = await bcrypt.hash(VALID_PASSWORD, 10);
});

// ============================================
// REGISTER
// ============================================
describe("AuthService.register", () => {
    it("should throw conflict if email already exists", async () => {
        const repo = createMockRepo();
        repo.findUserByEmail.mockResolvedValue(makeUser());
        const service = createService(repo);

        await expect(service.register("test@example.com", VALID_PASSWORD)).rejects.toThrow(
            "An account with this email already exists"
        );
    });

    it("should create user and send verification email", async () => {
        const repo = createMockRepo();
        const mockEmailSender = vi.fn().mockResolvedValue({ success: true });
        repo.findUserByEmail.mockResolvedValue(null);
        repo.createUser.mockResolvedValue(makeUser());
        const service = createService(repo, mockEmailSender);

        const result = await service.register("test@example.com", VALID_PASSWORD);

        expect(result.message).toContain("Registration successful");
        expect(repo.createUser).toHaveBeenCalledOnce();
        // Password should be hashed, not plain
        const [, hashedArg] = repo.createUser.mock.calls[0];
        expect(hashedArg).not.toBe(VALID_PASSWORD);
        expect(await bcrypt.compare(VALID_PASSWORD, hashedArg)).toBe(true);
        expect(mockEmailSender).toHaveBeenCalledWith(
            "test@example.com",
            "Email Verification",
            expect.stringContaining("verify-email")
        );
    });

    it("should not throw if email sending fails (fire-and-forget)", async () => {
        const repo = createMockRepo();
        const mockEmailSender = vi.fn().mockRejectedValue(new Error("SMTP down"));
        repo.findUserByEmail.mockResolvedValue(null);
        repo.createUser.mockResolvedValue(makeUser());
        const service = createService(repo, mockEmailSender);

        await expect(service.register("test@example.com", VALID_PASSWORD)).resolves.toBeDefined();
    });
});

// ============================================
// LOGIN
// ============================================
describe("AuthService.login", () => {
    it("should return tokens and user on valid credentials", async () => {
        const repo = createMockRepo();
        repo.findUserByEmail.mockResolvedValue(makeUser());
        repo.insertRefreshToken.mockResolvedValue(undefined);
        const service = createService(repo);

        const result = await service.login("test@example.com", VALID_PASSWORD);

        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.user).toEqual({
            id: "user-1",
            email: "test@example.com",
            role: "user",
        });
        expect(result.user).not.toHaveProperty("password");
        expect(repo.insertRefreshToken).toHaveBeenCalledOnce();
    });

    it("should throw unauthorized for non-existent user", async () => {
        const repo = createMockRepo();
        repo.findUserByEmail.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.login("nobody@example.com", VALID_PASSWORD)).rejects.toThrow(
            "Invalid email or password"
        );
    });

    it("should throw unauthorized for wrong password", async () => {
        const repo = createMockRepo();
        repo.findUserByEmail.mockResolvedValue(makeUser());
        const service = createService(repo);

        await expect(service.login("test@example.com", "WrongPassword1!")).rejects.toThrow(
            "Invalid email or password"
        );
    });

    it("should return same error message for wrong email and wrong password (anti-enumeration)", async () => {
        const repo = createMockRepo();
        const service = createService(repo);

        repo.findUserByEmail.mockResolvedValue(null);
        const wrongEmailErr = service
            .login("nobody@example.com", VALID_PASSWORD)
            .catch((e: Error) => e);

        repo.findUserByEmail.mockResolvedValue(makeUser());
        const wrongPassErr = service
            .login("test@example.com", "WrongPassword1!")
            .catch((e: Error) => e);

        const [e1, e2] = await Promise.all([wrongEmailErr, wrongPassErr]);
        expect((e1 as Error).message).toBe((e2 as Error).message);
    });

    it("should store hashed refresh token in DB (not raw)", async () => {
        const repo = createMockRepo();
        repo.findUserByEmail.mockResolvedValue(makeUser());
        repo.insertRefreshToken.mockResolvedValue(undefined);
        const service = createService(repo);

        const result = await service.login("test@example.com", VALID_PASSWORD);

        const [storedHash] = repo.insertRefreshToken.mock.calls[0];
        expect(storedHash).not.toBe(result.refreshToken);
    });
});

// ============================================
// LOGOUT
// ============================================
describe("AuthService.logout", () => {
    it("should delete refresh token from DB", async () => {
        const repo = createMockRepo();
        repo.deleteRefreshToken.mockResolvedValue(undefined);
        const service = createService(repo);

        await service.logout("some-token");

        expect(repo.deleteRefreshToken).toHaveBeenCalledOnce();
    });

    it("should do nothing if no refresh token provided", async () => {
        const repo = createMockRepo();
        const service = createService(repo);

        await service.logout(undefined);

        expect(repo.deleteRefreshToken).not.toHaveBeenCalled();
    });
});

// ============================================
// REFRESH
// ============================================
describe("AuthService.refresh", () => {
    it("should throw if no refresh token", async () => {
        const repo = createMockRepo();
        const service = createService(repo);

        await expect(service.refresh(undefined)).rejects.toThrow("Refresh token required");
    });

    it("should throw for invalid JWT", async () => {
        const repo = createMockRepo();
        const service = createService(repo);

        await expect(service.refresh("invalid.jwt.token")).rejects.toThrow();
    });

    it("should throw if token not found in DB", async () => {
        const repo = createMockRepo();
        const validToken = jwt.sign({ id: "user-1" }, env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });
        repo.findRefreshToken.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.refresh(validToken)).rejects.toThrow("Invalid refresh token");
    });

    it("should throw if token userId does not match JWT", async () => {
        const repo = createMockRepo();
        const validToken = jwt.sign({ id: "user-1" }, env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });
        repo.findRefreshToken.mockResolvedValue({ token: "hash", userId: "user-2" });
        const service = createService(repo);

        await expect(service.refresh(validToken)).rejects.toThrow("Invalid refresh token");
    });

    it("should delete old token and create new one (rotation)", async () => {
        const repo = createMockRepo();
        const user = makeUser();
        const validToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });
        repo.findRefreshToken.mockResolvedValue({ token: "old-hash", userId: user.id });
        repo.deleteRefreshToken.mockResolvedValue(undefined);
        repo.findUserById.mockResolvedValue(user);
        repo.insertRefreshToken.mockResolvedValue(undefined);
        const service = createService(repo);

        const result = await service.refresh(validToken);

        expect(repo.deleteRefreshToken).toHaveBeenCalledOnce();
        expect(repo.insertRefreshToken).toHaveBeenCalledOnce();
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
    });

    it("should throw if user was deleted between token creation and refresh", async () => {
        const repo = createMockRepo();
        const validToken = jwt.sign({ id: "user-1" }, env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });
        repo.findRefreshToken.mockResolvedValue({ token: "hash", userId: "user-1" });
        repo.deleteRefreshToken.mockResolvedValue(undefined);
        repo.findUserById.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.refresh(validToken)).rejects.toThrow("User not found");
    });
});

// ============================================
// ME
// ============================================
describe("AuthService.me", () => {
    it("should return sanitized user data", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(makeUser());
        const service = createService(repo);

        const result = await service.me("user-1");

        expect(result).toEqual({
            id: "user-1",
            email: "test@example.com",
            role: "user",
            isEmailVerified: false,
        });
        expect(result).not.toHaveProperty("password");
    });

    it("should throw if user not found", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.me("nonexistent")).rejects.toThrow("User not found");
    });
});

// ============================================
// FORGOT PASSWORD
// ============================================
describe("AuthService.forgotPassword", () => {
    it("should silently return for non-existent email (anti-enumeration)", async () => {
        const repo = createMockRepo();
        const mockEmailSender = vi.fn();
        repo.findUserByEmail.mockResolvedValue(null);
        const service = createService(repo, mockEmailSender);

        await expect(service.forgotPassword("nobody@example.com")).resolves.toBeUndefined();
        expect(mockEmailSender).not.toHaveBeenCalled();
    });

    it("should set reset token and send email for existing user", async () => {
        const repo = createMockRepo();
        const mockEmailSender = vi.fn().mockResolvedValue({ success: true });
        repo.findUserByEmail.mockResolvedValue(makeUser());
        repo.setPasswordResetToken.mockResolvedValue(undefined);
        const service = createService(repo, mockEmailSender);

        await service.forgotPassword("test@example.com");

        expect(repo.setPasswordResetToken).toHaveBeenCalledWith(
            "user-1",
            expect.any(String),
            expect.any(Number)
        );
        expect(mockEmailSender).toHaveBeenCalledWith(
            "test@example.com",
            "Password Reset Request",
            expect.stringContaining("reset-password")
        );
    });

    it("should rollback reset token if email sending fails", async () => {
        const repo = createMockRepo();
        const mockEmailSender = vi.fn().mockRejectedValue(new Error("SMTP down"));
        repo.findUserByEmail.mockResolvedValue(makeUser());
        repo.setPasswordResetToken.mockResolvedValue(undefined);
        repo.clearPasswordResetToken.mockResolvedValue(undefined);
        const service = createService(repo, mockEmailSender);

        await expect(service.forgotPassword("test@example.com")).rejects.toThrow(
            "Failed to send password reset email"
        );
        expect(repo.clearPasswordResetToken).toHaveBeenCalledWith("user-1");
    });
});

// ============================================
// RESET PASSWORD
// ============================================
describe("AuthService.resetPassword", () => {
    it("should throw for invalid or expired token", async () => {
        const repo = createMockRepo();
        repo.findUserByResetToken.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.resetPassword("bad-token", "NewPassword1!")).rejects.toThrow(
            "Invalid or expired password reset token"
        );
    });

    it("should update password and invalidate all refresh tokens", async () => {
        const repo = createMockRepo();
        repo.findUserByResetToken.mockResolvedValue(makeUser());
        repo.updateUserPassword.mockResolvedValue(undefined);
        repo.deleteAllUserRefreshTokens.mockResolvedValue(undefined);
        const service = createService(repo);

        await service.resetPassword("valid-token", "NewPassword1!");

        expect(repo.updateUserPassword).toHaveBeenCalledWith("user-1", expect.any(String));
        // Password should be hashed
        const [, hashedArg] = repo.updateUserPassword.mock.calls[0];
        expect(await bcrypt.compare("NewPassword1!", hashedArg)).toBe(true);
        expect(repo.deleteAllUserRefreshTokens).toHaveBeenCalledWith("user-1");
    });
});

// ============================================
// VERIFY EMAIL
// ============================================
describe("AuthService.verifyEmail", () => {
    it("should throw for invalid JWT token", async () => {
        const repo = createMockRepo();
        const service = createService(repo);

        await expect(service.verifyEmail("invalid-token")).rejects.toThrow(
            "Invalid or expired verification token"
        );
    });

    it("should throw if user not found", async () => {
        const repo = createMockRepo();
        const token = jwt.sign({ userId: "user-1" }, env.JWT_EMAIL_SECRET, { expiresIn: "1h" });
        repo.findUserById.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.verifyEmail(token)).rejects.toThrow("User not found");
    });

    it("should throw if email already verified", async () => {
        const repo = createMockRepo();
        const token = jwt.sign({ userId: "user-1" }, env.JWT_EMAIL_SECRET, { expiresIn: "1h" });
        repo.findUserById.mockResolvedValue(makeUser({ isEmailVerified: true }));
        const service = createService(repo);

        await expect(service.verifyEmail(token)).rejects.toThrow("Email already verified");
    });

    it("should mark email as verified", async () => {
        const repo = createMockRepo();
        const token = jwt.sign({ userId: "user-1" }, env.JWT_EMAIL_SECRET, { expiresIn: "1h" });
        repo.findUserById.mockResolvedValue(makeUser());
        repo.updateUserEmailVerified.mockResolvedValue(undefined);
        const service = createService(repo);

        await service.verifyEmail(token);

        expect(repo.updateUserEmailVerified).toHaveBeenCalledWith("user-1");
    });
});

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================
describe("AuthService.resendVerificationEmail", () => {
    it("should throw if user not found", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.resendVerificationEmail("user-1")).rejects.toThrow("No account found");
    });

    it("should throw if already verified", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(makeUser({ isEmailVerified: true }));
        const service = createService(repo);

        await expect(service.resendVerificationEmail("user-1")).rejects.toThrow(
            "Email already verified"
        );
    });

    it("should send verification email", async () => {
        const repo = createMockRepo();
        const mockEmailSender = vi.fn().mockResolvedValue({ success: true });
        repo.findUserById.mockResolvedValue(makeUser());
        const service = createService(repo, mockEmailSender);

        await service.resendVerificationEmail("user-1");

        expect(mockEmailSender).toHaveBeenCalledWith(
            "test@example.com",
            "Email Verification",
            expect.stringContaining("verify-email")
        );
    });

    it("should throw if email sending fails", async () => {
        const repo = createMockRepo();
        const mockEmailSender = vi.fn().mockRejectedValue(new Error("SMTP down"));
        repo.findUserById.mockResolvedValue(makeUser());
        const service = createService(repo, mockEmailSender);

        await expect(service.resendVerificationEmail("user-1")).rejects.toThrow(
            "Failed to send verification email"
        );
    });
});

// ============================================
// EXPORT USER DATA
// ============================================
describe("AuthService.exportUserData", () => {
    it("should throw if user not found", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.exportUserData("user-1")).rejects.toThrow("User not found");
    });

    it("should return export data without sensitive fields", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(makeUser());
        repo.findUserRefreshTokens.mockResolvedValue([{ id: "t1" }, { id: "t2" }]);
        const service = createService(repo);

        const result = await service.exportUserData("user-1");

        expect(result.user.email).toBe("test@example.com");
        expect(result.user).not.toHaveProperty("password");
        expect(result.activeSessions).toBe(2);
        expect(result.exportDate).toBeDefined();
    });
});

// ============================================
// DELETE ACCOUNT
// ============================================
describe("AuthService.deleteAccount", () => {
    it("should throw if user not found", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(null);
        const service = createService(repo);

        await expect(service.deleteAccount("user-1", VALID_PASSWORD)).rejects.toThrow(
            "User not found"
        );
    });

    it("should throw for wrong password", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(makeUser());
        const service = createService(repo);

        await expect(service.deleteAccount("user-1", "WrongPassword1!")).rejects.toThrow(
            "Invalid password"
        );
    });

    it("should delete refresh tokens then user on valid password", async () => {
        const repo = createMockRepo();
        repo.findUserById.mockResolvedValue(makeUser());
        repo.deleteAllUserRefreshTokens.mockResolvedValue(undefined);
        repo.deleteUser.mockResolvedValue(undefined);
        const service = createService(repo);

        await service.deleteAccount("user-1", VALID_PASSWORD);

        expect(repo.deleteAllUserRefreshTokens).toHaveBeenCalledWith("user-1");
        expect(repo.deleteUser).toHaveBeenCalledWith("user-1");
        // Verify order: tokens deleted before user
        const deleteTokensOrder = repo.deleteAllUserRefreshTokens.mock.invocationCallOrder[0];
        const deleteUserOrder = repo.deleteUser.mock.invocationCallOrder[0];
        expect(deleteTokensOrder).toBeLessThan(deleteUserOrder);
    });
});
