const BASE_URL = window.location.origin;
const TOKEN_KEY = "token";
const EMAIL_KEY = "userEmail";
const PROJECT_KEY = "projects";

const state = {
  tasks: [],
  projects: []
};

let noticeTimer;

function setNotice(message, type = "info") {
  const noticeEl = document.getElementById("notice");
  if (!noticeEl) return;
  clearTimeout(noticeTimer);
  noticeEl.textContent = message;
  noticeEl.className = `notice show ${type}`;
  noticeTimer = setTimeout(() => {
    noticeEl.className = "notice";
  }, 4000);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getEmail() {
  return localStorage.getItem(EMAIL_KEY) || "";
}

function setAuthStatus() {
  const statusEl = document.getElementById("auth-status");
  const assigneeEl = document.getElementById("task-assignee");
  const email = getEmail();

  if (statusEl) {
    statusEl.textContent = getToken() && email
      ? `Logged in as ${email}`
      : "Not logged in yet.";
  }

  if (assigneeEl && email && !assigneeEl.value) {
    assigneeEl.value = email;
  }
}

function updateDashboard() {
  const totalEl = document.getElementById("total-tasks");
  const completedEl = document.getElementById("completed-tasks");
  const pendingEl = document.getElementById("pending-tasks");

  const total = state.tasks.length;
  const completed = state.tasks.filter(task => normalizeStatus(task.status) === "completed").length;
  const pending = Math.max(total - completed, 0);

  if (totalEl) totalEl.textContent = total;
  if (completedEl) completedEl.textContent = completed;
  if (pendingEl) pendingEl.textContent = pending;
}

function normalizeStatus(status) {
  if (!status) return "todo";
  const normalized = String(status).toLowerCase();
  if (normalized === "completed" || normalized === "done") return "completed";
  return "todo";
}

/* ================= AUTH ================= */

async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    setNotice("Enter both email and password to sign up.", "error");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "member" })
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    setNotice("Signup successful. You can log in now.", "success");
  } catch (err) {
    setNotice(err.message || "Signup failed.", "error");
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    setNotice("Enter your email and password to log in.", "error");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(EMAIL_KEY, email);
    setAuthStatus();
    setNotice("Login successful. Tasks are now available.", "success");
    getTasks();
  } catch (err) {
    setNotice(err.message || "Login failed.", "error");
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  state.tasks = [];
  renderTasks();
  updateDashboard();
  setAuthStatus();
  setNotice("You have been logged out.", "info");
}

/* ================= PROJECTS ================= */

function loadProjects() {
  const stored = localStorage.getItem(PROJECT_KEY);
  state.projects = stored ? JSON.parse(stored) : [];
  renderProjects();
}

function saveProjects() {
  localStorage.setItem(PROJECT_KEY, JSON.stringify(state.projects));
}

function createProject() {
  const input = document.getElementById("project-name");
  const name = input.value.trim();

  if (!name) {
    setNotice("Project name is required.", "error");
    return;
  }

  const project = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    createdAt: new Date().toISOString()
  };

  state.projects.unshift(project);
  saveProjects();
  renderProjects();
  input.value = "";
  setNotice("Project created.", "success");
}

function renderProjects() {
  const listEl = document.getElementById("project-list");
  if (!listEl) return;

  if (!state.projects.length) {
    listEl.innerHTML = `
      <div class="project-item">
        <div>
          <div class="task-title">No projects yet</div>
          <div class="project-meta">Create your first project to organize tasks.</div>
        </div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = state.projects.map(project => `
    <div class="project-item">
      <div>
        <div class="task-title">${escapeHtml(project.name)}</div>
        <div class="project-meta">Created ${new Date(project.createdAt).toLocaleDateString()}</div>
      </div>
      <div class="project-actions">
        <button class="pill" data-action="open" data-id="${project.id}">Open board</button>
        <button class="pill danger" data-action="archive" data-id="${project.id}">Archive</button>
      </div>
    </div>
  `).join("");
}

function handleProjectAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const projectId = button.dataset.id;
  const project = state.projects.find(item => item.id === projectId);
  if (!project) return;

  if (action === "open") {
    setNotice(`Opened project: ${project.name}`, "info");
    return;
  }

  if (action === "archive") {
    state.projects = state.projects.filter(item => item.id !== projectId);
    saveProjects();
    renderProjects();
    setNotice("Project archived.", "success");
  }
}

/* ================= TASKS ================= */

async function createTask() {
  const title = document.getElementById("task-title").value.trim();
  const assignee = document.getElementById("task-assignee").value.trim();
  const status = document.getElementById("task-status").value;
  const token = getToken();
  const emailFallback = getEmail() || document.getElementById("email").value.trim();

  if (!token) {
    setNotice("Log in to create tasks.", "error");
    return;
  }

  if (!title) {
    setNotice("Task title is required.", "error");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify({
        title,
        assignedTo: assignee || emailFallback,
        status
      })
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    document.getElementById("task-title").value = "";
    setNotice("Task created successfully.", "success");
    getTasks();
  } catch (err) {
    setNotice(err.message || "Task creation failed.", "error");
  }
}

async function getTasks() {
  const token = getToken();
  if (!token) {
    setNotice("Log in to load tasks.", "error");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/tasks`, {
      headers: {
        Authorization: token
      }
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    state.tasks = await res.json();
    renderTasks();
    updateDashboard();
    setNotice("Tasks refreshed.", "info");
  } catch (err) {
    setNotice(err.message || "Unable to load tasks.", "error");
  }
}

function renderTasks() {
  const listEl = document.getElementById("task-list");
  const countEl = document.getElementById("task-count");
  if (!listEl) return;

  const searchInput = document.getElementById("task-search");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const filtered = state.tasks.filter(task => {
    const title = (task.title || "").toLowerCase();
    const assignee = (task.assignedTo || "").toLowerCase();
    return title.includes(query) || assignee.includes(query);
  });

  if (countEl) {
    const total = state.tasks.length;
    countEl.textContent = total
      ? `Showing ${filtered.length} of ${total} tasks`
      : "No tasks loaded";
  }

  if (!state.tasks.length) {
    listEl.innerHTML = `
      <div class="task-item">
        <div>
          <div class="task-title">No tasks yet</div>
          <div class="task-meta">Create a task to get started.</div>
        </div>
      </div>
    `;
    return;
  }

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="task-item">
        <div>
          <div class="task-title">No matching tasks</div>
          <div class="task-meta">Create a task or clear the search filter.</div>
        </div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(task => {
    const normalized = normalizeStatus(task.status);
    const label = normalized === "completed" ? "Completed" : "Pending";
    const badgeClass = normalized === "completed" ? "completed" : "pending";
    return `
      <div class="task-item">
        <div>
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">Assigned to ${escapeHtml(task.assignedTo || "Unassigned")}</div>
        </div>
        <span class="status-badge ${badgeClass}">${label}</span>
      </div>
    `;
  }).join("");
}

/* ================= INIT ================= */

function init() {
  loadProjects();
  setAuthStatus();
  updateDashboard();

  const projectList = document.getElementById("project-list");
  if (projectList) {
    projectList.addEventListener("click", handleProjectAction);
  }

  const searchInput = document.getElementById("task-search");
  if (searchInput) {
    searchInput.addEventListener("input", renderTasks);
  }

  if (getToken()) {
    getTasks();
  } else {
    renderTasks();
  }
}

window.addEventListener("DOMContentLoaded", init);