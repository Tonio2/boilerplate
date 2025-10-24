// src/middleware/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import env from '../env';

interface DecodedToken {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Étendre l'interface Request pour inclure user
export interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

/**
 * Middleware d'authentification
 * Vérifie la présence et la validité du JWT
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extraire le token depuis le header Authorization ou les cookies
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.cookies?.accessToken; // Note: tu utilisais 'token' mais devrait être 'accessToken'

  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please provide a valid token.');
  }

  try {
    // Vérifier le JWT
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedToken;

    // Attacher les informations de l'utilisateur à la requête
    req.user = decoded;

    next();
  } catch (error) {
    // Les erreurs JWT seront automatiquement gérées par l'errorHandler
    // qui va les convertir en ApiError.unauthorized
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
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.cookies?.accessToken;

  if (!token) {
    // Pas de token = pas d'erreur, juste continuer
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedToken;
    req.user = decoded;
  } catch (error) {
    // En cas d'erreur, on ignore simplement (token invalide/expiré)
    // L'utilisateur sera traité comme non-authentifié
  }

  next();
};
