import axios, { AxiosError } from "axios";

import env from "@config/env";

import { getUserMessage, isAuthError, parseError } from "@shared/utils/errorHandler";
import DEFAULT_RETRY_CONFIG, {
    attachRetryConfig,
    calculateRetryDelay,
    getRetryCount,
    shouldRetryRequest,
    sleep,
} from "@shared/utils/retry";

import { showToast } from "./toast";

/**
 * API Configuration
 */
const API = axios.create({
    baseURL: env.API_BASE_URL,
    withCredentials: true, // Include cookies (for access and refresh tokens)
    timeout: 30000, // 30 seconds timeout
});

/**
 * Token Refresh Management
 */
let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const onRefreshed = () => {
    refreshSubscribers.forEach((callback) => callback());
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: () => void) => {
    refreshSubscribers.push(callback);
};

/**
 * Response Interceptor
 * Handles errors, authentication, and retries
 */
API.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Parse error for better handling
        const parsedError = parseError(error);

        // Handle 401 Unauthorized (token refresh)
        if (error.response?.status === 401 && !originalRequest._isRetryAfterRefresh) {
            originalRequest._isRetryAfterRefresh = true;

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve) => {
                    addRefreshSubscriber(() => {
                        resolve(API(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                // Call refresh endpoint - cookies are sent automatically
                await axios.post(
                    `${API.defaults.baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                // Notify all queued requests that token is refreshed
                onRefreshed();
                isRefreshing = false;

                // Retry the original request
                return API(originalRequest);
            } catch (refreshError: any) {
                console.error("Token refresh failed:", refreshError.message);

                isRefreshing = false;

                // Clear user data and redirect to login
                localStorage.removeItem("user");
                showToast("Your session has expired. Please log in again.", "error");

                await sleep(2000);
                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        // Handle retryable errors (network issues, timeouts, server errors)
        const retryCount = getRetryCount(originalRequest);

        if (shouldRetryRequest(error, retryCount, DEFAULT_RETRY_CONFIG)) {
            // Calculate delay with exponential backoff
            const delay = calculateRetryDelay(retryCount, DEFAULT_RETRY_CONFIG.retryDelay);

            // Update retry count
            attachRetryConfig(originalRequest, retryCount + 1);

            console.log(
                `Retrying request (attempt ${retryCount + 1}/${DEFAULT_RETRY_CONFIG.maxRetries}) after ${Math.round(delay)}ms`
            );

            // Wait before retrying
            await sleep(delay);

            // Retry the request
            return API(originalRequest);
        }

        // If we've exhausted retries or error is not retryable, show user-friendly error
        if (retryCount > 0) {
            console.error(`Request failed after ${retryCount} retries:`, parsedError.message);
        }

        // Don't show toast for auth errors (handled separately)
        if (!isAuthError(error)) {
            const userMessage = getUserMessage(error);
            showToast(userMessage, "error");
        }

        return Promise.reject(error);
    }
);

export default API;
