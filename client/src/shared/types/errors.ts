/**
 * API Error Types and Structures
 */

export interface ApiErrorResponse {
    success: false;
    message: string;
    statusCode?: number;
    errors?: any[];
}

export enum ErrorCode {
    // Network Errors
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',

    // Authentication Errors
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    SESSION_EXPIRED = 'SESSION_EXPIRED',

    // Validation Errors
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    BAD_REQUEST = 'BAD_REQUEST',

    // Server Errors
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

    // Resource Errors
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',

    // Rate Limiting
    TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

    // Unknown
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ParsedError {
    code: ErrorCode;
    message: string;
    userMessage: string;
    statusCode?: number;
    details?: any;
}
