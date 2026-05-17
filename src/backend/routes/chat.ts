import { Router, Response } from 'express';
import { getDatabase, persistDatabase } from '../database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types/auth';
import { APK_CATALOG, ApkCatalogItem } from '../config/apkCatalog';

const router = Router();

router.use(authMiddleware);

function recommendApkForMessage(message: string): ApkCatalogItem {
  const normalizedMessage = message.toLowerCase();

  const ranked = APK_CATALOG.map((apk) => {
    const score = apk.keywords.reduce((total, keyword) => {
      return normalizedMessage.includes(keyword.toLowerCase())
        ? total + keyword.length
        : total;
    }, 0);

    return { apk, score };
  }).sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].apk : APK_CATALOG[0];
}

async function getAIResponse(
  message: string,
  provider: string,
  recommendedApk: ApkCatalogItem
): Promise<string> {
  const responses: Record<string, string[]> = {
    gemini: [
      `🤖 **Gemini**: Analisando sua solicitação...\n\nBaseado no seu projeto, sugiro a seguinte implementação:\n\n\`\`\`javascript\n// Exemplo de código\nconst app = express();\n\`\`\``,
      '📝 **Gemini**: Posso ajudar com isso! Aqui está uma solução...'
    ],
    openai: [
      '🧠 **ChatGPT**: Entendi sua pergunta. Vamos resolver isso passo a passo...',
      '💡 **ChatGPT**: Aqui está uma abordagem otimizada...'
    ],
    deepseek: [
      '🔍 **DeepSeek**: Analisando em profundidade...\n\nEncontrei uma solução eficiente:\n\n1. Primeiro, configure o ambiente\n2. Depois, implemente a lógica\n3. Teste e otimize',
      '⚡ **DeepSeek**: Resposta rápida: use esta estrutura...'
    ],
    claude: [
      '🎯 **Claude**: Vou organizar a resposta com foco em clareza e segurança.',
      '🎯 **Claude**: Boa pergunta. Vamos separar o problema em partes menores.'
    ],
    grok: [
      '🚀 **Grok**: Vamos direto ao ponto: aqui está uma forma prática de resolver.',
      '🚀 **Grok**: Analisei o contexto e recomendo começar por esta abordagem.'
    ]
  };

  const providerResponses = responses[provider] || responses.gemini;
  const baseResponse = providerResponses[
    Math.floor(Math.random() * providerResponses.length)
  ];

  return `${baseResponse}\n\n📦 **App mais indicado para fornecer material:** ${recommendedApk.name}\n\nUso recomendado: ${recommendedApk.materialUse}\n\nPasta base: extracted/${recommendedApk.extractedFolder}`;
}

router.get('/history/:projectId', (req: AuthRequest, res: Response) => {
  try {
    const projectId = Number(req.params.projectId);
    const db = getDatabase();

    const history = db
      .prepare(
        `SELECT id, message, response, ai_provider, created_at
         FROM chat_history
         WHERE user_id = ? AND project_id = ?
         ORDER BY created_at DESC
         LIMIT 50`
      )
      .all(req.user!.userId, projectId);

    res.json(history);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar histórico' });
  }
});

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

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      message,
      project_id,
      projectId,
      ai_provider,
      provider
    } = req.body;
    const selectedProvider = ai_provider ?? provider ?? 'gemini';
    const selectedProjectId = project_id ?? projectId ?? null;

    if (!message) {
      res.status(400).json({ error: 'Mensagem é obrigatória' });
      return;
    }

    const recommendedApk = recommendApkForMessage(message);
    const response = await getAIResponse(
      message,
      selectedProvider,
      recommendedApk
    );

    const db = getDatabase();
    const result = db
      .prepare(
        `INSERT INTO chat_history (user_id, project_id, message, response, ai_provider)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        req.user!.userId,
        selectedProjectId,
        message,
        response,
        selectedProvider
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
