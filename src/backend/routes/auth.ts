import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database';
import { authMiddleware, signToken } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const database = getDb();
    const existing = database
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);

    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = database
      .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .run(email, passwordHash);

    const token = signToken({
      userId: Number(result.lastInsertRowid),
      email
    });

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        email
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

    const database = getDb();
    const user = database
      .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .get(email) as
      | { id: number; email: string; password_hash: string }
      | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const database = getDb();
    const user = database
      .prepare('SELECT id, email, created_at FROM users WHERE id = ?')
      .get(req.user!.userId) as
      | { id: number; email: string; created_at: string }
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
