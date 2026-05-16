import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemIcon, ListItemText, IconButton, Grid, Card,
  CardContent, CardActions, Button, Dialog, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material';
import {
  Menu as MenuIcon, Code as CodeIcon, Android as AndroidIcon,
  Web as WebIcon, Edit as EditIcon, Chat as ChatIcon,
  Add as AddIcon, Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatPanel from './ChatPanel';

const API_URL = 'http://localhost:3001/api';
const drawerWidth = 240;

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [openNewProject, setOpenNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', type: 'web' });
  const [selectedProject, setSelectedProject] = useState(null);
  const [chatOpen, setChatOpen] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Carregar projetos
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`, { headers });
      setProjects(response.data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  // Criar novo projeto
  const handleCreateProject = async () => {
    try {
      await axios.post(`${API_URL}/projects`, newProject, { headers });
      setOpenNewProject(false);
      setNewProject({ name: '', type: 'web' });
      loadProjects();
    } catch (error) {
      alert('Erro ao criar projeto');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Ícones por tipo de projeto
  const getProjectIcon = (type: string) => {
    switch(type) {
      case 'exe': return <CodeIcon />;
      case 'apk': return <AndroidIcon />;
      case 'web': return <WebIcon />;
      case 'apk_editor': return <EditIcon />;
      default: return <CodeIcon />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            DevUnifiedTool
          </Typography>
          <Button color="inherit" onClick={() => setOpenNewProject(true)} startIcon={<AddIcon />}>
            Novo Projeto
          </Button>
          <IconButton color="inherit" onClick={() => setChatOpen(!chatOpen)}>
            <ChatIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', marginTop: '64px' } }}>
        <List>
          <ListItem>
            <Typography variant="subtitle1">Meus Projetos</Typography>
          </ListItem>
          {projects.map((project: any) => (
            <ListItem
              button
              key={project.id}
              selected={selectedProject?.id === project.id}
              onClick={() => setSelectedProject(project)}
            >
              <ListItemIcon>{getProjectIcon(project.type)}</ListItemIcon>
              <ListItemText
                primary={project.name}
                secondary={
                  <Chip
                    size="small"
                    label={project.type.toUpperCase()}
                    color={project.type === 'web' ? 'primary' : project.type === 'apk' ? 'secondary' : 'default'}
                  />
                }
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Área Principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}>
        {selectedProject ? (
          <Box>
            <Typography variant="h4">{selectedProject.name}</Typography>
            <Typography color="textSecondary">Tipo: {selectedProject.type}</Typography>
            
            {/* Cards de Ações */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <CodeIcon fontSize="large" color="primary" />
                    <Typography variant="h6">Build EXE</Typography>
                    <Typography variant="body2">Gerar executável Windows</Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Build</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <AndroidIcon fontSize="large" color="secondary" />
                    <Typography variant="h6">Build APK</Typography>
                    <Typography variant="body2">Gerar app Android</Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Build</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <WebIcon fontSize="large" color="action" />
                    <Typography variant="h6">Deploy Web</Typography>
                    <Typography variant="body2">Publicar site</Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Deploy</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <EditIcon fontSize="large" color="error" />
                    <Typography variant="h6">Editor APK</Typography>
                    <Typography variant="body2">Modificar APK</Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Abrir</Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 10 }}>
            <Typography variant="h3" gutterBottom>
              Bem-vindo ao DevUnifiedTool
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Selecione um projeto ou crie um novo para começar
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewProject(true)}
              sx={{ mt: 2 }}
            >
              Criar Primeiro Projeto
            </Button>
          </Box>
        )}
      </Box>

      {/* Painel de Chat (direito) */}
      {chatOpen && (
        <Box sx={{ width: '350px', borderLeft: '1px solid #333', marginTop: '64px' }}>
          <ChatPanel project={selectedProject} />
        </Box>
      )}

      {/* Diálogo Novo Projeto */}
      <Dialog open={openNewProject} onClose={() => setOpenNewProject(false)}>
        <Box sx={{ p: 3, minWidth: '400px' }}>
          <Typography variant="h6" gutterBottom>Novo Projeto</Typography>
          <TextField
            fullWidth
            label="Nome do Projeto"
            value={newProject.name}
            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Projeto</InputLabel>
            <Select
              value={newProject.type}
              onChange={(e) => setNewProject({...newProject, type: e.target.value})}
              label="Tipo de Projeto"
            >
              <MenuItem value="web">🌐 Desenvolvimento Web</MenuItem>
              <MenuItem value="apk">📱 App Android (.apk)</MenuItem>
              <MenuItem value="exe">💻 Programa Windows (.exe)</MenuItem>
              <MenuItem value="apk_editor">🔧 Editor de APK</MenuItem>
            </Select>
          </FormControl>
          <Button
            fullWidth
            variant="contained"
            onClick={handleCreateProject}
            sx={{ mt: 2 }}
            disabled={!newProject.name}
          >
            Criar Projeto
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
