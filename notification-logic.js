// c:\Users\Admin\Documents\GitHub\horario\notification-logic.js

/**
 * Envía un mensaje al Service Worker.
 * @param {object} message - El objeto de mensaje a enviar.
 */
export function sendMessageToSW(message) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
    } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => reg.active.postMessage(message));
    }
}

/**
 * Inicializa la lógica de notificaciones en la UI.
 */
export function initializeNotifications() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const iosInstallPrompt = document.getElementById('ios-install-prompt');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    // Ocultar el botón de notificaciones y mostrar el prompt de instalación en iOS si no está en modo standalone
    if (isIOS && !isInStandaloneMode()) {
        notificationsBtn.style.display = 'none';
        iosInstallPrompt.style.display = 'block';
        return;
    }

    // Ocultar el prompt de instalación si no es iOS o ya está en standalone
    iosInstallPrompt.style.display = 'none';

    // Verificar si las notificaciones y Service Workers son soportados
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('Notificaciones o Service Workers no soportados en este navegador.');
        return;
    }
    
    // Esperar a que el Service Worker esté listo para interactuar con él
    navigator.serviceWorker.ready.then(() => {
        console.log('Service Worker listo. Configurando notificaciones.');
        // Enviar la configuración actual al SW al iniciar
        const leadTime = parseInt(localStorage.getItem('notificationLeadTime') || '2', 10);
        sendMessageToSW({ type: 'SET_LEAD_TIME', payload: { leadTime } });

        // Actualizar el estado del botón de notificaciones al cargar la página
        if (localStorage.getItem('notificationsEnabled') === 'true' && Notification.permission === 'granted') {
            notificationsBtn.innerHTML = '🔔 Notificaciones Activas';
            sendMessageToSW({ type: 'SET_NOTIFICATIONS', payload: { enabled: true } });
        } else {
            notificationsBtn.innerHTML = '🔕 Notificaciones';
            // Si el permiso no está concedido, asegurar que el estado en localStorage sea 'false'
            if (Notification.permission !== 'granted') {
                localStorage.setItem('notificationsEnabled', 'false');
            }
        }
        notificationsBtn.style.visibility = 'visible'; // Mostrar el botón una vez configurado
    }).catch(error => console.error('Error al inicializar Service Worker:', error));

    // Manejar el clic en el botón de notificaciones
    notificationsBtn.addEventListener('click', () => {
        if (localStorage.getItem('notificationsEnabled') === 'true' && Notification.permission === 'granted') {
            // Si las notificaciones están activadas y el permiso concedido, desactivarlas
            localStorage.setItem('notificationsEnabled', 'false');
            notificationsBtn.innerHTML = '🔕 Notificaciones Inactivas';
            sendMessageToSW({ type: 'SET_NOTIFICATIONS', payload: { enabled: false } });
            console.log('Notificaciones desactivadas.');
        } else {
            // Si no están activadas o el permiso no está concedido, solicitar permiso
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    // Si el permiso es concedido, activar notificaciones
                    localStorage.setItem('notificationsEnabled', 'true');
                    notificationsBtn.innerHTML = '🔔 Notificaciones Activas';
                    sendMessageToSW({ type: 'SET_NOTIFICATIONS', payload: { enabled: true } });
                    console.log('Permiso concedido. Notificaciones activadas.');
                } else {
                    // Si el permiso es denegado
                    console.log('Permiso denegado.');
                    alert('No has dado permiso para las notificaciones. Puedes cambiarlo en la configuración de tu navegador.');
                }
            });
        }
    });
}

/**
 * Maneja el botón de prueba de notificación.
 */
export function initializeTestNotificationButton() {
    document.getElementById('test-notification-btn').addEventListener('click', () => {
        if (Notification.permission !== 'granted') {
            alert('Primero debes permitir las notificaciones usando el ícono 🔔.');
            return;
        }
        sendMessageToSW({ type: 'TEST_NOTIFICATION', delay: 5 });
        alert('Recibirás una notificación en 5 segundos. Puedes cambiar de app o bloquear la pantalla para verla.');
    });
}