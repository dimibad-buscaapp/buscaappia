const API = '/api';

const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');
const tabs = document.querySelectorAll('.tab');

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function showMessage(text, type = 'error') {
  authMessage.textContent = text;
  authMessage.className = `message ${type}`;
}

function showAuth() {
  authView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
}

function showDashboard() {
  authView.classList.add('hidden');
  dashboardView.classList.remove('hidden');

  const user = getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-role').textContent = user.role;
  }

  loadHealth();
}

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  return data;
}

async function loadHealth() {
  const el = document.getElementById('health-json');
  const apiStatus = document.getElementById('api-status');
  const dbStatus = document.getElementById('db-status');

  try {
    const res = await fetch(`${API}/health`);
    const data = await res.json();
    el.textContent = JSON.stringify(data, null, 2);
    apiStatus.textContent = data.status === 'online' ? 'Online' : 'Offline';
    apiStatus.className = 'stat-value online';
    dbStatus.textContent = data.database?.connected ? 'Conectado' : 'Desconectado';
    dbStatus.className = data.database?.connected
      ? 'stat-value online'
      : 'stat-value';
  } catch {
    el.textContent = 'Falha ao carregar health check';
    apiStatus.textContent = 'Erro';
    dbStatus.textContent = '—';
  }
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    loginForm.classList.toggle('hidden', !isLogin);
    registerForm.classList.toggle('hidden', isLogin);
    showMessage('');
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('');
  const fd = new FormData(loginForm);

  try {
    const data = await apiPost('/auth/login', {
      email: fd.get('email'),
      password: fd.get('password')
    });
    setSession(data.token, data.user);
    showDashboard();
  } catch (err) {
    showMessage(err.message);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('');
  const fd = new FormData(registerForm);

  try {
    await apiPost('/auth/register', {
      username: fd.get('username'),
      email: fd.get('email'),
      password: fd.get('password')
    });
    showMessage('Conta criada! Faça login.', 'success');
    tabs[0].click();
    loginForm.querySelector('[name=email]').value = fd.get('email');
  } catch (err) {
    showMessage(err.message);
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  clearSession();
  showAuth();
  showMessage('');
});

if (getToken() && getUser()) {
  showDashboard();
} else {
  showAuth();
}
