import { Router, Response } from 'express';
import { getDatabase, persistDatabase } from '../database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = Router();

router.use(authMiddleware);

router.get('/:projectId', (req: AuthRequest, res: Response) => {
  try {
    const projectId = Number(req.params.projectId);
    const db = getDatabase();

    const messages = db
      .prepare(
        `SELECT id, message, response, ai_provider, created_at
         FROM chat_history
         WHERE user_id = ? AND project_id = ?
         ORDER BY created_at ASC`
      )
      .all(req.user!.userId, projectId);

    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar chat' });
  }
});

router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { project_id, message, ai_provider = 'default' } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Mensagem é obrigatória' });
      return;
    }

    const response = `[IA] Recebi: "${message}". Integração completa em breve.`;

    const db = getDatabase();
    const result = db
      .prepare(
        `INSERT INTO chat_history (user_id, project_id, message, response, ai_provider)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        req.user!.userId,
        project_id ?? null,
        message,
        response,
        ai_provider
      );

    persistDatabase();

    const row = db
      .prepare(
        'SELECT id, message, response, ai_provider, created_at FROM chat_history WHERE id = ?'
      )
      .get(result.lastInsertRowid);

    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

export default router;
