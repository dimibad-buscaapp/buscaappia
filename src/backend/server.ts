import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { setupDatabase, getDatabaseStatus } from './database';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import chatRoutes from './routes/chat';
import apkRoutes from './routes/apks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

function resolvePublicDir(): string {
  const candidates = [
    path.join(__dirname, '../../public'),
    path.join(process.cwd(), 'public')
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }

  return path.join(process.cwd(), 'public');
}

const publicDir = resolvePublicDir();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/apks', apkRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  try {
    const database = getDatabaseStatus();
    res.json({
      status: 'online',
      message: 'DevUnifiedTool API running',
      timestamp: new Date().toISOString(),
      database
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Database check failed';
    console.error('[health] Database unavailable:', message);
    res.json({
      status: 'online',
      message: 'DevUnifiedTool API running',
      timestamp: new Date().toISOString(),
      database: { connected: false, error: message }
    });
  }
});

// Frontend React (build em public/)
app.use(express.static(publicDir));
app.get(/^\/(?!api).*/, (req, res, next) => {
  if (req.method !== 'GET') {
    next();
    return;
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Inicialização
async function start() {
  try {
    await setupDatabase();
    console.log('✅ Auth system ready');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/projects');
    console.log('   POST /api/chat');

    if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
      console.warn(`⚠️ Frontend não encontrado em: ${publicDir}`);
    } else {
      console.log(`🌐 Frontend: ${publicDir}`);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

start();
