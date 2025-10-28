// c:\Users\Admin\Documents\GitHub\horario\test-ui-logic.js

import { sendMessageToSW } from './notification-logic.js';

/**
 * Inicializa el toggle de tema (claro/oscuro).
 */
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const htmlElement = document.documentElement;
    let savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.dataset.theme = savedTheme;
    
    themeToggle.addEventListener('click', () => {
        let newTheme = htmlElement.dataset.theme === 'dark' ? 'light' : 'dark';
        htmlElement.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
    });
}

/**
 * Inicializa la funcionalidad de pantalla completa.
 */
function initializeFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (!fullscreenBtn) return;

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => alert(`Error al entrar en pantalla completa: ${err.message}`));
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });
}

/**
 * Inicializa los controles de notificación en la página de pruebas.
 */
function initializeTestNotifications() {
    const updateStatus = () => {
        const statusEl = document.getElementById('notification-permission-status');
        const lightEl = document.getElementById('notification-status-light');
        if (!statusEl || !lightEl) return;

        const permission = Notification.permission;
        statusEl.textContent = permission;
        lightEl.className = 'status-light'; // Reset
        if (permission === 'granted') lightEl.classList.add('green');
        else if (permission === 'denied') lightEl.classList.add('red');
        else lightEl.classList.add('orange');
    };

    document.getElementById('request-permission-btn')?.addEventListener('click', () => {
        Notification.requestPermission().then(updateStatus);
    });

    document.getElementById('toggle-notifications-btn')?.addEventListener('click', () => {
        const enabled = localStorage.getItem('notificationsEnabled') !== 'true';
        localStorage.setItem('notificationsEnabled', enabled);
        sendMessageToSW({ type: 'SET_NOTIFICATIONS', payload: { enabled } });
        alert(`Notificaciones de clase ${enabled ? 'ACTIVADAS' : 'DESACTIVADAS'}.`);
    });

    document.getElementById('test-notification-btn')?.addEventListener('click', () => {
        if (Notification.permission !== 'granted') {
            alert('Primero debes solicitar y conceder el permiso para las notificaciones.');
            return;
        }
        sendMessageToSW({ type: 'TEST_NOTIFICATION', delay: 5 });
        alert('Recibirás una notificación de prueba en 5 segundos. Puedes cambiar de app o bloquear la pantalla para verla.');
    });

    updateStatus();
}

/**
 * Inicializa el formulario de simulación de tiempo.
 */
function initializeTimeSimulation() {
    document.getElementById('time-simulation-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const day = parseInt(document.getElementById('day').value, 10);
        const hour = parseInt(document.getElementById('hour').value, 10);
        const minute = parseInt(document.getElementById('minute').value, 10);
        localStorage.setItem('simulatedTime', JSON.stringify({ day, hour, minute }));
        alert('Tiempo simulado. La página principal ahora usará esta hora. Puedes volver y recargarla.');
    });

    document.getElementById('reset-time-btn')?.addEventListener('click', () => {
        localStorage.removeItem('simulatedTime');
        alert('Simulación eliminada. La página principal volverá a la hora real.');
    });
}

/**
 * Inicializa los controles del Service Worker.
 */
function initializeServiceWorkerControls() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            const statusEl = document.getElementById('sw-status');
            const lightEl = document.getElementById('sw-status-light');
            if (reg && reg.active) {
                if(statusEl) statusEl.textContent = 'Activo y Controlando';
                if(lightEl) lightEl.className = 'status-light green';
            }
        });
    }

    document.getElementById('trigger-sync-btn')?.addEventListener('click', async () => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const reg = await navigator.serviceWorker.ready;
            await reg.sync.register('update-app-content');
            alert('Background Sync ("update-app-content") registrado. Revisa la consola del SW.');
        } else {
            alert('Background Sync no está soportado.');
        }
    });

    document.getElementById('clear-cache-btn')?.addEventListener('click', async () => {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
            alert('Cachés eliminadas. Recargando...');
            window.location.reload();
        }
    });

    document.getElementById('unregister-sw-btn')?.addEventListener('click', async () => {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                await reg.unregister();
                alert('Service Worker desregistrado. Recargando...');
                window.location.reload();
            } else {
                alert('No hay Service Worker registrado.');
            }
        }
    });
}

/**
 * Inicializa los controles de anuncios.
 */
function initializeAnnouncementControls() {
    document.getElementById('clear-dismissed-announcements-btn')?.addEventListener('click', () => {
        localStorage.removeItem('dismissedAnnouncements');
        alert('Anuncios descartados limpiados. Recarga la página principal para verlos.');
    });
}

/**
 * Inicializa la gestión del nombre de usuario.
 */
function initializeUserControls() {
    const userStatusEl = document.getElementById('current-user-status');
    const changeUsernameBtn = document.getElementById('change-username-btn');

    const displayUsername = () => {
        const username = localStorage.getItem('username') || 'No establecido';
        if (userStatusEl) userStatusEl.textContent = username;
    };

    if (changeUsernameBtn) {
        changeUsernameBtn.addEventListener('click', () => {
            const currentUsername = localStorage.getItem('username') || 'invitado';
            const newUsername = prompt('Por favor, ingresa tu nombre o apodo:', currentUsername);

            if (newUsername && newUsername.trim() !== '') {
                const sanitizedUsername = newUsername.trim();
                localStorage.setItem('username', sanitizedUsername);
                displayUsername();
                alert(`¡Nombre guardado como: ${sanitizedUsername}!`);
            } else if (newUsername !== null) { // Si no presionó "Cancelar"
                alert('El nombre no puede estar vacío.');
            }
        });
    }

    displayUsername();
}

/**
 * Función principal para inicializar toda la UI de la página de pruebas.
 */
export function initializeTestUI() {
    initializeThemeToggle();
    initializeFullscreen();
    initializeTestNotifications();
    initializeTimeSimulation();
    initializeServiceWorkerControls();
    initializeAnnouncementControls();
    initializeUserControls();
}