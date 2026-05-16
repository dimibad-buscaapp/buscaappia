import { FormEvent, useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { API_URL } from '../config/api';
import { Project } from '../types/project';

interface ChatMessage {
  id: number;
  message: string;
  response: string | null;
  ai_provider: string | null;
  created_at: string;
}

interface ChatPanelProps {
  project: Project | null;
}

export default function ChatPanel({ project }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (project?.id) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [project?.id]);

  async function loadMessages() {
    if (!project?.id) return;
    try {
      const { data } = await axios.get(`${API_URL}/chat/${project.id}`, {
        headers
      });
      setMessages(data);
    } catch {
      setMessages([]);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setSending(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/chat`,
        { project_id: project?.id ?? null, message: input.trim() },
        { headers }
      );
      setMessages((prev) => [...prev, data]);
      setInput('');
    } catch {
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        bgcolor: 'background.paper'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Chat IA
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {project ? project.name : 'Selecione um projeto'}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {project
              ? 'Envie uma mensagem para começar.'
              : 'Selecione um projeto na barra lateral.'}
          </Typography>
        ) : (
          messages.map((msg) => (
            <Box key={msg.id} sx={{ mb: 2 }}>
              <Typography variant="caption" color="primary">
                Você
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {msg.message}
              </Typography>
              {msg.response && (
                <>
                  <Typography variant="caption" color="secondary">
                    IA
                  </Typography>
                  <Typography variant="body2">{msg.response}</Typography>
                </>
              )}
            </Box>
          ))
        )}
      </Box>

      <Box
        component="form"
        onSubmit={handleSend}
        sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!project || sending}
        />
        <IconButton type="submit" color="primary" disabled={!project || sending}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
