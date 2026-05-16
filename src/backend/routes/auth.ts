import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase, persistDatabase } from '../database';

const router = Router();

interface UserRow {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'default_secret';
}

// Registro
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const db = getDatabase();

    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
      .get(email, username);

    if (existingUser) {
      res.status(400).json({ error: 'Usuário ou email já existe' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db
      .prepare(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
      )
      .run(username, email, hashedPassword);

    persistDatabase();

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      userId: result.lastInsertRowid
    });
  } catch {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserRow | undefined;

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

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
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

export default router;
