import dotenv from 'dotenv';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const CLIENT_URL = process.env.CLIENT_URL!;
const JWT_EMAIL_SECRET = process.env.JWT_EMAIL_SECRET!;
const MONGO_URI = process.env.MONGO_URI!;
const GMAIL_PWD = process.env.GMAIL_PWD!;

// Optional
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || "development"

const requiredVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'CLIENT_URL',
    'JWT_EMAIL_SECRET',
    'MONGO_URI',
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
    MONGO_URI,
    GMAIL_PWD,
    PORT,
    NODE_ENV
}
