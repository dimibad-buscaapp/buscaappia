import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase, persistDatabase } from '../database';
import { authMiddleware, signToken } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const database = getDatabase();
    const existing = database
      .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
      .get(email, username);

    if (existing) {
      res.status(409).json({ error: 'Email or username already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = database
      .prepare(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
      )
      .run(username, email, passwordHash, 'user');
    persistDatabase();

    const token = signToken({
      userId: Number(result.lastInsertRowid),
      email
    });

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        email,
        role: 'user'
      },
      message: 'User registered successfully'
    });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const database = getDatabase();
    const user = database
      .prepare(
        'SELECT id, username, email, password, role FROM users WHERE email = ?'
      )
      .get(email) as
      | {
          id: number;
          username: string;
          email: string;
          password: string;
          role: string;
        }
      | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const database = getDatabase();
    const user = database
      .prepare(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?'
      )
      .get(req.user!.userId) as
      | {
          id: number;
          username: string;
          email: string;
          role: string;
          created_at: string;
        }
      | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
