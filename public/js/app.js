const API_BASE = "/api";

const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const expenseForm = document.getElementById("expenseForm");
const expenseMessage = document.getElementById("expenseMessage");
const expensesList = document.getElementById("expensesList");
const listMessage = document.getElementById("listMessage");
const toast = document.getElementById("toast");

let authMode = "login";
let currentUser = null;
let expenses = [];

function getToken() {
  return localStorage.getItem("expenseTrackerToken");
}

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.className = `message ${type}`.trim();
}

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) logout(false);
    throw new Error(data.message || "Request failed. Please try again.");
  }
  return data;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 2600);
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === "register";
  document.getElementById("loginTab").classList.toggle("active", !registering);
  document.getElementById("registerTab").classList.toggle("active", registering);
  document.getElementById("nameField").classList.toggle("hidden", !registering);
  document.getElementById("name").required = registering;
  document.getElementById("password").autocomplete = registering ? "new-password" : "current-password";
  document.getElementById("authSubmit").textContent = registering ? "Create account" : "Login";
  setMessage(authMessage, "");
}

function showDashboard(user) {
  currentUser = user;
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");
  document.getElementById("currentUser").textContent = user ? `Hi, ${user.name}` : "";
  document.getElementById("date").value = new Date().toISOString().slice(0, 10);
}

function showAuth() {
  dashboard.classList.add("hidden");
  authSection.classList.remove("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
  document.getElementById("currentUser").textContent = "";
}

function logout(showMessage = true) {
  localStorage.removeItem("expenseTrackerToken");
  currentUser = null;
  expenses = [];
  showAuth();
  if (showMessage) showToast("You have logged out.");
}

document.getElementById("loginTab").addEventListener("click", () => setAuthMode("login"));
document.getElementById("registerTab").addEventListener("click", () => setAuthMode("register"));
document.getElementById("logoutBtn").addEventListener("click", () => logout());
document.getElementById("refreshBtn").addEventListener("click", loadExpenses);

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = document.getElementById("authSubmit");
  submit.disabled = true;
  setMessage(authMessage, authMode === "register" ? "Creating account..." : "Logging in...");

  const body = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };
  if (authMode === "register") body.name = document.getElementById("name").value.trim();

  try {
    const data = await apiRequest(`/auth/${authMode}`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    localStorage.setItem("expenseTrackerToken", data.token);
    showDashboard(data.user);
    authForm.reset();
    await loadExpenses();
    showToast(data.message);
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  } finally {
    submit.disabled = false;
  }
});

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = expenseForm.querySelector('button[type="submit"]');
  button.disabled = true;
  setMessage(expenseMessage, "Saving expense...");

  const body = {
    description: document.getElementById("description").value.trim(),
    amount: Number(document.getElementById("amount").value),
    category: document.getElementById("category").value,
    date: document.getElementById("date").value
  };

  try {
    const data = await apiRequest("/expenses", {
      method: "POST",
      body: JSON.stringify(body)
    });
    expenseForm.reset();
    document.getElementById("date").value = new Date().toISOString().slice(0, 10);
    document.getElementById("category").value = "Food";
    setMessage(expenseMessage, data.message, "success");
    await loadExpenses();
  } catch (error) {
    setMessage(expenseMessage, error.message, "error");
  } finally {
    button.disabled = false;
  }
});

async function loadExpenses() {
  if (!getToken()) return;
  setMessage(listMessage, "Loading expenses...");
  try {
    const data = await apiRequest("/expenses");
    expenses = data.expenses || [];
    renderExpenses();
  } catch (error) {
    setMessage(listMessage, error.message, "error");
  }
}

function renderExpenses() {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  document.getElementById("totalAmount").textContent = formatCurrency(total);
  document.getElementById("transactionCount").textContent = String(expenses.length);
  document.getElementById("averageAmount").textContent =
    formatCurrency(expenses.length ? total / expenses.length : 0);

  expensesList.replaceChildren();
  setMessage(listMessage, "");

  if (!expenses.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No expenses yet. Add your first expense using the form.";
    expensesList.appendChild(empty);
    return;
  }

  expenses.forEach((expense) => {
    const item = document.createElement("article");
    item.className = "expense-item";

    const main = document.createElement("div");
    main.className = "expense-main";

    const icon = document.createElement("div");
    icon.className = "expense-icon";
    icon.textContent = (expense.category || "O").slice(0, 1).toUpperCase();

    const details = document.createElement("div");
    details.className = "expense-details";

    const title = document.createElement("div");
    title.className = "expense-title";
    title.textContent = expense.description;

    const meta = document.createElement("div");
    meta.className = "expense-meta";
    meta.textContent = `${expense.category} · ${formatDate(expense.date)}`;

    details.append(title, meta);
    main.append(icon, details);

    const right = document.createElement("div");
    right.className = "expense-right";

    const amount = document.createElement("div");
    amount.className = "expense-amount";
    amount.textContent = formatCurrency(Number(expense.amount));

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteExpense(expense.id, deleteButton));

    right.append(amount, deleteButton);
    item.append(main, right);
    expensesList.appendChild(item);
  });
}

async function deleteExpense(id, button) {
  if (!window.confirm("Delete this expense? This cannot be undone.")) return;
  button.disabled = true;
  try {
    const data = await apiRequest(`/expenses/${encodeURIComponent(id)}`, { method: "DELETE" });
    showToast(data.message);
    await loadExpenses();
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

async function initialize() {
  if (!getToken()) {
    showAuth();
    return;
  }
  try {
    // Validate the saved token by requesting this user's protected expenses.
    showDashboard({ name: "there" });
    await loadExpenses();
    // The token's identity is validated by the API; this demo does not persist profile data separately.
    const savedUser = JSON.parse(localStorage.getItem("expenseTrackerUser") || "null");
    if (savedUser) showDashboard(savedUser);
  } catch (error) {
    logout(false);
  }
}

// Keep basic profile details alongside the token for the greeting only.
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
  originalSetItem.call(this, key, value);
};

// Store profile when login/register succeeds via wrapping api response in submit handler.
const originalApiRequest = apiRequest;
apiRequest = async function(path, options = {}) {
  const data = await originalApiRequest(path, options);
  if (path === "/auth/login" || path === "/auth/register") {
    if (data.user) localStorage.setItem("expenseTrackerUser", JSON.stringify(data.user));
  }
  return data;
};

const originalLogout = logout;
logout = function(showMessage = true) {
  localStorage.removeItem("expenseTrackerUser");
  originalLogout(showMessage);
};

initialize();
