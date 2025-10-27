/**
 * Environment Configuration
 *
 * Centralized environment variable management for the client application.
 * All environment variables should be accessed through this module.
 */

interface EnvConfig {
    API_BASE_URL: string;
    IS_DEVELOPMENT: boolean;
    IS_PRODUCTION: boolean;
}

/**
 * Get and validate environment variables
 */
function getEnv(): EnvConfig {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const mode = import.meta.env.MODE;

    // Validate required environment variables
    if (!apiBaseUrl) {
        console.warn(
            'VITE_API_BASE_URL is not set. Using default: http://localhost:5000/api/v1'
        );
    }

    return {
        API_BASE_URL: apiBaseUrl || 'http://localhost:5000/api/v1',
        IS_DEVELOPMENT: mode === 'development',
        IS_PRODUCTION: mode === 'production',
    };
}

// Export the validated environment configuration
const env = getEnv();

export default env;
