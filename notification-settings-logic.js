// c:\Users\Admin\Documents\GitHub\horario\notification-settings-logic.js

import { sendMessageToSW } from './notification-logic.js';

/**
 * Inicializa la UI y la lógica de la página de configuración de notificaciones.
 */
export function initializeNotificationSettings() {
    const permissionStatusEl = document.getElementById('permission-status');
    const enabledBtn = document.getElementById('notifications-enabled-btn');
    const leadTimeSelect = document.getElementById('notification-lead-time');
    const testBtn = document.getElementById('test-notification-btn');

    /**
     * Actualiza la UI para reflejar el estado actual de los permisos y configuraciones.
     */
    const updateUI = () => {
        const permission = Notification.permission;
        permissionStatusEl.textContent = `Estado del permiso: ${permission}`;
        permissionStatusEl.className = `status-text ${permission}`;

        const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
        const leadTime = localStorage.getItem('notificationLeadTime') || '2'; // Default 2 mins

        if (permission === 'granted') {
            enabledBtn.textContent = notificationsEnabled ? 'Desactivar' : 'Activar';
            enabledBtn.style.backgroundColor = notificationsEnabled ? '#dc3545' : '#28a745';
            leadTimeSelect.disabled = false;
            testBtn.disabled = false;
        } else {
            enabledBtn.textContent = 'Solicitar Permiso';
            enabledBtn.style.backgroundColor = '#007bff';
            leadTimeSelect.disabled = true;
            testBtn.disabled = true;
        }

        leadTimeSelect.value = leadTime;
    };

    /**
     * Maneja el clic en el botón principal de activación/permiso.
     */
    enabledBtn.addEventListener('click', () => {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    // Si se concede el permiso, activar las notificaciones por defecto.
                    localStorage.setItem('notificationsEnabled', 'true');
                    sendMessageToSW({ type: 'SET_NOTIFICATIONS', payload: { enabled: true } });
                }
                updateUI();
            });
        } else {
            // Si ya hay permiso, simplemente alterna el estado.
            const currentlyEnabled = localStorage.getItem('notificationsEnabled') === 'true';
            const newEnabledState = !currentlyEnabled;
            localStorage.setItem('notificationsEnabled', newEnabledState.toString());
            sendMessageToSW({ type: 'SET_NOTIFICATIONS', payload: { enabled: newEnabledState } });
            updateUI();
        }
    });

    /**
     * Guarda el tiempo de antelación y notifica al Service Worker.
     */
    leadTimeSelect.addEventListener('change', () => {
        const newLeadTime = leadTimeSelect.value;
        localStorage.setItem('notificationLeadTime', newLeadTime);
        sendMessageToSW({ type: 'SET_LEAD_TIME', payload: { leadTime: parseInt(newLeadTime, 10) } });
        alert(`Configuración guardada: se notificará ${newLeadTime} minutos antes.`);
    });

    /**
     * Maneja el botón de prueba.
     */
    testBtn.addEventListener('click', () => {
        if (Notification.permission !== 'granted') {
            alert('Primero debes conceder el permiso para las notificaciones.');
            return;
        }
        sendMessageToSW({ type: 'TEST_NOTIFICATION', delay: 5 });
        alert('Recibirás una notificación de prueba en 5 segundos.');
    });

    // Inicializar la UI al cargar la página.
    updateUI();
}