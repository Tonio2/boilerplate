/**
 * Retry Utility with Exponential Backoff
 */

import { AxiosError, AxiosRequestConfig } from 'axios';
import { isRetryableError } from './errorHandler';

export interface RetryConfig {
    maxRetries: number;
    retryDelay: number; // Initial delay in ms
    retryableStatuses?: number[];
    shouldRetry?: (error: AxiosError) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff
 * Formula: initialDelay * (2 ^ attemptNumber) + randomJitter
 */
export const calculateRetryDelay = (attempt: number, baseDelay: number): number => {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add 0-1s random jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
};

/**
 * Check if request should be retried
 */
export const shouldRetryRequest = (
    error: AxiosError,
    retryCount: number,
    config: RetryConfig
): boolean => {
    // Don't retry if max retries exceeded
    if (retryCount >= config.maxRetries) {
        return false;
    }

    // Use custom retry logic if provided
    if (config.shouldRetry) {
        return config.shouldRetry(error);
    }

    // Don't retry if no response (might be CORS or network issue that won't resolve)
    // Exception: timeout errors should be retried
    if (!error.response && error.code !== 'ECONNABORTED') {
        return false;
    }

    // Check if error is retryable based on our error handler
    if (!isRetryableError(error)) {
        return false;
    }

    // Check status code if response exists
    if (error.response) {
        const status = error.response.status;
        return config.retryableStatuses?.includes(status) || false;
    }

    return true;
};

/**
 * Attach retry metadata to axios config
 */
export const attachRetryConfig = (
    axiosConfig: AxiosRequestConfig & { _retry?: number },
    retryCount: number
): void => {
    axiosConfig._retry = retryCount;
};

/**
 * Get current retry count from axios config
 */
export const getRetryCount = (axiosConfig: AxiosRequestConfig & { _retry?: number }): number => {
    return axiosConfig._retry || 0;
};

/**
 * Sleep utility for retry delays
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export default DEFAULT_RETRY_CONFIG;
