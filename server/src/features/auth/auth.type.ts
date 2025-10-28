import { Request } from 'express';

export interface DecodedToken {
  id: string;
  role: string;
  isEmailVerified: boolean;
  iat?: number;
  exp?: number;
}

// Étendre l'interface Request pour inclure user
export interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}
