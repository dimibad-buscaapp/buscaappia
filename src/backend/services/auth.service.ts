import bcrypt from 'bcryptjs';
import { getDatabase, persistDatabase } from '../database';
import { signToken } from '../middleware/auth';
import { JwtPayload, PublicUser, UserRole } from '../types/auth';
import { isValidEmail, isValidPassword, isValidUsername } from '../utils/validation';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  login: string;
  password: string;
}

interface UserRecord {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as UserRole,
    created_at: user.created_at
  };
}

function toJwtPayload(user: UserRecord): JwtPayload {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role as UserRole
  };
}

export async function registerUser(input: RegisterInput): Promise<{
  token: string;
  user: PublicUser;
}> {
  const { username, email, password } = input;

  if (!isValidUsername(username)) {
    throw new Error('Username must be 3+ chars (letters, numbers, underscore)');
  }
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  if (!isValidPassword(password)) {
    throw new Error('Password must be at least 6 characters');
  }

  const db = getDatabase();
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email, username);

  if (existing) {
    throw new Error('EMAIL_OR_USERNAME_TAKEN');
  }

  const role: UserRole = input.role === 'admin' ? 'admin' : 'user';
  const passwordHash = await bcrypt.hash(password, 10);
  const result = db
    .prepare(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
    )
    .run(username, email, passwordHash, role);
  persistDatabase();

  const user: UserRecord = {
    id: Number(result.lastInsertRowid),
    username,
    email,
    password: passwordHash,
    role,
    created_at: new Date().toISOString()
  };

  return {
    token: signToken(toJwtPayload(user)),
    user: toPublicUser(user)
  };
}

export async function loginUser(input: LoginInput): Promise<{
  token: string;
  user: PublicUser;
}> {
  const { login, password } = input;

  if (!login || !password) {
    throw new Error('Login and password are required');
  }

  const db = getDatabase();
  const user = db
    .prepare(
      `SELECT id, username, email, password, role, created_at
       FROM users WHERE email = ? OR username = ?`
    )
    .get(login, login) as UserRecord | undefined;

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return {
    token: signToken(toJwtPayload(user)),
    user: toPublicUser(user)
  };
}

export function getUserById(userId: number): PublicUser | null {
  const db = getDatabase();
  const user = db
    .prepare(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?'
    )
    .get(userId) as Omit<UserRecord, 'password'> | undefined;

  if (!user) {
    return null;
  }

  return toPublicUser({ ...user, password: '' });
}

export function verifyTokenPayload(payload: JwtPayload): PublicUser | null {
  return getUserById(payload.userId);
}
