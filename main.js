// Constantes y variables globales
const API_URL = 'http://127.0.0.1:1234';
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
    
    // Focus automático en el campo de score al mostrar la sección
    updateScoreBtn.addEventListener('click', () => {
        setTimeout(() => {
            newScoreInput.focus();
        }, 100);
    });
    
    // Validación en tiempo real
    newScoreInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value && !isNaN(value) && parseInt(value) >= 0) {
            newScoreInput.style.borderColor = 'var(--success-color)';
        } else {
            newScoreInput.style.borderColor = 'var(--border-color)';
        }
    });
    
    // Limpiar mensajes al empezar a escribir
    newScoreInput.addEventListener('focus', () => {
        scoreError.style.display = 'none';
        scoreSuccess.style.display = 'none';
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
            testAPI(); // Ejecutar test después de iniciar sesión
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
            console.log("Datos de verificación:", data); // Para debug
            if (data.usuario) {
                showMainPanel();
                testAPI(); // Ejecutar test después de verificar
            } else {
                console.log("No se encontró usuario en la respuesta");
                logout();
            }
        } else {
            console.log("Token inválido o error en la respuesta");
            logout();
        }
    } catch (error) {
        showError(loginError, 'Error de conexión');
        console.error("Error en verifyToken:", error);
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
        newScoreInput.focus();
        return;
    }
    
    try {
        // Mostrar estado de carga
        const originalText = submitScoreButton.innerHTML;
        submitScoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        submitScoreButton.disabled = true;
        newScoreInput.disabled = true;
        
        // Agregar clase de loading
        submitScoreButton.classList.add('loading');
        
        // Intenta con diferentes formatos que la API podría esperar
        const response = await fetch(`${API_URL}/api/usuarios`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-token': authToken
            },
            body: JSON.stringify({ 
                username: currentUsername,
                score: newScore  // Primero intenta con este formato
            })
        });
        
        // Si falla, intenta con otro formato
        if (!response.ok) {
            const secondResponse = await fetch(`${API_URL}/api/usuarios`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': authToken
                },
                body: JSON.stringify({ 
                    username: currentUsername,
                    data: { score: newScore }  // Segundo intento
                })
            });
            
            if (secondResponse.ok) {
                showSuccess(scoreSuccess, '¡Puntuación actualizada correctamente! 🎉');
                newScoreInput.value = '';
                
                // Efecto visual de éxito
                submitScoreButton.classList.remove('loading');
                submitScoreButton.classList.add('success');
                setTimeout(() => {
                    submitScoreButton.classList.remove('success');
                }, 2000);
                
                // Recargar la tabla de puntuaciones si está visible
                if (!scoreboardSection.classList.contains('hidden')) {
                    loadScoreboard();
                }
            } else {
                const error = await secondResponse.json();
                showError(scoreError, error.msg || 'Error al actualizar la puntuación');
                
                // Feedback visual de error
                submitScoreButton.classList.remove('loading');
                submitScoreButton.classList.add('error');
                setTimeout(() => {
                    submitScoreButton.classList.remove('error');
                }, 2000);
            }
        } else {
            showSuccess(scoreSuccess, '¡Puntuación actualizada correctamente! 🎉');
            newScoreInput.value = '';
            
            // Efecto visual de éxito
            submitScoreButton.classList.remove('loading');
            submitScoreButton.classList.add('success');
            setTimeout(() => {
                submitScoreButton.classList.remove('success');
            }, 2000);
            
            // Recargar la tabla de puntuaciones si está visible
            if (!scoreboardSection.classList.contains('hidden')) {
                loadScoreboard();
            }
        }
    } catch (error) {
        showError(scoreError, 'Error de conexión. Intenta nuevamente.');
        submitScoreButton.classList.remove('loading');
    } finally {
        // Restaurar estado normal
        submitScoreButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Puntuación';
        submitScoreButton.disabled = false;
        newScoreInput.disabled = false;
    }
}

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
    
    // DEBUG: Mostrar la estructura completa del primer usuario
    console.log("Estructura completa del primer usuario:", users[0]);
    
    // Buscar cualquier campo que parezca ser numérico (podría ser la puntuación)
    const numericFields = [];
    Object.keys(users[0]).forEach(key => {
        if (typeof users[0][key] === 'number') {
            numericFields.push(key);
        }
    });
    console.log("Campos numéricos encontrados:", numericFields);
    
    // Ordenar usuarios - probar con diferentes campos
    users.sort((a, b) => {
        // Prioridad de campos para buscar la puntuación
        const scoreA = a.score !== undefined ? a.score : 
                      (a.puntuacion !== undefined ? a.puntuacion : 
                      (a.points !== undefined ? a.points : 
                      (a.puntos !== undefined ? a.puntos : 0)));
        
        const scoreB = b.score !== undefined ? b.score : 
                      (b.puntuacion !== undefined ? b.puntuacion : 
                      (b.points !== undefined ? b.points : 
                      (b.puntos !== undefined ? b.puntos : 0)));
        
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
        
        // Buscar la puntuación en diferentes campos posibles
        let userScore = '0';
        const possibleScoreFields = ['score', 'puntuacion', 'points', 'puntos'];
        
        for (const field of possibleScoreFields) {
            if (user[field] !== undefined) {
                userScore = user[field];
                break;
            }
        }
        
        // Si no encontramos, mostrar todos los campos para debug
        if (userScore === '0') {
            console.log("Usuario sin campo de puntuación claro:", user);
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

// Función de debugging para ver la respuesta de la API
async function testAPI() {
    try {
        console.log("Probando conexión con la API...");
        
        // Probamos obtener los datos del usuario actual
        const response = await fetch(`${API_URL}/api/usuarios/${currentUsername}`, {
            method: 'GET',
            headers: {
                'x-token': authToken
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log("Datos del usuario actual:", userData);
        } else {
            console.error("Error al obtener datos del usuario:", response.status);
        }
        
    } catch (error) {
        console.error("Error en testAPI:", error);
    }
}

// Utilidades
function showError(element, message) {
    element.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    element.style.display = 'block';
}

function showSuccess(element, message) {
    element.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    element.style.display = 'block';
}