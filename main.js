// Constantes y variables globales
const API_URL = 'https://sid-restapi.onrender.com';
let authToken = '';
let currentUsername = '';

// Elementos del DOM
const loginPanel = document.getElementById('loginPanel');
const registerPanel = document.getElementById('registerPanel');
const mainPanel = document.getElementById('mainPanel');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const showRegisterButton = document.getElementById('showRegister');
const showLoginButton = document.getElementById('showLogin');
const logoutButton = document.getElementById('logoutButton');
const updateScoreBtn = document.getElementById('updateScoreBtn');
const showScoreboardBtn = document.getElementById('showScoreboardBtn');
const submitScoreButton = document.getElementById('submitScore');
const welcomeUsername = document.getElementById('welcomeUsername');
const updateScoreSection = document.getElementById('updateScoreSection');
const scoreboardSection = document.getElementById('scoreboardSection');
const scoreboardBody = document.getElementById('scoreboardBody');
const newScoreInput = document.getElementById('newScore');

// Mensajes de error/éxito
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');
const scoreError = document.getElementById('scoreError');
const scoreSuccess = document.getElementById('scoreSuccess');

// Inicialización
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Verificar si hay un token almacenado
    authToken = localStorage.getItem('token') || '';
    currentUsername = localStorage.getItem('username') || '';
    
    // Configurar event listeners
    setupEventListeners();
    
    // Verificar autenticación al cargar
    if (authToken && currentUsername) {
        verifyToken();
    } else {
        showLoginPanel();
    }
}

function setupEventListeners() {
    // Botones de navegación
    loginButton.addEventListener('click', login);
    registerButton.addEventListener('click', register);
    showRegisterButton.addEventListener('click', showRegisterPanel);
    showLoginButton.addEventListener('click', showLoginPanel);
    logoutButton.addEventListener('click', logout);
    updateScoreBtn.addEventListener('click', showUpdateScoreSection);
    showScoreboardBtn.addEventListener('click', showScoreboard);
    submitScoreButton.addEventListener('click', updateScore);
    
    // Permitir enviar formularios con Enter
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });
    
    newScoreInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') updateScore();
    });
}

// Funciones de navegación
function showLoginPanel() {
    loginPanel.classList.remove('hidden');
    registerPanel.classList.add('hidden');
    mainPanel.classList.add('hidden');
    clearMessages();
}

function showRegisterPanel() {
    loginPanel.classList.add('hidden');
    registerPanel.classList.remove('hidden');
    mainPanel.classList.add('hidden');
    clearMessages();
}

function showMainPanel() {
    loginPanel.classList.add('hidden');
    registerPanel.classList.add('hidden');
    mainPanel.classList.remove('hidden');
    welcomeUsername.textContent = currentUsername;
    showUpdateScoreSection();
    clearMessages();
}

function showUpdateScoreSection() {
    updateScoreSection.classList.remove('hidden');
    scoreboardSection.classList.add('hidden');
    updateScoreBtn.classList.add('active');
    showScoreboardBtn.classList.remove('active');
}

function showScoreboard() {
    updateScoreSection.classList.add('hidden');
    scoreboardSection.classList.remove('hidden');
    updateScoreBtn.classList.remove('active');
    showScoreboardBtn.classList.add('active');
    loadScoreboard();
}

function clearMessages() {
    loginError.style.display = 'none';
    registerError.style.display = 'none';
    registerSuccess.style.display = 'none';
    scoreError.style.display = 'none';
    scoreSuccess.style.display = 'none';
}

// Funciones de autenticación
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError(loginError, 'Por favor, completa todos los campos');
        return;
    }
    
    try {
        // Mostrar estado de carga
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        loginButton.disabled = true;
        
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            currentUsername = username;
            
            // Guardar en localStorage
            localStorage.setItem('token', authToken);
            localStorage.setItem('username', currentUsername);
            
            showMainPanel();
        } else {
            const error = await response.json();
            showError(loginError, error.msg || 'Error en usuario o contraseña');
        }
    } catch (error) {
        showError(loginError, 'Error de conexión');
    } finally {
        // Restaurar estado normal del botón
        loginButton.innerHTML = '<i class="fas fa-paper-plane"></i> Iniciar Sesión';
        loginButton.disabled = false;
    }
}

async function register() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password || !confirmPassword) {
        showError(registerError, 'Por favor, completa todos los campos');
        return;
    }
    
    if (password !== confirmPassword) {
        showError(registerError, 'Las contraseñas no coinciden');
        return;
    }
    
    try {
        // Mostrar estado de carga
        registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        registerButton.disabled = true;
        
        const response = await fetch(`${API_URL}/api/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            showSuccess(registerSuccess, 'Usuario registrado correctamente. Ahora puedes iniciar sesión.');
            
            // Limpiar formulario
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            const error = await response.json();
            showError(registerError, error.msg || 'Error al registrar usuario');
        }
    } catch (error) {
        showError(registerError, 'Error de conexión');
    } finally {
        // Restaurar estado normal del botón
        registerButton.innerHTML = '<i class="fas fa-user-plus"></i> Registrarse';
        registerButton.disabled = false;
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/api/usuarios/${currentUsername}`, {
            method: 'GET',
            headers: {
                'x-token': authToken
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            // Verificar que el usuario tenga datos
            if (data.usuario) {
                showMainPanel();
            } else {
                logout();
            }
        } else {
            // Token inválido, cerrar sesión
            logout();
        }
    } catch (error) {
        showError(loginError, 'Error de conexión');
    }
}

function logout() {
    authToken = '';
    currentUsername = '';
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    showLoginPanel();
}

// Funciones de puntuación
async function updateScore() {
    const newScore = parseInt(newScoreInput.value);
    
    if (isNaN(newScore) || newScore < 0) {
        showError(scoreError, 'Por favor, ingresa una puntuación válida');
        return;
    }
    
    try {
        // Mostrar estado de carga
        submitScoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        submitScoreButton.disabled = true;
        
        const response = await fetch(`${API_URL}/api/usuarios`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-token': authToken
            },
            body: JSON.stringify({ 
                username: currentUsername,
                data: { score: newScore }
            })
        });
        
        if (response.ok) {
            showSuccess(scoreSuccess, 'Puntuación actualizada correctamente');
            newScoreInput.value = '';
            
            // Recargar la tabla de puntuaciones si está visible
            if (!scoreboardSection.classList.contains('hidden')) {
                loadScoreboard();
            }
        } else {
            const error = await response.json();
            showError(scoreError, error.msg || 'Error al actualizar la puntuación');
        }
    } catch (error) {
        showError(scoreError, 'Error de conexión');
    } finally {
        // Restaurar estado normal del botón
        submitScoreButton.innerHTML = '<i class="fas fa-save"></i> Actualizar';
        submitScoreButton.disabled = false;
    }
}

// ... (código anterior se mantiene igual)

async function loadScoreboard() {
    try {
        // Mostrar indicador de carga
        scoreboardBody.innerHTML = `
            <div class="scoreboard-item" style="text-align: center;">
                <div class="position"><i class="fas fa-spinner fa-spin"></i></div>
                <div class="username">Cargando puntuaciones</div>
                <div class="score">...</div>
            </div>
        `;
        
        const response = await fetch(`${API_URL}/api/usuarios?limit=100&sort=true`, {
            method: 'GET',
            headers: {
                'x-token': authToken
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("Datos recibidos de la API:", data); // Para depuración
            displayScoreboard(data.usuarios);
        } else {
            // Error al cargar la tabla de puntuaciones
            scoreboardBody.innerHTML = `
                <div class="scoreboard-item" style="text-align: center; color: var(--error-color);">
                    <div class="position"><i class="fas fa-exclamation-circle"></i></div>
                    <div class="username">Error al cargar la tabla</div>
                    <div class="score">---</div>
                </div>
            `;
            console.error("Error en la respuesta:", response.status);
        }
    } catch (error) {
        scoreboardBody.innerHTML = `
            <div class="scoreboard-item" style="text-align: center; color: var(--error-color);">
                <div class="position"><i class="fas fa-exclamation-circle"></i></div>
                <div class="username">Error de conexión</div>
                <div class="score">---</div>
            </div>
        `;
        console.error("Error en la solicitud:", error);
    }
}

function displayScoreboard(users) {
    // Limpiar tabla
    scoreboardBody.innerHTML = '';
    
    // Verificar si hay usuarios
    if (!users || users.length === 0) {
        scoreboardBody.innerHTML = `
            <div class="scoreboard-item" style="text-align: center;">
                <div class="position"><i class="fas fa-info-circle"></i></div>
                <div class="username">No hay usuarios registrados</div>
                <div class="score">---</div>
            </div>
        `;
        return;
    }
    
    // Depuración: mostrar la estructura de los datos de usuario
    console.log("Estructura del primer usuario:", users[0]);
    
    // Ordenar usuarios por puntuación (de mayor a menor)
    // Buscar el campo correcto que contiene la puntuación
    users.sort((a, b) => {
        // Intentar encontrar el campo de puntuación
        const scoreA = a.score !== undefined ? a.score : 
                      (a.puntuacion !== undefined ? a.puntuacion : 
                      (a.points !== undefined ? a.points : 0));
        
        const scoreB = b.score !== undefined ? b.score : 
                      (b.puntuacion !== undefined ? b.puntuacion : 
                      (b.points !== undefined ? b.points : 0));
        
        return scoreB - scoreA;
    });
    
    // Agregar usuarios a la tabla
    users.forEach((user, index) => {
        const item = document.createElement('div');
        item.className = 'scoreboard-item';
        
        // Resaltar usuario actual
        if (user.username === currentUsername) {
            item.classList.add('current-user');
        }
        
        // Intentar encontrar el campo de puntuación
        let userScore = 0;
        if (user.score !== undefined) {
            userScore = user.score;
        } else if (user.puntuacion !== undefined) {
            userScore = user.puntuacion;
        } else if (user.points !== undefined) {
            userScore = user.points;
        } else {
            // Si no encontramos el campo, mostramos todos los campos para depuración
            console.log("Usuario sin campo score claro:", user);
        }
        
        // Agregar iconos para los primeros puestos
        let medalIcon = '';
        if (index === 0) {
            medalIcon = '<i class="fas fa-medal medal-gold"></i> ';
        } else if (index === 1) {
            medalIcon = '<i class="fas fa-medal medal-silver"></i> ';
        } else if (index === 2) {
            medalIcon = '<i class="fas fa-medal medal-bronze"></i> ';
        }
        
        item.innerHTML = `
            <div class="position">${medalIcon}${index + 1}</div>
            <div class="username">${user.username}</div>
            <div class="score">${userScore}</div>
        `;
        
        scoreboardBody.appendChild(item);
    });
}

// ... (el resto del código se mantiene igual)
// Utilidades
function showError(element, message) {
    element.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    element.style.display = 'block';
}

function showSuccess(element, message) {
    element.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    element.style.display = 'block';
}