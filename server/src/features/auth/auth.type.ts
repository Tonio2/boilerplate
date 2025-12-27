import { Request } from "express";

// Decoded JWT token structure
export interface DecodedToken {
    id: string;
    role: string;
    isEmailVerified: boolean;
    iat?: number;
    exp?: number;
}

// Extended Request interface for authenticated routes
export interface AuthenticatedRequest extends Request {
    user?: DecodedToken;
}
