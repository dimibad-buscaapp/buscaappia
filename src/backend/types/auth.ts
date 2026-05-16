import { Request } from 'express';

export type UserRole = 'user' | 'admin';

export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
