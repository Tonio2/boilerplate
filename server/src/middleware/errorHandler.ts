import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Custom Error Interface
interface CustomError extends Error {
  status?: number;
}

// TODO: Fix the error handler to send sanitized error messages

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  logger.error({
    message,
    status,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Send error response
  res.status(status).json({
    success: false,
    message,
  });
};
