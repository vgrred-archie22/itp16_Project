(function () {
  'use strict';

  // State
  let todos = [];
  let statusFilter = 'all';
  let priorityFilter = 'all';
  let searchQuery = '';
  let editingId = null;

  // DOM Elements
  const $ = (id) => document.getElementById(id);
  const taskForm = $('task-form');
  const taskTitleInput = $('task-title');
  const taskPrioritySelect = $('task-priority');
  const taskList = $('task-list');
  const searchInput = $('search-input');
  const filterPrioritySelect = $('filter-priority');
  const statsCount = $('stats-count');
  const clearCompletedBtn = $('clear-completed');
  const alertBox = $('alert-box');
  const themeToggle = $('theme-toggle');
  const authPanel = $('auth-panel');
  const authForm = $('auth-form');
  const authUsername = $('auth-username');
  const authPassword = $('auth-password');
  const authTitle = $('auth-title');
  const authDescription = $('auth-description');
  const authSubmit = $('auth-submit');
  const authModeToggle = $('auth-mode-toggle');
  const tasksCard = $('tasks-card');
  const accountControls = $('account-controls');
  const accountName = $('account-name');
  const logoutButton = $('logout-button');
  const footerTip = $('footer-tip');
  let authMode = 'login';

  // Initialize Theme
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeToggleText(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateThemeToggleText('dark');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeToggleText(next);
  }

  function updateThemeToggleText(theme) {
    themeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  }

  // API Call Wrapper
  async function api(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || 'Server request failed');
      error.status = response.status;
      if (response.status === 401 && endpoint.startsWith('/api/todos')) {
        setSignedOut('Your session expired. Please sign in again.');
      }
      throw error;
    }

    return data;
  }

  // UI Alerts
  function showError(msg) {
    if (!msg) {
      alertBox.style.display = 'none';
      alertBox.textContent = '';
      return;
    }
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
  }

  function setSignedOut(message = '') {
    todos = [];
    authPanel.hidden = false;
    tasksCard.hidden = true;
    accountControls.hidden = true;
    footerTip.textContent = 'Sign in to access your private task list.';
    render();
    showError(message);
  }

  function setSignedIn(user) {
    authPanel.hidden = true;
    tasksCard.hidden = false;
    accountControls.hidden = false;
    accountName.textContent = user.username;
    footerTip.textContent = 'Tip: Double-click any task title to edit it inline.';
    showError(null);
  }

  function updateAuthMode() {
    const registering = authMode === 'register';
    authTitle.textContent = registering ? 'Create account' : 'Sign in';
    authDescription.textContent = registering
      ? 'Create an account to keep your tasks private.'
      : 'Sign in to see your private task list.';
    authSubmit.textContent = registering ? 'Create account' : 'Sign in';
    authModeToggle.textContent = registering ? 'Already have an account? Sign in' : 'Create an account';
    authPassword.autocomplete = registering ? 'new-password' : 'current-password';
  }

  async function checkSession() {
    try {
      const user = await api('/api/auth/me');
      setSignedIn(user);
      await fetchTodos();
    } catch (err) {
      if (err.status !== 401) showError('Could not check your sign-in: ' + err.message);
    }
  }

  // Fetch Todos
  async function fetchTodos() {
    try {
      showError(null);
      todos = await api('/api/todos');
      render();
    } catch (err) {
      if (err.status !== 401) showError('Failed to load tasks: ' + err.message);
    }
  }

  // Render Todos
  function render() {
    taskList.innerHTML = '';

    // Filter Logic
    const filtered = todos.filter((t) => {
      // Status filter
      if (statusFilter === 'active' && t.done) return false;
      if (statusFilter === 'done' && !t.done) return false;

      // Priority filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      // Search filter
      if (searchQuery) {
        return t.title.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });

    // Update Counter
    const openCount = todos.filter((t) => !t.done).length;
    const doneCount = todos.length - openCount;
    statsCount.textContent = `${openCount} active • ${doneCount} completed`;

    if (filtered.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty-state';
      emptyLi.innerHTML = `
        <div style="font-size: 2rem;">📝</div>
        <p>${todos.length ? 'No tasks match your filters.' : 'No tasks added yet. Add one above!'}</p>
      `;
      taskList.appendChild(emptyLi);
      return;
    }

    filtered.forEach((task) => {
      const li = document.createElement('li');
      li.className = `todo-item ${task.done ? 'done' : ''}`;
      li.dataset.id = task.id;

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'custom-checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Toggle completion');
      checkbox.addEventListener('change', () => toggleTaskDone(task.id, checkbox.checked));

      // Content Container
      const content = document.createElement('div');
      content.className = 'todo-content';

      if (editingId === task.id) {
        // Edit Mode Input
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'todo-edit-input';
        editInput.value = task.title;

        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveEditTitle(task.id, editInput.value);
          if (e.key === 'Escape') cancelEdit();
        });

        editInput.addEventListener('blur', () => saveEditTitle(task.id, editInput.value));

        content.appendChild(editInput);
        setTimeout(() => editInput.focus(), 10);
      } else {
        // Display Title
        const titleSpan = document.createElement('span');
        titleSpan.className = 'todo-title';
        titleSpan.textContent = task.title;
        titleSpan.addEventListener('dblclick', () => startEdit(task.id));
        content.appendChild(titleSpan);

        // Priority Badge
        const badge = document.createElement('span');
        badge.className = `badge badge-${task.priority}`;
        badge.textContent = task.priority;
        content.appendChild(badge);
      }

      // Actions
      const actions = document.createElement('div');
      actions.className = 'actions';

      if (editingId !== task.id) {
        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.title = 'Edit Title';
        editBtn.innerHTML = '✏️';
        editBtn.addEventListener('click', () => startEdit(task.id));

        // Priority Select Quick Toggle
        const prioSelect = document.createElement('select');
        prioSelect.className = 'select-field';
        prioSelect.style.padding = '0.2rem 0.4rem';
        prioSelect.style.fontSize = '0.8rem';
        prioSelect.style.borderRadius = '6px';
        ['low', 'medium', 'high'].forEach((p) => {
          const opt = document.createElement('option');
          opt.value = p;
          opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
          if (p === task.priority) opt.selected = true;
          prioSelect.appendChild(opt);
        });
        prioSelect.addEventListener('change', (e) => changePriority(task.id, e.target.value));

        // Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn delete';
        delBtn.title = 'Delete Task';
        delBtn.innerHTML = '🗑️';
        delBtn.addEventListener('click', () => deleteTask(task.id));

        actions.appendChild(editBtn);
        actions.appendChild(prioSelect);
        actions.appendChild(delBtn);
      }

      li.appendChild(checkbox);
      li.appendChild(content);
      li.appendChild(actions);

      taskList.appendChild(li);
    });
  }

  // Handlers
  async function addTask(title, priority) {
    try {
      showError(null);
      const newTask = await api('/api/todos', 'POST', { title, priority });
      todos.unshift(newTask);
      render();
    } catch (err) {
      showError('Failed to create task: ' + err.message);
    }
  }

  async function toggleTaskDone(id, done) {
    try {
      showError(null);
      const updated = await api(`/api/todos/${id}`, 'PATCH', { done });
      const idx = todos.findIndex((t) => t.id === id);
      if (idx !== -1) todos[idx] = updated;
      render();
    } catch (err) {
      showError('Failed to update task: ' + err.message);
      fetchTodos();
    }
  }

  async function changePriority(id, priority) {
    try {
      showError(null);
      const updated = await api(`/api/todos/${id}`, 'PATCH', { priority });
      const idx = todos.findIndex((t) => t.id === id);
      if (idx !== -1) todos[idx] = updated;
      render();
    } catch (err) {
      showError('Failed to update priority: ' + err.message);
    }
  }

  function startEdit(id) {
    editingId = id;
    render();
  }

  function cancelEdit() {
    editingId = null;
    render();
  }

  async function saveEditTitle(id, newTitle) {
    if (!editingId) return;
    const trimmed = newTitle.trim();
    editingId = null;
    if (!trimmed) {
      render();
      return;
    }

    try {
      showError(null);
      const updated = await api(`/api/todos/${id}`, 'PATCH', { title: trimmed });
      const idx = todos.findIndex((t) => t.id === id);
      if (idx !== -1) todos[idx] = updated;
      render();
    } catch (err) {
      showError('Failed to update title: ' + err.message);
      render();
    }
  }

  async function deleteTask(id) {
    try {
      showError(null);
      await api(`/api/todos/${id}`, 'DELETE');
      todos = todos.filter((t) => t.id !== id);
      render();
    } catch (err) {
      showError('Failed to delete task: ' + err.message);
    }
  }

  async function clearCompleted() {
    try {
      showError(null);
      await api('/api/todos/completed', 'DELETE');
      todos = todos.filter((t) => !t.done);
      render();
    } catch (err) {
      showError('Failed to clear completed tasks: ' + err.message);
    }
  }

  // Event Listeners
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const priority = taskPrioritySelect.value;
    if (!title) return;

    addTask(title, priority);
    taskTitleInput.value = '';
    taskTitleInput.focus();
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  filterPrioritySelect.addEventListener('change', (e) => {
    priorityFilter = e.target.value;
    render();
  });

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      statusFilter = e.target.dataset.status;
      render();
    });
  });

  clearCompletedBtn.addEventListener('click', clearCompleted);
  themeToggle.addEventListener('click', toggleTheme);

  authModeToggle.addEventListener('click', () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    updateAuthMode();
  });

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      showError(null);
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const user = await api(endpoint, 'POST', {
        username: authUsername.value,
        password: authPassword.value,
      });
      authPassword.value = '';
      setSignedIn(user);
      await fetchTodos();
    } catch (err) {
      showError(err.message);
    }
  });

  logoutButton.addEventListener('click', async () => {
    try {
      await api('/api/auth/logout', 'POST');
      setSignedOut();
      authPassword.value = '';
    } catch (err) {
      showError('Failed to log out: ' + err.message);
    }
  });

  // Initialize
  initTheme();
  updateAuthMode();
  checkSession();
})();
