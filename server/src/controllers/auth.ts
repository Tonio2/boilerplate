import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import Joi from 'joi';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail';
import dotenv from 'dotenv';

// Validate environment variable
dotenv.config();
const requiredVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL', 'JWT_EMAIL_SECRET'];
requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`${varName} is not defined in environment variables`);
    }
});

const createTokens = (userId: string) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const passwordPattern = Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])(?=.{8,})'));

export const register = async (req: Request, res: Response) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: passwordPattern.required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }

    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_EMAIL_SECRET!, { expiresIn: '1h' });
    const verificationURL = `${process.env.CLIENT_URL}/verify-email/${token}`;

    await sendEmail(
        newUser.email,
        'Email Verification',
        `<p>Verify your email by clicking <a href="${verificationURL}">here</a>.</p>`,
    );

    res.status(201).json({ message: 'User registered successfully' });
};

export const login = async (req: Request, res: Response) => {

    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }

    const { accessToken, refreshToken } = createTokens(user.id);

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const newRefreshToken = new RefreshToken({ token: hashedRefreshToken, userId: user.id });
    await newRefreshToken.save();

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: { id: user.id, email: user.email, role: user.role }, accessToken });

};

export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await RefreshToken.deleteOne({ token: hashedRefreshToken });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
};

export const refresh = async (req: Request, res: Response) => {

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token required' });
        return;
    }

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const token = await RefreshToken.findOne({ token: hashedRefreshToken });


    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    if (!token || !token.userId.equals(decoded.id)) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
    }

    await RefreshToken.deleteOne({ token: hashedRefreshToken });

    const { accessToken, refreshToken: newRefreshToken } = createTokens(decoded.id);

    const hashedNewRefreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const newToken = new RefreshToken({ token: hashedNewRefreshToken, userId: decoded.id });
    await newToken.save();

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });

};

export const me = async (req: any, res: Response) => {
    const user = await User.findById(req.user.userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    res.json({ user: { id: user.id, email: user.email, role: user.role } });

};

export const forgotPassword = async (req: Request, res: Response) => {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404).json({ message: 'No user found with this email' });
        return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // Token valid for 15 minutes
    await user.save();

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
        user.email,
        'Password Reset Request',
        `<p>You requested to reset your password. Click the link below to reset it:</p>
               <a href="${resetURL}">${resetURL}</a>`,
    );

    res.status(200).json({ message: 'Password reset link sent to your email' });

};

export const resetPassword = async (req: Request, res: Response) => {
    const schema = Joi.object({
        password: passwordPattern.required(),
        token: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }

    const { password, token } = req.body;

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: resetTokenHash,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400).json({ message: 'Invalid or expired token' });
        return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });

};

//TODO: try catch only for decoded
export const verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET!) as any;
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.isEmailVerified) {
            res.status(400).json({ message: 'Email already verified' });
            return;
        }

        user.isEmailVerified = true;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    if (user.isEmailVerified) {
        res.status(400).json({ message: 'Email already verified' });
        return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_EMAIL_SECRET!, { expiresIn: '1h' });
    const verificationURL = `${process.env.CLIENT_URL}/verify-email/${token}`;

    await sendEmail(
        user.email,
        'Email Verification',
        `<p>Verify your email by clicking <a href="${verificationURL}">here</a>.</p>`,
    );

    res.status(200).json({ message: 'Verification email resent' });

};
