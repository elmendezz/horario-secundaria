// c:\Users\Admin\Documents\GitHub\horario\debug-logic.js

import { sendMessageToSW } from './notification-logic.js';
import { reportError } from './error-logic.js';

/**
 * Inicializa los controles de tiempo.
 */
function initializeTimeControls() {
    const timeSourceToggle = document.getElementById('time-source-toggle');
    const currentTimeSourceEl = document.getElementById('current-time-source');

    const updateTimeSourceUI = () => {
        const source = localStorage.getItem('timeSource') || 'local';
        currentTimeSourceEl.textContent = source === 'internet' ? 'Internet' : 'Local (Dispositivo)';
        timeSourceToggle.textContent = source === 'internet' ? 'Cambiar a Local' : 'Cambiar a Internet';
    };

    timeSourceToggle.addEventListener('click', () => {
        const currentSource = localStorage.getItem('timeSource') || 'local';
        const newSource = currentSource === 'local' ? 'internet' : 'local';
        localStorage.setItem('timeSource', newSource);
        updateTimeSourceUI();
        alert(`Fuente de hora cambiada a ${newSource}. Recarga la página principal para ver el efecto.`);
    });

    document.getElementById('time-simulation-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const day = parseInt(document.getElementById('day').value, 10);
        const hour = parseInt(document.getElementById('hour').value, 10);
        const minute = parseInt(document.getElementById('minute').value, 10);
        localStorage.setItem('simulatedTime', JSON.stringify({ day, hour, minute }));
        alert('Tiempo simulado aplicado. Recarga la página principal.');
    });

    document.getElementById('reset-time-btn').addEventListener('click', () => {
        localStorage.removeItem('simulatedTime');
        alert('Simulación de tiempo eliminada.');
    });

    updateTimeSourceUI();
}

/**
 * Inicializa los controles de notificaciones.
 */
function initializeNotificationControls() {
    const statusEl = document.getElementById('notification-permission-status');
    const lightEl = document.getElementById('notification-status-light');
    const classStatusEl = document.getElementById('class-notifications-status');

    const updateStatus = () => {
        const permission = Notification.permission;
        statusEl.textContent = permission;
        lightEl.className = 'status-light'; // Reset
        if (permission === 'granted') lightEl.classList.add('green');
        else if (permission === 'denied') lightEl.classList.add('red');
        else lightEl.classList.add('orange');

        const enabled = localStorage.getItem('notificationsEnabled') === 'true';
        classStatusEl.textContent = enabled && permission === 'granted' ? 'Activadas' : 'Desactivadas';
    };

    document.getElementById('request-permission-btn').addEventListener('click', () => {
        Notification.requestPermission().then(updateStatus);
    });

    document.getElementById('toggle-notifications-btn').addEventListener('click', () => {
        const enabled = localStorage.getItem('notificationsEnabled') !== 'true';
        localStorage.setItem('notificationsEnabled', enabled);
        sendMessageToSW({ type: 'SET_NOTIFICATIONS', payload: { enabled } });
        alert(`Notificaciones de clase ${enabled ? 'ACTIVADAS' : 'DESACTIVADAS'}.`);
        updateStatus();
    });

    document.getElementById('test-notification-btn').addEventListener('click', () => {
        if (Notification.permission !== 'granted') {
            alert('Primero debes conceder el permiso para las notificaciones.');
            return;
        }
        sendMessageToSW({ type: 'TEST_NOTIFICATION', delay: 5 });
        alert('Recibirás una notificación de prueba en 5 segundos.');
    });

    updateStatus();
}

/**
 * Inicializa los controles del Service Worker.
 */
function initializeSWControls() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            const statusEl = document.getElementById('sw-status');
            const lightEl = document.getElementById('sw-status-light');
            if (reg && reg.active) {
                statusEl.textContent = 'Activo y Controlando';
                lightEl.className = 'status-light green';
            } else {
                statusEl.textContent = 'Inactivo o No Registrado';
                lightEl.className = 'status-light red';
            }
        });
    }

    document.getElementById('unregister-sw-btn').addEventListener('click', async () => {
        if (!('serviceWorker' in navigator)) return;
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
            await reg.unregister();
            alert('Service Worker desregistrado. Recargando...');
            window.location.reload();
        } else {
            alert('No hay Service Worker registrado.');
        }
    });

    document.getElementById('clear-cache-btn').addEventListener('click', async () => {
        if (!('caches' in window)) return;
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        alert('Todas las cachés han sido eliminadas. Recargando...');
        window.location.reload();
    });

    document.getElementById('trigger-sync-btn').addEventListener('click', async () => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const reg = await navigator.serviceWorker.ready;
            await reg.sync.register('update-app-content');
            alert('Background Sync ("update-app-content") registrado. Revisa la consola del SW para ver el evento.');
        } else {
            alert('Background Sync no está soportado en este navegador.');
        }
    });
}

/**
 * Inicializa los controles de UI y usuario.
 */
function initializeUIControls() {
    const userStatusEl = document.getElementById('current-user-status');
    const themeStatusEl = document.getElementById('current-theme');
    const htmlEl = document.documentElement;

    const displayUsername = () => {
        userStatusEl.textContent = localStorage.getItem('username') || 'No establecido';
    };

    const displayTheme = () => {
        themeStatusEl.textContent = htmlEl.dataset.theme === 'dark' ? 'Oscuro' : 'Claro';
    };

    document.getElementById('change-username-btn').addEventListener('click', () => {
        const newUsername = prompt('Ingresa tu nombre:', localStorage.getItem('username') || '');
        if (newUsername && newUsername.trim()) {
            localStorage.setItem('username', newUsername.trim());
            displayUsername();
        }
    });

    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
        const newTheme = htmlEl.dataset.theme === 'dark' ? 'light' : 'dark';
        htmlEl.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        displayTheme();
    });

    document.getElementById('reset-theme-btn').addEventListener('click', () => {
        localStorage.removeItem('theme');
        const osTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        htmlEl.dataset.theme = osTheme;
        displayTheme();
        alert('Preferencia de tema eliminada. Se sincronizará con el sistema.');
    });

    displayUsername();
    displayTheme();
}

/**
 * Inicializa los controles de anuncios y errores.
 */
function initializeMiscControls() {
    document.getElementById('clear-dismissed-announcements-btn').addEventListener('click', () => {
        localStorage.removeItem('dismissedAnnouncements');
        alert('Anuncios descartados limpiados. Recarga la página principal para verlos de nuevo.');
    });

    document.getElementById('test-error-btn').addEventListener('click', () => {
        try {
            // Forzamos un error
            nonExistentFunction();
        } catch (error) {
            reportError(error, 'Error de Prueba Manual');
            alert('Se ha generado y reportado un error de prueba. Revisa la consola y el endpoint de errores.');
        }
    });
}

/**
 * Prueba las APIs de tiempo y muestra su estado.
 */
async function testTimeAPIs() {
    const container = document.getElementById('api-status-container');
    container.innerHTML = '<p>Probando APIs...</p>';

    const timeAPIs = [
        { name: 'WorldTimeAPI', url: 'https://worldtimeapi.org/api/timezone/America/Tijuana' },
        { name: 'TimeAPI.io', url: 'https://timeapi.io/api/TimeZone/zone?timeZone=America/Tijuana' }
    ];

    for (const api of timeAPIs) {
        const resultEl = document.createElement('p');
        try {
            const response = await fetch(api.url, { cache: 'no-store' }); // Evitar caché
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();
            resultEl.innerHTML = `<span class="status-light green"></span><strong>${api.name}:</strong> OK (${response.status}) - ${new Date(data.datetime || data.currentLocalTime).toLocaleTimeString()}`;
        } catch (error) {
            resultEl.innerHTML = `<span class="status-light red"></span><strong>${api.name}:</strong> Falló (${error.message})`;
        }
        container.appendChild(resultEl);
    }
    container.querySelector('p').remove(); // Quitar el "Probando..."
}

/**
 * Función principal para inicializar toda la UI de depuración.
 */
export function initializeDebugUI() {
    initializeTimeControls();
    initializeNotificationControls();
    initializeSWControls();
    initializeUIControls();
    initializeMiscControls();
    testTimeAPIs();

    document.getElementById('re-test-apis-btn').addEventListener('click', testTimeAPIs);
}
```

### 3. Enlace a la Nueva Página

Para que sea fácil acceder, he añadido un enlace a `debug.html` en el menú de herramientas de desarrollo de `index.html`.

```diff
--- a/c/Users/Admin/Documents/GitHub/horario/index.html
+++ b/c/Users/Admin/Documents/GitHub/horario/index.html
