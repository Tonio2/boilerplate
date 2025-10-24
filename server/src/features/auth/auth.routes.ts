import express from 'express';
import asyncHandler from 'express-async-handler';

import { register, login, logout, refresh, me, verifyEmail, forgotPassword, resetPassword } from './auth.controller';
import { authenticate } from './auth.middleware';


const router = express.Router();


// Routes
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.delete('/logout', asyncHandler(logout)); // Use DELETE for logout
router.post('/refresh', asyncHandler(refresh));
router.get('/me', authenticate, asyncHandler(me));
router.post('/verify-email', asyncHandler(verifyEmail));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

export default router;
