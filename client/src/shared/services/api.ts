import axios from "axios";
import env from "@config/env";

const API = axios.create({
    baseURL: env.API_BASE_URL,
    withCredentials: true, // Include cookies (for access and refresh tokens)
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const onRefreshed = () => {
    refreshSubscribers.forEach((callback) => callback());
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: () => void) => {
    refreshSubscribers.push(callback);
};

// No need for request interceptor - cookies are sent automatically

API.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

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
            } catch (err: any) {
                console.error("Token refresh failed:", err.message);

                isRefreshing = false;

                // Clear user data and redirect to login after delay
                localStorage.removeItem("user");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                window.location.href = "/login";

                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default API;
