const API_URL = 'http://localhost:20128';

let token = localStorage.getItem('token');
let userEmail = localStorage.getItem('userEmail');

// DOM Elements
const authSection = document.getElementById('auth-section');
const taskSection = document.getElementById('task-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');
const taskMessage = document.getElementById('task-message');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const tasksContainer = document.getElementById('tasks');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showTaskSection();
    loadTasks();
  } else {
    showAuthSection();
  }

  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('taskForm').addEventListener('submit', handleAddTask);

  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    clearMessage(authMessage);
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    clearMessage(authMessage);
  });

  logoutBtn.addEventListener('click', handleLogout);
}

// Authentication handlers
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      token = data.data.token;
      userEmail = data.data.user.email;

      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', userEmail);

      showMessage(authMessage, 'Login successful!', 'success');

      setTimeout(() => {
        showTaskSection();
        loadTasks();
        document.getElementById('loginForm').reset();
      }, 1000);
    } else {
      showMessage(authMessage, data.error, 'error');
    }
  } catch (error) {
    showMessage(authMessage, 'Login failed. Please try again.', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      token = data.data.token;
      userEmail = data.data.user.email;

      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', userEmail);

      showMessage(authMessage, 'Registration successful!', 'success');

      setTimeout(() => {
        showTaskSection();
        loadTasks();
        document.getElementById('registerForm').reset();
      }, 1000);
    } else {
      showMessage(authMessage, data.error, 'error');
    }
  } catch (error) {
    showMessage(authMessage, 'Registration failed. Please try again.', 'error');
  }
}

function handleLogout() {
  token = null;
  userEmail = null;
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');

  showAuthSection();
  tasksContainer.innerHTML = '';
}

// Task handlers
async function loadTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      renderTasks(data.data);
    } else {
      if (response.status === 401) {
        handleLogout();
        showMessage(authMessage, 'Session expired. Please login again.', 'error');
      } else {
        showMessage(taskMessage, data.error, 'error');
      }
    }
  } catch (error) {
    showMessage(taskMessage, 'Failed to load tasks.', 'error');
  }
}

async function handleAddTask(e) {
  e.preventDefault();

  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });

    const data = await response.json();

    if (data.success) {
      showMessage(taskMessage, 'Task added successfully!', 'success');
      document.getElementById('taskForm').reset();
      loadTasks();

      setTimeout(() => clearMessage(taskMessage), 3000);
    } else {
      if (response.status === 401) {
        handleLogout();
        showMessage(authMessage, 'Session expired. Please login again.', 'error');
      } else {
        showMessage(taskMessage, data.error, 'error');
      }
    }
  } catch (error) {
    showMessage(taskMessage, 'Failed to add task.', 'error');
  }
}

async function toggleTaskComplete(id, completed) {
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ completed: !completed })
    });

    const data = await response.json();

    if (data.success) {
      loadTasks();
    } else {
      if (response.status === 401) {
        handleLogout();
        showMessage(authMessage, 'Session expired. Please login again.', 'error');
      } else {
        showMessage(taskMessage, data.error, 'error');
      }
    }
  } catch (error) {
    showMessage(taskMessage, 'Failed to update task.', 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      showMessage(taskMessage, 'Task deleted successfully!', 'success');
      loadTasks();

      setTimeout(() => clearMessage(taskMessage), 3000);
    } else {
      if (response.status === 401) {
        handleLogout();
        showMessage(authMessage, 'Session expired. Please login again.', 'error');
      } else {
        showMessage(taskMessage, data.error, 'error');
      }
    }
  } catch (error) {
    showMessage(taskMessage, 'Failed to delete task.', 'error');
  }
}

// UI helpers
function renderTasks(tasks) {
  if (tasks.length === 0) {
    tasksContainer.innerHTML = '<div class="empty-state">No tasks yet. Add your first task above!</div>';
    return;
  }

  tasksContainer.innerHTML = tasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}">
      <div class="task-header">
        <div class="task-title">${escapeHtml(task.title)}</div>
      </div>
      ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-actions">
        <button class="${task.completed ? 'uncomplete-btn' : 'complete-btn'}" onclick="toggleTaskComplete('${task._id}', ${task.completed})">
          ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
        </button>
        <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function showAuthSection() {
  authSection.style.display = 'block';
  taskSection.style.display = 'none';
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  clearMessage(authMessage);
}

function showTaskSection() {
  authSection.style.display = 'none';
  taskSection.style.display = 'block';
  userEmailSpan.textContent = userEmail;
  clearMessage(taskMessage);
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;
}

function clearMessage(element) {
  element.textContent = '';
  element.className = 'message';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
