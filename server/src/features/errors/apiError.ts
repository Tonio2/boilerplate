export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly errors?: unknown[];

    constructor(statusCode: number, message: string, isOperational = true, errors?: unknown[]) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;

        // Maintenir le prototype chain correct
        Object.setPrototypeOf(this, ApiError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }

    // Factory methods pour les erreurs communes
    static badRequest(message: string, errors?: unknown[]) {
        return new ApiError(400, message, true, errors);
    }

    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }

    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }

    static notFound(message = "Resource not found") {
        return new ApiError(404, message);
    }

    static conflict(message: string) {
        return new ApiError(409, message);
    }

    static tooManyRequests(message = "Too many requests") {
        return new ApiError(429, message);
    }

    static internal(message = "Internal server error") {
        return new ApiError(500, message, false);
    }

    static serviceUnavailable(message = "Service unavailable") {
        return new ApiError(503, message, false);
    }
}
