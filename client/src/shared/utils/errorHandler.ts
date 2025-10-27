/**
 * Centralized Error Handler
 *
 * Handles API errors and maps them to user-friendly messages
 */

import { ErrorCode, ParsedError } from '@shared/types/errors';

/**
 * User-friendly error messages mapping
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
    // Network Errors
    [ErrorCode.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
    [ErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again.',

    // Authentication Errors
    [ErrorCode.UNAUTHORIZED]: 'Invalid credentials. Please check your email and password.',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
    [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',

    // Validation Errors
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCode.BAD_REQUEST]: 'Invalid request. Please check your input.',

    // Server Errors
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',

    // Resource Errors
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.CONFLICT]: 'This resource already exists.',

    // Rate Limiting
    [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please slow down and try again later.',

    // Unknown
    [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Maps HTTP status codes to error codes
 */
const mapStatusToErrorCode = (status: number): ErrorCode => {
    switch (status) {
        case 400:
            return ErrorCode.BAD_REQUEST;
        case 401:
            return ErrorCode.UNAUTHORIZED;
        case 403:
            return ErrorCode.FORBIDDEN;
        case 404:
            return ErrorCode.NOT_FOUND;
        case 409:
            return ErrorCode.CONFLICT;
        case 422:
            return ErrorCode.VALIDATION_ERROR;
        case 429:
            return ErrorCode.TOO_MANY_REQUESTS;
        case 500:
            return ErrorCode.INTERNAL_SERVER_ERROR;
        case 503:
            return ErrorCode.SERVICE_UNAVAILABLE;
        default:
            return ErrorCode.UNKNOWN_ERROR;
    }
};

/**
 * Parse axios error into structured error object
 */
export const parseError = (error: any): ParsedError => {
    // Network error (no response)
    if (!error.response) {
        if (error.code === 'ECONNABORTED') {
            return {
                code: ErrorCode.TIMEOUT_ERROR,
                message: 'Request timeout',
                userMessage: ERROR_MESSAGES[ErrorCode.TIMEOUT_ERROR],
            };
        }

        return {
            code: ErrorCode.NETWORK_ERROR,
            message: error.message || 'Network error',
            userMessage: ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
        };
    }

    // Get status code
    const statusCode = error.response.status;
    const errorCode = mapStatusToErrorCode(statusCode);

    // Get server message (if available)
    const serverMessage = error.response.data?.message || error.message;

    // Get validation errors (if available)
    const validationErrors = error.response.data?.errors;

    return {
        code: errorCode,
        message: serverMessage,
        userMessage: ERROR_MESSAGES[errorCode],
        statusCode,
        details: validationErrors,
    };
};

/**
 * Get user-friendly message from error
 */
export const getUserMessage = (error: any): string => {
    const parsed = parseError(error);

    // If server provides a specific message, use it (but sanitize it)
    if (parsed.message && parsed.code !== ErrorCode.INTERNAL_SERVER_ERROR) {
        return parsed.message;
    }

    // Otherwise use our generic user-friendly message
    return parsed.userMessage;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: any): boolean => {
    const parsed = parseError(error);

    // Retry on network errors, timeouts, and server errors
    const retryableCodes = [
        ErrorCode.NETWORK_ERROR,
        ErrorCode.TIMEOUT_ERROR,
        ErrorCode.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVICE_UNAVAILABLE,
    ];

    return retryableCodes.includes(parsed.code);
};

/**
 * Check if error is authentication related
 */
export const isAuthError = (error: any): boolean => {
    const parsed = parseError(error);
    return [ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN, ErrorCode.SESSION_EXPIRED].includes(parsed.code);
};
