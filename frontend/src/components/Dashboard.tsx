import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography
} from '@mui/material';

interface DashboardProps {
  setToken: (token: string | null) => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface HealthData {
  status: string;
  message: string;
  timestamp: string;
  database?: {
    connected: boolean;
    tables?: Record<string, number>;
  };
}

export default function Dashboard({ setToken }: DashboardProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      setUser(JSON.parse(raw) as User);
    }
    loadHealth();
  }, []);

  async function loadHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch {
      setError('Falha ao carregar status da API');
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    navigate('/login');
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Olá, {user?.username ?? 'usuário'}
          </Typography>
          <Typography color="text.secondary">{user?.email}</Typography>
        </Box>
        <Button variant="outlined" color="inherit" onClick={handleLogout}>
          Sair
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Papel
          </Typography>
          <Typography variant="h6">{user?.role ?? '—'}</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            API
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={health?.status === 'online' ? 'Online' : 'Offline'}
              color={health?.status === 'online' ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Banco
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={
                health?.database?.connected ? 'Conectado' : 'Desconectado'
              }
              color={health?.database?.connected ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Paper>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Health check
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            fontSize: 12,
            overflow: 'auto'
          }}
        >
          {health ? JSON.stringify(health, null, 2) : 'Carregando...'}
        </Box>
      </Paper>
    </Container>
  );
}
