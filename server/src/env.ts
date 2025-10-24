import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file (single source of truth)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// PostgreSQL configuration (from root .env, used by Docker Compose)
const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres';
const POSTGRES_DB = process.env.POSTGRES_DB || 'boilerplate';
const POSTGRES_PORT = process.env.POSTGRES_PORT || '5432';
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';

// Construct DATABASE_URL from PostgreSQL variables
const DATABASE_URL = process.env.DATABASE_URL ||
    `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

// Application configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const CLIENT_URL = process.env.CLIENT_URL!;
const JWT_EMAIL_SECRET = process.env.JWT_EMAIL_SECRET!;
const GMAIL_PWD = process.env.GMAIL_PWD!;

// Optional
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const requiredVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'CLIENT_URL',
    'JWT_EMAIL_SECRET',
    'GMAIL_PWD',
];

requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`${varName} is not defined in environment variables`);
    }
});

export default {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    CLIENT_URL,
    JWT_EMAIL_SECRET,
    DATABASE_URL,
    GMAIL_PWD,
    PORT,
    NODE_ENV,
    // Export postgres config for reference if needed
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DB,
    POSTGRES_PORT,
    POSTGRES_HOST,
}
