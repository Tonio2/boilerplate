import mongoose from 'mongoose';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import logger from './utils/logger';
import debugLogger from './utils/debugLogger';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import path from 'path';

import env from './env'

const app = express();

if (env.NODE_ENV === "production") {
	console.log("Production Mode");
	app.use(express.static(path.join(__dirname, "../../client/dist")));
	app.get("*", (req, res) => {
	  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
	});
  }

// Rate Limiter Configurations
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // stricter limit for auth-related routes
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(debugLogger);
app.use(generalLimiter);



// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1', (req, res) => {
    res.send('ok');
});

// Error Handling Middleware
app.use(errorHandler);

// Mongoose Connection
const connectToDatabase = async () => {
    try {
        await mongoose.connect(env.MONGO_URI);
        logger.info('Connected to MongoDB');
    } catch (err) {
        logger.error('Error connecting to MongoDB:', err);
        process.exit(1); // Exit the process if the database connection fails
    }
};

// Start Server
const startServer = async () => {
    await connectToDatabase(); // Ensure the database is connected before starting the server
    const server = app.listen(env.PORT, () => {
        logger.info(`Server running on port ${env.PORT}`);
    });

    // Graceful Shutdown
    const shutdown = (signal: string) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        server.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch(err => {
    logger.error('Failed to start server:', err);
});
