// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';
import env from '../env';

/**
 * Extrait les erreurs de validation depuis différents types d'erreurs
 */
function extractValidationErrors(err: any): any[] {
    // Erreurs Joi
    if (err.details && Array.isArray(err.details)) {
        return err.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message.replace(/['"]/g, ''),
        }));
    }

    // Erreurs Mongoose
    if (err.errors) {
        return Object.keys(err.errors).map((key) => ({
            field: key,
            message: err.errors[key].message,
        }));
    }

    return [];
}

/**
 * Convertit les erreurs connues en ApiError
 */
function normalizeError(err: Error): ApiError {
    // Si c'est déjà une ApiError, la retourner telle quelle
    if (err instanceof ApiError) {
        return err;
    }

    // Erreurs de validation (Joi)
    if (err.name === 'ValidationError' && (err as any).isJoi) {
        const errors = extractValidationErrors(err);
        return ApiError.badRequest('Validation failed', errors);
    }

    // Erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
        const errors = extractValidationErrors(err);
        return ApiError.badRequest('Validation failed', errors);
    }

    // Erreur de duplicate key MongoDB
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        const field = Object.keys((err as any).keyPattern || {})[0];
        return ApiError.conflict(
            field ? `${field} already exists` : 'Resource already exists'
        );
    }

    // Erreur de cast Mongoose (ObjectId invalide)
    if (err.name === 'CastError') {
        return ApiError.badRequest('Invalid ID format');
    }

    // Erreurs JWT
    if (err.name === 'JsonWebTokenError') {
        return ApiError.unauthorized('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return ApiError.unauthorized('Token expired');
    }

    // Erreur inconnue = 500 Internal Server Error
    return ApiError.internal(
        env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    );
}

/**
 * Middleware de gestion centralisée des erreurs
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Normaliser l'erreur
    const apiError = normalizeError(err);

    // Logger selon la sévérité
    const logData = {
        message: apiError.message,
        statusCode: apiError.statusCode,
        route: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: (req as any).user?.id,
        ...(apiError.errors && { validationErrors: apiError.errors }),
    };

    if (!apiError.isOperational || apiError.statusCode >= 500) {
        // Erreur critique
        logger.error({
            ...logData,
            stack: apiError.stack,
        });
    } else if (apiError.statusCode >= 400) {
        // Erreur client (warning)
        logger.warn(logData);
    }

    // Construire la réponse
    const response: any = {
        success: false,
        message: apiError.message,
    };

    // Ajouter les erreurs de validation si présentes
    if (apiError.errors && apiError.errors.length > 0) {
        response.errors = apiError.errors;
    }

    // Ajouter la stack trace en développement
    if (env.NODE_ENV === 'development') {
        response.stack = apiError.stack;
    }

    // Envoyer la réponse
    res.status(apiError.statusCode).json(response);
};

/**
 * Middleware pour gérer les routes non trouvées
 * À placer AVANT errorHandler dans index.ts
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    throw ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`);
};
