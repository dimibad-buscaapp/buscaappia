import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  loginUser,
  registerUser,
  verifyTokenPayload
} from '../services/auth.service';
import { AuthRequest } from '../types/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const result = await registerUser({ username, email, password });

    res.status(201).json({
      ...result,
      message: 'User registered successfully'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    if (message === 'EMAIL_OR_USERNAME_TAKEN') {
      res.status(409).json({ error: 'Email or username already registered' });
      return;
    }

    if (
      message.includes('Username') ||
      message.includes('email') ||
      message.includes('Password')
    ) {
      res.status(400).json({ error: message });
      return;
    }

    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, username, login, password } = req.body;
    const identifier = login || email || username;

    const result = await loginUser({ login: identifier, password });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';

    if (message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (message.includes('required')) {
      res.status(400).json({ error: message });
      return;
    }

    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = verifyTokenPayload(req.user!);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/verify', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = verifyTokenPayload(req.user!);

    if (!user) {
      res.status(404).json({ valid: false, error: 'User not found' });
      return;
    }

    res.json({ valid: true, user });
  } catch {
    res.status(500).json({ error: 'Token verification failed' });
  }
});

export default router;
