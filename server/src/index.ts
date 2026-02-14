import { pool } from "@config/db";
import env from "@config/env";

import { logger } from "@features/logger";

import app from "./app";

// ============================================
// DATABASE CONNECTION
// ============================================
const connectToDatabase = async () => {
    try {
        await pool.query("SELECT NOW()");
        logger.info("Connected to PostgreSQL");
    } catch (err) {
        logger.error("Error connecting to PostgreSQL:", err);
        process.exit(1);
    }
};

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
    await connectToDatabase();

    const server = app.listen(env.PORT, "0.0.0.0", () => {
        logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const shutdown = (signal: string) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);

        server.close(() => {
            logger.info("HTTP server closed");

            pool.end()
                .then(() => {
                    logger.info("PostgreSQL connection closed");
                    process.exit(0);
                })
                .catch((err) => {
                    logger.error("Error closing PostgreSQL connection:", err);
                    process.exit(1);
                });
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error("Could not close connections in time, forcing shutdown");
            process.exit(1);
        }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
};

void startServer().catch((err) => {
    logger.error("Failed to start server:", err);
    process.exit(1);
});
