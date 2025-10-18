import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
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

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw ApiError.conflict('An account with this email already exists');
    }

    // Créer le nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        email,
        password: hashedPassword,
        isEmailVerified: false
    });
    await newUser.save();

    // Envoyer l'email de vérification
    const token = jwt.sign({ userId: newUser.id }, env.JWT_EMAIL_SECRET!, {
        expiresIn: '1h'
    });
    const verificationURL = `${env.CLIENT_URL}/verify-email/${token}`;

    await sendEmail(
        newUser.email,
        'Email Verification',
        `<p>Welcome! Please verify your email by clicking <a href="${verificationURL}">here</a>.</p>
         <p>This link will expire in 1 hour.</p>`,
    );

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

    // Trouver l'utilisateur
    const user = await User.findOne({ email });

    // Vérifier l'utilisateur ET le mot de passe en même temps
    // pour éviter le timing attack
    const isValidPassword = user
        ? await bcrypt.compare(password, user.password)
        : false;

    if (!user || !isValidPassword) {
        // Message générique pour éviter l'énumération d'emails
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Vérifier que l'email est vérifié
    if (!user.isEmailVerified) {
        throw ApiError.forbidden(
            'Please verify your email before logging in. Check your inbox or request a new verification email.'
        );
    }

    // Créer les tokens
    const { accessToken, refreshToken } = createTokens(user.id);

    // Stocker le refresh token hashé en DB
    const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    const newRefreshToken = new RefreshToken({
        token: hashedRefreshToken,
        userId: user.id
    });
    await newRefreshToken.save();

    // Définir le cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
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

        await RefreshToken.deleteOne({ token: hashedRefreshToken });
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

    // Vérifier le JWT en premier (sécurité)
    let decoded: any;
    try {
        decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET!);
    } catch (error) {
        // L'errorHandler va gérer automatiquement
        throw error;
    }

    // Vérifier que le token existe en DB
    const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    const tokenDoc = await RefreshToken.findOne({ token: hashedRefreshToken });

    if (!tokenDoc || !tokenDoc.userId.equals(decoded.id)) {
        throw ApiError.unauthorized('Invalid refresh token');
    }

    // Supprimer l'ancien token
    await RefreshToken.deleteOne({ token: hashedRefreshToken });

    // Créer de nouveaux tokens
    const { accessToken, refreshToken: newRefreshToken } = createTokens(decoded.id);

    // Stocker le nouveau refresh token
    const hashedNewRefreshToken = crypto
        .createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

    const newToken = new RefreshToken({
        token: hashedNewRefreshToken,
        userId: decoded.id
    });
    await newToken.save();

    // Mettre à jour le cookie
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
    const user = await User.findById(req.user.id);

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

    const user = await User.findOne({ email });

    // Pour éviter l'énumération d'emails, toujours retourner le même message
    // même si l'utilisateur n'existe pas
    if (!user) {
        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });
        return;
    }

    // Générer le token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Envoyer l'email
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
        // Rollback si l'email échoue
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

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

    // Hasher le token pour comparer avec la DB
    const resetTokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Trouver l'utilisateur avec un token valide
    const user = await User.findOne({
        passwordResetToken: resetTokenHash,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw ApiError.badRequest('Invalid or expired password reset token');
    }

    // Mettre à jour le mot de passe
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalider tous les refresh tokens existants (sécurité)
    await RefreshToken.deleteMany({ userId: user._id });

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

    // Vérifier le JWT
    let decoded: any;
    try {
        decoded = jwt.verify(token, env.JWT_EMAIL_SECRET!);
    } catch (jwtError) {
        throw ApiError.badRequest('Invalid or expired verification token');
    }

    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId);

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    if (user.isEmailVerified) {
        throw ApiError.badRequest('Email already verified');
    }

    // Vérifier l'email
    user.isEmailVerified = true;
    await user.save();

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
    const user = await User.findOne({ email });

    if (!user) {
        throw ApiError.notFound('No account found with this email');
    }

    if (user.isEmailVerified) {
        throw ApiError.badRequest('Email already verified');
    }

    // Générer un nouveau token
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
