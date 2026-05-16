import { Router, Response } from 'express';
import { getDatabase, persistDatabase } from '../database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const projects = db
      .prepare(
        `SELECT id, user_id, name, type, status, config, created_at
         FROM projects WHERE user_id = ? ORDER BY created_at DESC`
      )
      .all(req.user!.userId);

    res.json(projects);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar projetos' });
  }
});

router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
      return;
    }

    const allowed = ['web', 'apk', 'exe', 'apk_editor'];
    if (!allowed.includes(type)) {
      res.status(400).json({ error: 'Tipo de projeto inválido' });
      return;
    }

    const db = getDatabase();
    const result = db
      .prepare(
        'INSERT INTO projects (user_id, name, type, status) VALUES (?, ?, ?, ?)'
      )
      .run(req.user!.userId, name, type, 'draft');

    persistDatabase();

    const project = db
      .prepare(
        'SELECT id, user_id, name, type, status, config, created_at FROM projects WHERE id = ?'
      )
      .get(result.lastInsertRowid);

    res.status(201).json(project);
  } catch {
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

export default router;
