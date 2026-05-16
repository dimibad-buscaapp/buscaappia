import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { setupDatabase, getDatabaseStatus } from './database';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '../../public');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use('/api/auth', authRoutes);

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

// Inicialização
async function start() {
  try {
    await setupDatabase();
    console.log('✅ Auth system ready');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');

    app.use(express.static(publicDir));

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

start();
