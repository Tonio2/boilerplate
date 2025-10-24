import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import logger from './utils/logger';
import debugLogger from './utils/debugLogger';
import authRoutes from './routes/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import path from 'path';
import { pool } from './db';

import env from './env';

const app = express();

// ============================================
// STATIC FILES (Production)
// ============================================
if (env.NODE_ENV === "production") {
    console.log("Production Mode");
    app.use(express.static(path.join(__dirname, "../../client/dist")));
}

// ============================================
// RATE LIMITERS
// ============================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Plus strict pour l'authentification
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests (optionnel)
    skipSuccessfulRequests: true,
});

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logger uniquement en développement
if (env.NODE_ENV === 'development') {
    app.use(debugLogger);
}

app.use(generalLimiter);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV
    });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/v1/auth', authLimiter, authRoutes);

// Test route
app.get('/api/v1', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        version: '1.0.0'
    });
});

// ============================================
// FRONTEND ROUTING (Production)
// ============================================
if (env.NODE_ENV === "production") {
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
    });
}

// ============================================
// ERROR HANDLING
// ============================================
// 404 handler - DOIT être avant errorHandler
app.use(notFoundHandler);

// Global error handler - DOIT être en dernier
app.use(errorHandler);

// ============================================
// DATABASE CONNECTION
// ============================================
const connectToDatabase = async () => {
    try {
        await pool.query('SELECT NOW()');
        logger.info('Connected to PostgreSQL');
    } catch (err) {
        logger.error('Error connecting to PostgreSQL:', err);
        process.exit(1);
    }
};

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
    await connectToDatabase();

    const server = app.listen(env.PORT, () => {
        logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const shutdown = (signal: string) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);

        server.close(() => {
            logger.info('HTTP server closed');

            pool.end().then(() => {
                logger.info('PostgreSQL connection closed');
                process.exit(0);
            });
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error('Could not close connections in time, forcing shutdown');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
