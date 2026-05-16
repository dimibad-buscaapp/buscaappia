import { Request } from 'express';

export type UserRole = 'user' | 'admin';

export interface JwtPayload {
  userId: number;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
