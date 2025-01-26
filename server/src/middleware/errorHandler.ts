import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Custom Error Interface
interface CustomError extends Error {
  status?: number;
}

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
    status: status !== 500 ? message : 'Internal Server Error',
  });
};
