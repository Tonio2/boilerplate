import { Request, Response } from "express";

import env from "@config/env";

import { sendEmail } from "@features/email";

import { authRepository } from "./auth.repository";
import { createAuthService } from "./auth.service";
import { AuthenticatedRequest } from "./auth.type";
import {
    deleteAccountSchema,
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from "./auth.validation";

const authService = createAuthService(authRepository, sendEmail);

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const secure = env.NODE_ENV === "production";
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

function clearAuthCookies(res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
}

// ============================================
// REGISTER
// ============================================
export const register = async (req: Request, res: Response) => {
    const { email, password } = registerSchema.parse(req.body);
    const result = await authService.register(email, password);
    res.status(201).json({ success: true, message: result.message });
};

// ============================================
// LOGIN
// ============================================
export const login = async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json({ success: true, user: result.user });
};

// ============================================
// LOGOUT
// ============================================
export const logout = async (req: Request, res: Response) => {
    await authService.logout(req.cookies.refreshToken as string | undefined);
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out successfully" });
};

// ============================================
// REFRESH TOKEN
// ============================================
export const refresh = async (req: Request, res: Response) => {
    const result = await authService.refresh(req.cookies.refreshToken as string | undefined);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json({ success: true, message: "Token refreshed successfully" });
};

// ============================================
// GET CURRENT USER
// ============================================
export const me = async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.me(req.user!.id);
    res.json({ success: true, user });
};

// ============================================
// FORGOT PASSWORD
// ============================================
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    res.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
    });
};

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = async (req: Request, res: Response) => {
    const { password, token } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);
    res.json({
        success: true,
        message: "Password reset successfully. You can now login with your new password.",
    });
};

// ============================================
// VERIFY EMAIL
// ============================================
export const verifyEmail = async (req: Request, res: Response) => {
    const { token } = verifyEmailSchema.parse(req.body);
    await authService.verifyEmail(token);
    res.json({ success: true, message: "Email verified successfully. You can now login." });
};

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================
export const resendVerificationEmail = async (req: AuthenticatedRequest, res: Response) => {
    await authService.resendVerificationEmail(req.user!.id);
    res.json({
        success: true,
        message: "Verification email sent successfully. Please check your inbox.",
    });
};

// ============================================
// EXPORT USER DATA
// ============================================
export const exportUserData = async (req: AuthenticatedRequest, res: Response) => {
    const data = await authService.exportUserData(req.user!.id);
    res.json(data);
};

// ============================================
// DELETE ACCOUNT
// ============================================
export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
    const { password } = deleteAccountSchema.parse(req.body);
    await authService.deleteAccount(req.user!.id, password);
    clearAuthCookies(res);
    res.json({ success: true, message: "Account deleted successfully" });
};
