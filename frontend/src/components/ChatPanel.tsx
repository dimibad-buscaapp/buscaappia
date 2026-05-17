import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config/api';
import { Project } from '../types/project';

const AI_PROVIDERS = [
  { id: 'gemini', name: 'Gemini', color: '#4285F4', icon: '🤖' },
  { id: 'openai', name: 'ChatGPT', color: '#74AA9C', icon: '🧠' },
  { id: 'deepseek', name: 'DeepSeek', color: '#0066FF', icon: '🔍' },
  { id: 'claude', name: 'Claude', color: '#D97706', icon: '🎯' },
  { id: 'grok', name: 'Grok', color: '#1DA1F2', icon: '🚀' }
] as const;

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
  const [selectedAI, setSelectedAI] = useState('gemini');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (project?.id) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [project?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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

  function getProjectContext() {
    if (!project) return '';

    switch (project.type) {
      case 'exe':
        return `[Contexto: Projeto Windows EXE - ${project.name}] `;
      case 'apk':
        return `[Contexto: Projeto Android APK - ${project.name}] `;
      case 'web':
        return `[Contexto: Projeto Web - ${project.name}] `;
      case 'apk_editor':
        return `[Contexto: Editor de APK - ${project.name}] `;
      default:
        return `[Contexto: Projeto ${project.name}] `;
    }
  }

  function getQuickActions() {
    const actions = [
      { label: '📝 Criar código', prompt: 'Crie um código exemplo para ' },
      { label: '🐛 Debug', prompt: 'Me ajude a debugar este erro: ' },
      { label: '📚 Explicar', prompt: 'Explique como funciona: ' },
      { label: '🔧 Otimizar', prompt: 'Otimize este código: ' }
    ];

    if (project?.type === 'apk_editor') {
      actions.push({
        label: '📱 Modificar APK',
        prompt: 'Como modificar um APK para: '
      });
    }

    return actions;
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setInput('');
    setSending(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/chat`,
        {
          project_id: project?.id ?? null,
          message: `${getProjectContext()}${messageText}`,
          ai_provider: selectedAI
        },
        { headers }
      );
      setMessages((prev) => [...prev, data]);
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        bgcolor: '#1a1a2e',
        color: 'white'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AIIcon sx={{ mr: 1, color: '#4F46E5' }} />
          <Typography variant="h6">Assistente IA</Typography>
        </Box>

        <FormControl fullWidth size="small">
          <Select
            value={selectedAI}
            onChange={(event) => setSelectedAI(event.target.value)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }
            }}
          >
            {AI_PROVIDERS.map((provider) => (
              <MenuItem key={provider.id} value={provider.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{provider.icon}</span>
                  <span>{provider.name}</span>
                  {provider.id === 'deepseek' && (
                    <Chip label="Grátis" size="small" color="success" sx={{ ml: 1 }} />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {project && (
          <Chip
            label={`📁 ${project.name}`}
            size="small"
            sx={{ mt: 1, bgcolor: '#4F46E5', color: 'white' }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.7 }}>
            <Typography variant="h1" sx={{ fontSize: '3rem' }}>
              🤖
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Como posso ajudar no seu desenvolvimento?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Selecione uma IA e comece a conversar
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <Box key={msg.id} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '80%',
                    bgcolor: '#4F46E5',
                    color: 'white',
                    borderRadius: '20px 20px 0 20px'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.5, display: 'block', mt: 0.5 }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>

              {msg.response && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      bgcolor: '#2a2a3e',
                      color: 'white',
                      borderRadius: '20px 20px 20px 0'
                    }}
                  >
                    {msg.ai_provider && (
                      <Chip
                        label={
                          AI_PROVIDERS.find(
                            (provider) => provider.id === msg.ai_provider
                          )?.name ?? msg.ai_provider
                        }
                        size="small"
                        sx={{ mb: 1, fontSize: '0.7rem' }}
                      />
                    )}
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.response}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          ))
        )}

        {sending && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              {AI_PROVIDERS.find((provider) => provider.id === selectedAI)?.name}{' '}
              está pensando...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          p: 1,
          borderTop: '1px solid #333',
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        {getQuickActions().map((action) => (
          <Chip
            key={action.label}
            label={action.label}
            size="small"
            onClick={() => setInput(action.prompt)}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#4F46E5' } }}
          />
        ))}
      </Box>

      <Box
        component="form"
        onSubmit={handleSend}
        sx={{ p: 2, borderTop: '1px solid #333', display: 'flex', gap: 1 }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={`Pergunte algo para a IA... (${
            AI_PROVIDERS.find((provider) => provider.id === selectedAI)?.name
          })`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={sending}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: '#444' }
            }
          }}
        />
        <IconButton
          type="submit"
          disabled={sending || !input.trim()}
          sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#6366F1' } }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
