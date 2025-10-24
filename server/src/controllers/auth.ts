import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, refreshTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import Joi from 'joi';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail';
import { ApiError } from '../utils/apiError';
import env from '../env';

const createTokens = (userId: string) => {
    const accessToken = jwt.sign({ id: userId }, env.JWT_ACCESS_SECRET!, {
        expiresIn: '15m'
    });
    const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d'
    });
    return { accessToken, refreshToken };
};

const passwordPattern = Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])(?=.{8,})'))
    .message('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character');

// ============================================
// REGISTER
// ============================================
export const register = async (req: Request, res: Response) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: passwordPattern.required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        throw ApiError.badRequest('Validation failed', error.details);
    }

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (existingUser) {
        throw ApiError.conflict('An account with this email already exists');
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
        isEmailVerified: false
    }).returning();

    // Send verification email
    const token = jwt.sign({ userId: newUser.id }, env.JWT_EMAIL_SECRET!, {
        expiresIn: '1h'
    });
    const verificationURL = `${env.CLIENT_URL}/verify-email/${token}`;

    try {
        await sendEmail(
            newUser.email,
            'Email Verification',
            `<p>Welcome! Please verify your email by clicking <a href="${verificationURL}">here</a>.</p>
             <p>This link will expire in 1 hour.</p>`,
        );
    } catch (err) {
        console.error('Error sending verification email:', err);
        // Pas d'erreur bloquante ici
        res.status(201).json({
            success: true,
            message: 'Account created, but verification email could not be sent. Please contact support.'
        });
        return;
    }

    res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.'
    });
};

// ============================================
// LOGIN
// ============================================
export const login = async (req: Request, res: Response) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        throw ApiError.badRequest('Validation failed', error.details);
    }

    const { email, password } = req.body;

    // Find user
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    // Verify user AND password together to avoid timing attack
    const isValidPassword = user
        ? await bcrypt.compare(password, user.password)
        : false;

    if (!user || !isValidPassword) {
        // Generic message to prevent email enumeration
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Check email is verified
    if (!user.isEmailVerified) {
        throw ApiError.forbidden(
            'Please verify your email before logging in. Check your inbox or request a new verification email.'
        );
    }

    // Create tokens
    const { accessToken, refreshToken } = createTokens(user.id);

    // Store hashed refresh token in DB
    const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    await db.insert(refreshTokens).values({
        token: hashedRefreshToken,
        userId: user.id
    });

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            role: user.role
        },
        accessToken
    });
};

// ============================================
// LOGOUT
// ============================================
export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        const hashedRefreshToken = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

        await db.delete(refreshTokens)
            .where(eq(refreshTokens.token, hashedRefreshToken));
    }

    res.clearCookie('refreshToken');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// ============================================
// REFRESH TOKEN
// ============================================
export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw ApiError.unauthorized('Refresh token required');
    }

    // Verify JWT first (security)
    let decoded: any;
    try {
        decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET!);
    } catch (error) {
        // Error handler will handle this automatically
        throw error;
    }

    // Verify token exists in DB
    const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    const tokenDoc = await db.query.refreshTokens.findFirst({
        where: eq(refreshTokens.token, hashedRefreshToken)
    });

    if (!tokenDoc || tokenDoc.userId !== decoded.id) {
        throw ApiError.unauthorized('Invalid refresh token');
    }

    // Delete old token
    await db.delete(refreshTokens)
        .where(eq(refreshTokens.token, hashedRefreshToken));

    // Create new tokens
    const { accessToken, refreshToken: newRefreshToken } = createTokens(decoded.id);

    // Store new refresh token
    const hashedNewRefreshToken = crypto
        .createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

    await db.insert(refreshTokens).values({
        token: hashedNewRefreshToken,
        userId: decoded.id
    });

    // Update cookie
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
        success: true,
        accessToken
    });
};

// ============================================
// GET CURRENT USER
// ============================================
export const me = async (req: any, res: Response) => {
    const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.id)
    });

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        }
    });
};

// ============================================
// FORGOT PASSWORD
// ============================================
export const forgotPassword = async (req: Request, res: Response) => {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        throw ApiError.badRequest('Validation failed', error.details);
    }

    const { email } = req.body;

    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    // To prevent email enumeration, always return the same message
    // even if user doesn't exist
    if (!user) {
        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });
        return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    await db.update(users)
        .set({
            passwordResetToken: resetTokenHash,
            passwordResetExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
        })
        .where(eq(users.id, user.id));

    // Send email
    const resetURL = `${env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
        await sendEmail(
            user.email,
            'Password Reset Request',
            `<p>You requested to reset your password. Click the link below to reset it:</p>
             <a href="${resetURL}">Reset Password</a>
             <p>This link will expire in 15 minutes.</p>
             <p>If you didn't request this, please ignore this email.</p>`,
        );
    } catch (emailError) {
        // Rollback if email fails
        await db.update(users)
            .set({
                passwordResetToken: null,
                passwordResetExpires: null,
            })
            .where(eq(users.id, user.id));

        throw ApiError.internal('Failed to send password reset email. Please try again later.');
    }

    res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
    });
};

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = async (req: Request, res: Response) => {
    const schema = Joi.object({
        password: passwordPattern.required(),
        token: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        throw ApiError.badRequest('Validation failed', error.details);
    }

    const { password, token } = req.body;

    // Hash token to compare with DB
    const resetTokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Find user with valid token
    const user = await db.query.users.findFirst({
        where: and(
            eq(users.passwordResetToken, resetTokenHash),
            gt(users.passwordResetExpires, Date.now())
        )
    });

    if (!user) {
        throw ApiError.badRequest('Invalid or expired password reset token');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.update(users)
        .set({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        })
        .where(eq(users.id, user.id));

    // Invalidate all refresh tokens (security)
    await db.delete(refreshTokens)
        .where(eq(refreshTokens.userId, user.id));

    res.status(200).json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.'
    });
};

// ============================================
// VERIFY EMAIL
// ============================================
export const verifyEmail = async (req: Request, res: Response) => {
    const schema = Joi.object({
        token: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        throw ApiError.badRequest('Validation failed', error.details);
    }

    const { token } = req.body;

    // Verify JWT
    let decoded: any;
    try {
        decoded = jwt.verify(token, env.JWT_EMAIL_SECRET!);
    } catch (jwtError) {
        throw ApiError.badRequest('Invalid or expired verification token');
    }

    // Find user
    const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId)
    });

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    if (user.isEmailVerified) {
        throw ApiError.badRequest('Email already verified');
    }

    // Verify email
    await db.update(users)
        .set({ isEmailVerified: true })
        .where(eq(users.id, user.id));

    res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now login.'
    });
};

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================
export const resendVerificationEmail = async (req: Request, res: Response) => {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        throw ApiError.badRequest('Validation failed', error.details);
    }

    const { email } = req.body;
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!user) {
        throw ApiError.notFound('No account found with this email');
    }

    if (user.isEmailVerified) {
        throw ApiError.badRequest('Email already verified');
    }

    // Generate new token
    const token = jwt.sign({ userId: user.id }, env.JWT_EMAIL_SECRET!, {
        expiresIn: '1h'
    });
    const verificationURL = `${env.CLIENT_URL}/verify-email/${token}`;

    try {
        await sendEmail(
            user.email,
            'Email Verification',
            `<p>Verify your email by clicking <a href="${verificationURL}">here</a>.</p>
             <p>This link will expire in 1 hour.</p>`,
        );
    } catch (emailError) {
        throw ApiError.internal('Failed to send verification email. Please try again later.');
    }

    res.status(200).json({
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.'
    });
};
