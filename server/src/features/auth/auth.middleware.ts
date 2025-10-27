import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';

import { ApiError } from '@features/errors';

import env from '@config/env';

import { DecodedToken, AuthenticatedRequest } from './auth.type';

/**
 * Middleware d'authentification
 * Vérifie la présence et la validité du JWT
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract token from httpOnly cookie (prioritized for security)
  const token = req.cookies?.accessToken;

  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please provide a valid token.');
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedToken;

    // Attach user information to request
    req.user = decoded;

    next();
  } catch (error) {
    // JWT errors will be automatically handled by errorHandler
    // which converts them to ApiError.unauthorized
    throw error;
  }
};

/**
 * Middleware pour vérifier les rôles
 * À utiliser APRÈS authenticate
 *
 * @example
 * router.get('/admin', authenticate, authorize('admin'), adminController);
 * router.get('/staff', authenticate, authorize('admin', 'moderator'), staffController);
 */
export const authorize = (...allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      );
    }

    next();
  };
};

/**
 * Middleware optionnel pour extraire l'utilisateur sans le requérir
 * Utile pour les routes publiques qui peuvent avoir un comportement différent si authentifié
 */
export const optionalAuthenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract token from httpOnly cookie
  const token = req.cookies?.accessToken;

  if (!token) {
    // No token = no error, just continue
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedToken;
    req.user = decoded;
  } catch (error) {
    // In case of error, simply ignore (invalid/expired token)
    // User will be treated as unauthenticated
  }

  next();
};
