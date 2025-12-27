import { z } from "zod";

/**
 * Reusable password validation pattern
 * Equivalent to Joi's passwordPattern (auth.controller.ts:37-41)
 *
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character (!@#$%^&*)
 */
const passwordSchema = z
    .string()
    .min(1, "Password is required")
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{8,})/,
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character"
    );

/**
 * Register validation schema
 * Validates user registration with email and password
 */
export const registerSchema = z
    .object({
        email: z.string().email("Invalid email format"),
        password: passwordSchema,
    })
    .strict(); // Reject unknown keys (matches Joi default security behavior)

/**
 * Login validation schema
 * Validates user login with email and password
 */
export const loginSchema = z
    .object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
    })
    .strict();

/**
 * Forgot password validation schema
 * Validates email for password reset request
 */
export const forgotPasswordSchema = z
    .object({
        email: z.string().email("Invalid email format"),
    })
    .strict();

/**
 * Reset password validation schema
 * Validates token and new password for password reset
 */
export const resetPasswordSchema = z
    .object({
        password: passwordSchema,
        token: z.string().min(1, "Token is required"),
    })
    .strict();

/**
 * Verify email validation schema
 * Validates token for email verification
 */
export const verifyEmailSchema = z
    .object({
        token: z.string().min(1, "Token is required"),
    })
    .strict();

/**
 * Delete account validation schema
 * Validates password and confirmation for account deletion
 */
export const deleteAccountSchema = z
    .object({
        password: z.string().min(1, "Password is required"),
        confirmDeletion: z.literal(true, {
            errorMap: () => ({ message: "You must confirm account deletion" }),
        }),
    })
    .strict();

// ============================================
// AUTO-GENERATED TYPES (replaces manual interfaces)
// ============================================

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;
export type DeleteAccountBody = z.infer<typeof deleteAccountSchema>;
