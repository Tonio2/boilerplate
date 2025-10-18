import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import env from '../env'

interface DecodedToken {
  id: string;
  email: string;
  role?: string;
}

interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.token;

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as DecodedToken;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    console.error('Unexpected error during authentication:', error);
    res.status(401).json({ message: 'Authentication error' });
  }
};
