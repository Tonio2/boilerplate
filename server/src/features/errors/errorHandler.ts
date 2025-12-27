import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import env from "@config/env";

import { logger } from "@features/logger";

import { ApiError } from "./apiError";

/**
 * Extrait les erreurs de validation depuis différents types d'erreurs
 */
function extractValidationErrors(err: unknown): Array<{ field: string; message: string }> {
    // Erreurs Zod
    if (err instanceof ZodError) {
        return err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
    }

    // Erreurs Mongoose
    if (
        typeof err === "object" &&
        err !== null &&
        "errors" in err &&
        typeof err.errors === "object"
    ) {
        const errors = err.errors as Record<string, { message: string }>;
        return Object.keys(errors).map((key) => ({
            field: key,
            message: errors[key].message,
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

    // Erreurs de validation (Zod)
    if (err instanceof ZodError) {
        const errors = extractValidationErrors(err);
        return ApiError.badRequest("Validation failed", errors);
    }

    // Erreurs de validation Mongoose
    if (err.name === "ValidationError") {
        const errors = extractValidationErrors(err);
        return ApiError.badRequest("Validation failed", errors);
    }

    // Erreur de duplicate key MongoDB
    if (
        err.name === "MongoServerError" &&
        typeof err === "object" &&
        "code" in err &&
        err.code === 11000
    ) {
        const keyPattern =
            "keyPattern" in err && typeof err.keyPattern === "object" && err.keyPattern !== null
                ? err.keyPattern
                : {};
        const field = Object.keys(keyPattern)[0];
        return ApiError.conflict(field ? `${field} already exists` : "Resource already exists");
    }

    // Erreur de cast Mongoose (ObjectId invalide)
    if (err.name === "CastError") {
        return ApiError.badRequest("Invalid ID format");
    }

    // Erreurs JWT
    if (err.name === "JsonWebTokenError") {
        return ApiError.unauthorized("Invalid token");
    }

    if (err.name === "TokenExpiredError") {
        return ApiError.unauthorized("Token expired");
    }

    // Erreur inconnue = 500 Internal Server Error
    return ApiError.internal(env.NODE_ENV === "production" ? "Internal server error" : err.message);
}

/**
 * Middleware de gestion centralisée des erreurs
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    // Normaliser l'erreur
    const apiError = normalizeError(err);

    // Logger selon la sévérité
    const logData = {
        message: apiError.message,
        statusCode: apiError.statusCode,
        route: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: (req as { user?: { id: string } }).user?.id,
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
    const response: {
        success: boolean;
        message: string;
        errors?: unknown[];
        stack?: string;
    } = {
        success: false,
        message: apiError.message,
    };

    // Ajouter les erreurs de validation si présentes
    if (apiError.errors && apiError.errors.length > 0) {
        response.errors = apiError.errors;
    }

    // Ajouter la stack trace en développement
    if (env.NODE_ENV === "development") {
        response.stack = apiError.stack;
    }

    // Envoyer la réponse
    res.status(apiError.statusCode).json(response);
};

/**
 * Middleware pour gérer les routes non trouvées
 * À placer AVANT errorHandler dans index.ts
 */
export const notFoundHandler = (req: Request, _res: Response, _next: NextFunction) => {
    throw ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`);
};
