const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function registerUser(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function getUserState() {
  const res = await fetch(`${API_BASE_URL}/api/user/state`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch user state');
  return res.json();
}

export async function updateUserState(state) {
  const res = await fetch(`${API_BASE_URL}/api/user/state`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(state),
  });
  if (!res.ok) {
    const err = new Error('Failed to update user state');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function getJournals() {
  const res = await fetch(`${API_BASE_URL}/api/journals`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch journals');
  return res.json();
}

export async function createJournal(entry) {
  const res = await fetch(`${API_BASE_URL}/api/journals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Failed to create journal');
  return res.json();
}

export async function getTasks() {
  const res = await fetch(`${API_BASE_URL}/api/tasks`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(task) {
  const res = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function toggleTaskCompletion(taskId) {
  const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to toggle task');
  return res.json();
}

export async function postCoachChat(message) {
  const res = await fetch(`${API_BASE_URL}/api/coach/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to chat with coach');
  return res.json();
}
