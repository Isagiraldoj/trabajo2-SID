// =========================
// Config
// =========================
const API_BASE = "https://sid-restapi.onrender.com";

const els = {
  // Screens
  auth: document.getElementById("auth-screen"),
  app: document.getElementById("app-screen"),

  // Tabs/forms
  tabLogin: document.getElementById("tab-login"),
  tabRegister: document.getElementById("tab-register"),
  formLogin: document.getElementById("form-login"),
  formRegister: document.getElementById("form-register"),

  // Login inputs/messages
  loginUser: document.getElementById("login-username"),
  loginPass: document.getElementById("login-password"),
  loginMsg: document.getElementById("login-msg"),

  // Register inputs/messages
  regUser: document.getElementById("register-username"),
  regPass: document.getElementById("register-password"),
  regMsg: document.getElementById("register-msg"),

  // App screen
  sessionUser: document.getElementById("session-user"),
  tokenState: document.getElementById("token-state"),
  btnLogout: document.getElementById("btn-logout"),
  btnRefresh: document.getElementById("btn-refresh"),

  // Profile
  profileBox: document.getElementById("profile-box"),

  // Score
  formScore: document.getElementById("form-score"),
  scoreInput: document.getElementById("score-value"),
  scoreMsg: document.getElementById("score-msg"),

  // List
  formList: document.getElementById("form-list"),
  listLimit: document.getElementById("list-limit"),
  listSkip: document.getElementById("list-skip"),
  listSort: document.getElementById("list-sort"),
  tblUsersBody: document.querySelector("#tbl-users tbody"),
};

// =========================
// Helpers: storage & fetch
// =========================
const storage = {
  get token() { return localStorage.getItem("authToken") || ""; },
  set token(v) { v ? localStorage.setItem("authToken", v) : localStorage.removeItem("authToken"); },
  get username() { return localStorage.getItem("username") || ""; },
  set username(v) { v ? localStorage.setItem("username", v) : localStorage.removeItem("username"); },
};

async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers["x-token"] = storage.token;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.msg || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function setTokenState(ok) {
  els.tokenState.textContent = ok ? "token válido" : "token inválido";
  els.tokenState.className = `tag ${ok ? "ok" : "bad"}`;
}

// =========================
// UI switching
// =========================
function showAuth() {
  els.auth.classList.remove("hidden");
  els.app.classList.add("hidden");
}
function showApp() {
  els.auth.classList.add("hidden");
  els.app.classList.remove("hidden");
  els.sessionUser.textContent = storage.username || "—";
}

// Tabs
els.tabLogin.addEventListener("click", () => {
  els.tabLogin.classList.add("active");
  els.tabRegister.classList.remove("active");
  els.formLogin.classList.remove("hidden");
  els.formRegister.classList.add("hidden");
});
els.tabRegister.addEventListener("click", () => {
  els.tabRegister.classList.add("active");
  els.tabLogin.classList.remove("active");
  els.formRegister.classList.remove("hidden");
  els.formLogin.classList.add("hidden");
});

// =========================
// Auth: Register & Login
// =========================
els.formRegister.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.regMsg.textContent = "Registrando...";
  els.regMsg.className = "msg";

  try {
    const username = els.regUser.value.trim();
    const password = els.regPass.value;
    await apiFetch("/api/usuarios", { method: "POST", body: { username, password } });
    els.regMsg.textContent = "Usuario creado. Ahora inicia sesión 👉";
    els.regMsg.classList.add("ok");
    // Opcional: pasar a login con el usuario precargado
    els.tabLogin.click();
    els.loginUser.value = username;
    els.loginPass.value = "";
  } catch (err) {
    els.regMsg.textContent = `Error: ${err.message}`;
    els.regMsg.classList.add("err");
  }
});

els.formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.loginMsg.textContent = "Autenticando...";
  els.loginMsg.className = "msg";

  try {
    const username = els.loginUser.value.trim();
    const password = els.loginPass.value;
    const data = await apiFetch("/api/auth/login", { method: "POST", body: { username, password } });
    // Esperado: { usuario, token }
    storage.token = data?.token || "";
    storage.username = data?.usuario?.username || username;
    els.loginMsg.textContent = "¡Sesión iniciada!";
    els.loginMsg.classList.add("ok");
    await enterApp();
  } catch (err) {
    els.loginMsg.textContent = `Error: ${err.message}`;
    els.loginMsg.classList.add("err");
  }
});

els.btnLogout.addEventListener("click", () => {
  storage.token = "";
  storage.username = "";
  showAuth();
});

// =========================
async function validateToken() {
  if (!storage.token || !storage.username) return false;
  try {
    // pequeña consulta de perfil para validar token
    await apiFetch(`/api/usuarios?username=${encodeURIComponent(storage.username)}`, { auth: true });
    return true;
  } catch {
    return false;
  }
}

async function loadProfile() {
  els.profileBox.textContent = "Cargando perfil...";
  try {
    const data = await apiFetch(`/api/usuarios?username=${encodeURIComponent(storage.username)}`, { auth: true });
    // Respuesta esperada: { usuario }
    const user = data?.usuario || data;
    els.profileBox.textContent = JSON.stringify(user, null, 2);
  } catch (err) {
    els.profileBox.textContent = `Error: ${err.message}`;
  }
}

async function loadUsers() {
  const limit = Number(els.listLimit.value || 50);
  const skip = Number(els.listSkip.value || 0);
  const sort = !!els.listSort.checked;

  els.tblUsersBody.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;
  try {
    const data = await apiFetch(`/api/usuarios?limit=${limit}&skip=${skip}&sort=${sort}`, { auth: true });
    const list = data?.usuarios || data || [];

    // Ordenar por score descendente por si el backend no lo hace
    list.sort((a, b) => (Number(b?.score ?? 0) - Number(a?.score ?? 0)));

    els.tblUsersBody.innerHTML = "";
    list.forEach((u, i) => {
      const tr = document.createElement("tr");
      const score = (u && (u.score ?? u?.data?.score)) ?? 0;
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${u?.username ?? "—"}</td>
        <td>${Number(score) || 0}</td>
        <td>${String(u?.state ?? "—")}</td>
        <td class="mono small">${u?.uid ?? "—"}</td>
      `;
      els.tblUsersBody.appendChild(tr);
    });

    if (!list.length) {
      els.tblUsersBody.innerHTML = `<tr><td colspan="5">Sin usuarios.</td></tr>`;
    }
  } catch (err) {
    els.tblUsersBody.innerHTML = `<tr><td colspan="5" class="msg err">Error: ${err.message}</td></tr>`;
  }
}

els.formList.addEventListener("submit", async (e) => {
  e.preventDefault();
  await loadUsers();
});

els.btnRefresh.addEventListener("click", async () => {
  await enterApp(); // recarga perfil + tabla
});

// =========================
// Actualizar score (PATCH)
// =========================
els.formScore.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.scoreMsg.textContent = "Guardando...";
  els.scoreMsg.className = "msg";

  try {
    const score = Number(els.scoreInput.value);
    const body = {
      username: storage.username,
      data: { score }, // según el diagrama: { username, data:{} }
    };
    await apiFetch("/api/usuarios", { method: "PATCH", body, auth: true });
    els.scoreMsg.textContent = "Score actualizado.";
    els.scoreMsg.classList.add("ok");
    els.scoreInput.value = "";
    await loadProfile();
    await loadUsers();
  } catch (err) {
    els.scoreMsg.textContent = `Error: ${err.message}`;
    els.scoreMsg.classList.add("err");
  }
});

// =========================
// Entrar a la app
// =========================
async function enterApp() {
  showApp();
  els.sessionUser.textContent = storage.username || "—";
  const ok = await validateToken();
  setTokenState(ok);
  if (!ok) return showAuth();
  await Promise.all([loadProfile(), loadUsers()]);
}

// =========================
// Boot
// =========================
(async function boot() {
  if (storage.token && storage.username) {
    await enterApp();
  } else {
    showAuth();
  }
})();
