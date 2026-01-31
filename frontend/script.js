const TASKS_API = '/api/tasks';
const AUTH_REGISTER = '/api/auth/register';
const AUTH_LOGIN = '/api/auth/login';
const TOKEN_KEY = 'token';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const authSection = document.getElementById('authSection');
const taskSection = document.getElementById('taskSection');
const loginWrap = document.getElementById('loginWrap');
const registerWrap = document.getElementById('registerWrap');
const authToggleText = document.getElementById('authToggleText');
const authToggleLink = document.getElementById('authToggleLink');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const statusFilter = document.getElementById('statusFilter');

let allTasks = [];

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function showLoginView() {
  loginWrap.style.display = 'block';
  registerWrap.style.display = 'none';
  authToggleText.textContent = 'New user? ';
  authToggleLink.textContent = 'Register now';
}

function showRegisterView() {
  loginWrap.style.display = 'none';
  registerWrap.style.display = 'block';
  authToggleText.textContent = 'Already have an account? ';
  authToggleLink.textContent = 'Login';
}

function showAuth() {
  authSection.style.display = 'block';
  taskSection.style.display = 'none';
  logoutBtn.style.display = 'none';
  showLoginView();
}

function showTasks() {
  authSection.style.display = 'none';
  taskSection.style.display = 'block';
  logoutBtn.style.display = 'block';
}

function apiRequest(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  return fetch(url, { ...options, headers }).then(function (res) {
    if (res.status === 401) {
      clearToken();
      showAuth();
      throw new Error('Session expired. Please log in again.');
    }
    return res;
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getFilteredTasks() {
  const filter = statusFilter.value;
  if (filter === 'All') return allTasks;
  return allTasks.filter(function (task) { return task.status === filter; });
}

function renderTasks() {
  const tasks = getFilteredTasks();
  taskList.innerHTML = '';
  if (tasks.length === 0) {
    taskList.innerHTML = "<p class='empty'>No tasks to show.</p>";
    return;
  }
  tasks.forEach(function (task) {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.dataset.id = task._id;
    item.innerHTML =
      '<div class="task-content">' +
      '<strong>' + escapeHtml(task.title) + '</strong>' +
      '<p>' + escapeHtml(task.description) + '</p>' +
      '<span class="status">' + escapeHtml(task.status) + '</span>' +
      '</div>' +
      '<div class="task-actions">' +
      '<button type="button" class="btn-edit" onclick="startEdit(\'' + task._id + '\')">Edit</button>' +
      '<button type="button" class="btn-delete" onclick="deleteTask(\'' + task._id + '\')">Delete</button>' +
      '</div>';
    taskList.appendChild(item);
  });
}

function fetchTasks() {
  apiRequest(TASKS_API)
    .then(function (res) { return res.json(); })
    .then(function (tasks) {
      allTasks = tasks;
      renderTasks();
    })
    .catch(function (err) {
      if (getToken()) {
        console.error('[TaskManager] fetchTasks', err);
        alert(err.message || 'Failed to load tasks.');
      }
    });
}

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  fetch(AUTH_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.error) throw new Error(data.error);
      setToken(data.token);
      showTasks();
      fetchTasks();
      loginForm.reset();
      alert('Logged in successfully.');
    })
    .catch(function (err) {
      console.error('[TaskManager] login', err);
      alert(err.message || 'Login failed.');
    });
});

registerForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }
  fetch(AUTH_REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.error) throw new Error(data.error);
      setToken(data.token);
      showTasks();
      fetchTasks();
      registerForm.reset();
      alert('Registered successfully.');
    })
    .catch(function (err) {
      console.error('[TaskManager] register', err);
      alert(err.message || 'Registration failed.');
    });
});

logoutBtn.addEventListener('click', function () {
  clearToken();
  showAuth();
  allTasks = [];
});

authToggleLink.addEventListener('click', function (e) {
  e.preventDefault();
  if (registerWrap.style.display === 'none') {
    showRegisterView();
  } else {
    showLoginView();
  }
});

statusFilter.addEventListener('change', renderTasks);

taskForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const status = document.getElementById('status').value;
  apiRequest(TASKS_API, {
    method: 'POST',
    body: JSON.stringify({ title: title, description: description, status: status })
  })
    .then(function (res) { return res.json(); })
    .then(function (task) {
      alert('Task added successfully.');
      taskForm.reset();
      fetchTasks();
    })
    .catch(function (err) {
      console.error('[TaskManager] addTask', err);
      alert(err.message || 'Failed to add task.');
    });
});

function startEdit(id) {
  const item = document.querySelector('.task-item[data-id="' + id + '"]');
  if (!item) return;
  const content = item.querySelector('.task-content');
  const titleEl = content.querySelector('strong');
  const descEl = content.querySelector('p');
  const statusEl = content.querySelector('.status');
  const actions = item.querySelector('.task-actions');
  const title = titleEl.textContent;
  const description = descEl.textContent;
  const status = statusEl.textContent;
  content.innerHTML =
    '<input type="text" class="edit-title" value="' + escapeHtml(title) + '" placeholder="Title">' +
    '<textarea class="edit-desc" rows="2" placeholder="Description">' + escapeHtml(description) + '</textarea>' +
    '<select class="edit-status">' +
    '<option value="Pending"' + (status === 'Pending' ? ' selected' : '') + '>Pending</option>' +
    '<option value="In Progress"' + (status === 'In Progress' ? ' selected' : '') + '>In Progress</option>' +
    '<option value="Completed"' + (status === 'Completed' ? ' selected' : '') + '>Completed</option>' +
    '</select>';
  actions.innerHTML =
    '<button type="button" class="btn-save" onclick="saveEdit(\'' + id + '\')">Save</button>' +
    '<button type="button" class="btn-cancel" onclick="fetchTasks()">Cancel</button>';
}

function saveEdit(id) {
  const item = document.querySelector('.task-item[data-id="' + id + '"]');
  if (!item) return;
  const title = item.querySelector('.edit-title').value.trim();
  const description = item.querySelector('.edit-desc').value.trim();
  const status = item.querySelector('.edit-status').value;
  apiRequest(TASKS_API + '/' + id, {
    method: 'PUT',
    body: JSON.stringify({ title: title, description: description, status: status })
  })
    .then(function (res) { return res.json(); })
    .then(function () {
      alert('Task updated successfully.');
      fetchTasks();
    })
    .catch(function (err) {
      console.error('[TaskManager] saveEdit', err);
      alert(err.message || 'Failed to update task.');
    });
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  apiRequest(TASKS_API + '/' + id, { method: 'DELETE' })
    .then(function (res) { return res.json(); })
    .then(function () {
      alert('Task deleted successfully.');
      fetchTasks();
    })
    .catch(function (err) {
      console.error('[TaskManager] deleteTask', err);
      alert(err.message || 'Failed to delete task.');
    });
}

if (getToken()) {
  showTasks();
  fetchTasks();
} else {
  showAuth();
}
