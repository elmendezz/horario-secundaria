// sw.js (Versión con Widgets)

const CACHE_NAME = 'horario-1cv-cache-v91'; // Incrementamos la versión del caché
const urlsToCache = [
    '/', 
    'index.html', 
    'horario.jpg', 
    'manifest.json',
    'widget_template.json', // Agregamos el template del widget a la caché
    'images/icons/icon-192x192.png',
    'schedule-data.js', // ¡Añadimos el horario centralizado a la caché!
    'schedule-utils.js',
    'notification-logic.js',
    'ui-logic.js',
    'script.js',
    'style.css'
];

// Variable global para almacenar el horario una vez cargado.
let scheduleData = null;

/**
 * Carga el horario desde el módulo centralizado.
 * Usa una variable global para cachear el resultado y no importarlo múltiples veces.
 */
async function getSchedule() {
    if (!scheduleData) {
        console.log('SW: Cargando datos del horario por primera vez...');
        // Usamos import() dinámico, que funciona en Service Workers modernos.
        scheduleData = await import('./schedule-data.js');
    }
    return scheduleData;
}

// =================== LÓGICA DE WIDGETS ===================

async function updateWidget() {
    if (!self.widgets) {
        console.log('SW: La API de widgets no está disponible.');
        return;
    }

    // Obtenemos el horario y la duración de la clase de forma asíncrona.
    const { schedule, classDuration } = await getSchedule();
    
    const now = new Date();
    const day = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let currentClass = null;
    let nextClass = null;

    if (day >= 1 && day <= 5) {
        const todaySchedule = schedule[day - 1];
        for (let i = 0; i < todaySchedule.length; i++) {
            const classStartHour = todaySchedule[i].time[0];
            const classStartMinute = todaySchedule[i].time[1];
            const classStartTotalMinutes = classStartHour * 60 + classStartMinute;
            const classEndTotalMinutes = classStartTotalMinutes + classDuration;
            const nowTotalMinutes = currentHour * 60 + currentMinute;

            if (nowTotalMinutes >= classStartTotalMinutes && nowTotalMinutes < classEndTotalMinutes) {
                currentClass = { ...todaySchedule[i], index: i };
                break;
            }
        }

        if (currentClass) {
            if (currentClass.index + 1 < todaySchedule.length) {
                const nextClassStartHour = todaySchedule[currentClass.index + 1].time[0];
                const nextClassStartMinute = todaySchedule[currentClass.index + 1].time[1];
                const recessStartTotalMinutes = recessTime[0] * 60 + recessTime[1];
                 // Check if the next class is after recess
                 if(classEndTotalMinutes <= recessStartTotalMinutes && (nextClassStartHour * 60 + nextClassStartMinute) > recessStartTotalMinutes){
                    nextClass = { name: "Receso", time: recessTime };
                 } else {
                    nextClass = todaySchedule[currentClass.index + 1];
                 }
            } else {
                 nextClass = { name: "Fin de las clases por hoy", time: null };
            }
        } else {
            for (let i = 0; i < todaySchedule.length; i++) {
                const classStartTotalMinutes = todaySchedule[i].time[0] * 60 + todaySchedule[i].time[1];
                if (classStartTotalMinutes > (currentHour * 60 + currentMinute)) {
                    nextClass = todaySchedule[i];
                    break;
                }
            }
        }
    }
    
    const widgetData = {
        currentTitle: currentClass ? "Clase Actual:" : "No hay clase ahora",
        currentSubtitle: currentClass ? currentClass.name : "¡Tiempo libre!",
        nextTitle: nextClass ? "Siguiente:" : " ",
        nextSubtitle: nextClass ? `${nextClass.name}${nextClass.time ? ` a las ${String(nextClass.time[0]).padStart(2, '0')}:${String(nextClass.time[1]).padStart(2, '0')}` : ''}` : "Mañana será otro día."
    };

    const template = await caches.match('widget_template.json');
    if (!template) {
        console.error('SW: No se encontró el template del widget en la caché.');
        return;
    }
    
    const templateContent = await template.text();
    
    try {
        await self.widgets.updateByTag('schedule-widget', {
            template: templateContent,
            data: JSON.stringify(widgetData)
        });
        console.log('SW: Widget actualizado correctamente.');
    } catch (err) {
        console.error('SW: Fallo al actualizar el widget:', err);
    }
}


// Event listeners para el ciclo de vida del widget
self.addEventListener('widgetinstall', event => {
    console.log('SW: Widget instalado.', event);
    event.waitUntil(updateWidget());
});

self.addEventListener('widgetclick', event => {
    if (event.action === 'open-app') {
        event.waitUntil(clients.openWindow('/'));
    }
});

// Actualización periódica para mantener el widget al día
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-widget-periodic') {
    // Aprovechamos la sincronización periódica para re-evaluar las notificaciones,
    // lo que hace más robusto el sistema de fallback.
    event.waitUntil(checkAndShowDueNotifications());
    event.waitUntil(updateWidget());
  }
});


// =================== LÓGICA DE NOTIFICACIONES DE CLASES ===================

let notificationsEnabled = false;
let notificationLeadTime = 2; // Notificar X minutos antes. Valor por defecto.

/**
 * Abre la base de datos IndexedDB.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = self.indexedDB.open('sw-settings-db', 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore('settings');
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject(event.target.error);
    });
}

/**
 * Guarda un valor en IndexedDB.
 * @param {string} key
 * @param {any} value
 */
async function setSetting(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Obtiene un valor de IndexedDB.
 * @param {string} key
 */
async function getSetting(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Lógica de respaldo (fallback) para navegadores que no soportan Notification Triggers.
 * Programa la *próxima* notificación usando setTimeout y se apoya en periodicsync para ser robusto.
 */
async function scheduleNextNotificationFallback() {
    clearTimeout(notificationTimer); // Limpiar cualquier temporizador pendiente
    // En el nuevo modelo, esta función ya no programa con setTimeout.
    // Su propósito es simplemente asegurar que el estado es correcto.
    // La función checkAndShowDueNotifications() se encargará de mostrar las notificaciones.
    console.log('SW (Fallback): Verificando estado de notificaciones. La próxima sincronización mostrará las notificaciones pendientes.');

    if (!notificationsEnabled) {
        console.log('SW (Fallback): Notificaciones desactivadas.');
        return;
    }

    const { schedule } = await getSchedule();
    // Simplemente verificamos que todo esté en orden. No se necesita más aquí.
}

/**
 * (NUEVA FUNCIÓN)
 * Esta función se ejecuta periódicamente y al inicio.
 * Comprueba si alguna notificación de clase debería haberse mostrado y la muestra.
 * Es el corazón del nuevo sistema de fallback robusto.
 */
async function checkAndShowDueNotifications() {
    if (!notificationsEnabled || self.Notification.showTrigger) {
        // No hacer nada si las notificaciones están desactivadas o si el navegador usa el método moderno (Triggers).
        return;
    }

    console.log('SW (Fallback Check): Comprobando si hay notificaciones pendientes...');
    const { schedule } = await getSchedule();
    const now = new Date();

    for (let i = 0; i < 2; i++) { // Comprobar hoy y mañana
        const checkDate = new Date();
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const daySchedule = schedule[dayOfWeek - 1];
            for (const classItem of daySchedule) {
                if (classItem.name === "Receso") continue;

                const classStartTime = new Date(checkDate);
                classStartTime.setHours(classItem.time[0], classItem.time[1], 0, 0);
                const notificationTime = new Date(classStartTime.getTime() - (notificationLeadTime * 60 * 1000));

                // Comprobar si la notificación debió mostrarse en el último intervalo de chequeo (ej. 15 mins)
                const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
                if (notificationTime > fifteenMinutesAgo && notificationTime <= now) {
                    console.log(`SW (Fallback Check): Mostrando notificación pendiente para ${classItem.name}`);
                    self.registration.showNotification(classItem.name, {
                        body: `Tu clase está por comenzar.`, // Mensaje genérico ya que el tiempo exacto pasó
                        icon: 'images/icons/icon-192x192.png',
                        tag: `class-${classStartTime.getTime()}`
                    });
                }
            }
        }
    }
}

/**
 * Orquestador principal de notificaciones.
 * Intenta usar el método moderno (Triggers) y si no puede, usa el fallback (setTimeout).
 */
async function scheduleClassNotifications() {
    // Si el navegador soporta Triggers, usamos el método preferido.
    if (self.Notification.showTrigger) {
        await scheduleClassNotificationsWithTriggers();
    } else {
        // Si no, usamos el método de respaldo.
        console.warn('SW: Notification Triggers no soportado. Usando fallback con setTimeout.');
        await scheduleNextNotificationFallback();
    }
}

/**
 * Programa notificaciones usando el método moderno y preferido: Notification Triggers.
 */
async function scheduleClassNotificationsWithTriggers() {
    // Primero, cancelar todas las notificaciones programadas anteriormente para evitar duplicados.
    const existingNotifications = await self.registration.getNotifications({
        includeTriggered: true
    });
    for (const notification of existingNotifications) {
        if (notification.tag && notification.tag.startsWith('class-')) {
            notification.close();
        }
    }
    console.log('SW: Notificaciones de clase anteriores canceladas.');

    if (!notificationsEnabled) {
        console.log('SW (Triggers): Notificaciones desactivadas, no se programará nada.');
        return; 
    }

    const { schedule } = await getSchedule();

    const now = new Date();
    let scheduledCount = 0;

    // Programar para los próximos 2 días para ser seguros
    for (let i = 0; i < 2; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
            const todaySchedule = schedule[dayOfWeek - 1];
            for (const classItem of todaySchedule) {
                if (classItem.name === "Receso") continue; // No notificar recesos

                const classStartTime = new Date(checkDate);
                classStartTime.setHours(classItem.time[0], classItem.time[1], 0, 0);

                const notificationTime = new Date(classStartTime.getTime() - (notificationLeadTime * 60 * 1000));

                // Solo programar si la notificación es en el futuro
                if (notificationTime > now) {
                    try {
                        await self.registration.showNotification(classItem.name, {
                            body: `Tu clase comienza en ${notificationLeadTime} minutos.`,
                            icon: 'images/icons/icon-192x192.png',
                            tag: `class-${classStartTime.getTime()}`, // Etiqueta única para cada notificación
                            showTrigger: new TimestampTrigger(notificationTime.getTime()),
                        });
                        scheduledCount++;
                    } catch (e) {
                        console.error('SW: Error al programar notificación:', e);
                    }
                }
            }
        }
    }

    if (scheduledCount > 0) {
        console.log(`SW (Triggers): ${scheduledCount} notificaciones de clase programadas.`);
    } else {
        console.log('SW (Triggers): No hay próximas clases para programar notificaciones.');
    }
}

self.addEventListener('message', event => {
    const { type, payload } = event.data;

    if (type === 'GET_VERSION') {
        console.log('SW: Recibida solicitud de versión.');
        event.source.postMessage({ type: 'SW_VERSION', version: CACHE_NAME });
        return;
    }

    if (type === 'SET_NOTIFICATIONS') {
        notificationsEnabled = payload.enabled;
        event.waitUntil(setSetting('notificationsEnabled', notificationsEnabled));
        console.log(`SW: Notificaciones de clase ${notificationsEnabled ? 'ACTIVADAS' : 'DESACTIVADAS'}.`);
        event.waitUntil(scheduleClassNotifications()); // (Re)programar notificaciones al cambiar el estado
    }

    if (type === 'SET_LEAD_TIME') {
        notificationLeadTime = payload.leadTime || 2;
        event.waitUntil(setSetting('notificationLeadTime', notificationLeadTime));
        console.log(`SW: Tiempo de antelación para notificaciones actualizado a ${notificationLeadTime} minutos.`);
        event.waitUntil(scheduleClassNotifications()); // Re-programar con el nuevo tiempo
    }

    if (type === 'TEST_NOTIFICATION') {
        const delaySeconds = event.data.delay || 0;
        console.log(`SW: Solicitud para notificación de prueba en ${delaySeconds}s.`);

        const options = {
            body: 'Si ves esto, las notificaciones funcionan incluso con la app cerrada.',
            icon: 'images/icons/icon-192x192.png',
            tag: 'test-notification'
        };

        if (self.Notification.showTrigger) {
            // Método moderno y fiable
            options.showTrigger = new TimestampTrigger(Date.now() + delaySeconds * 1000);
            event.waitUntil(self.registration.showNotification('¡Notificación de Prueba! 🧪', options));
            console.log('SW: Notificación de prueba programada con TimestampTrigger.');
        } else {
            // Fallback con setTimeout (solo para la prueba, ya que es a corto plazo)
            setTimeout(() => self.registration.showNotification('¡Notificación de Prueba! 🧪', options), delaySeconds * 1000);
            console.log('SW: Notificación de prueba programada con setTimeout (fallback).');
        }
    }

    if (type === 'NEW_ANNOUNCEMENT_PUSH') {
        const { title, content } = payload;
        console.log('SW: Recibida solicitud para notificar nuevo anuncio.');
        event.waitUntil(
            self.registration.showNotification(`📢 Nuevo Anuncio: ${title}`, {
                body: content,
                icon: 'images/icons/icon-192x192.png',
                tag: 'new-announcement' // Etiqueta para agrupar o reemplazar notificaciones de anuncios
            })
        );
    }
});

// =================== LÓGICA DE BACKGROUND SYNC (ONE-OFF) ===================

self.addEventListener('sync', event => {
    console.log('SW: Evento de sincronización de fondo recibido:', event.tag);
    
    if (event.tag === 'update-app-content') {
        console.log('SW: Sincronizando contenido de la app...');
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                console.log('SW: Re-cacheando archivos principales.');
                return cache.addAll(urlsToCache).catch(err => console.error("SW Sync: Fallo al re-cachear", err));
            })
        );
    }
});

// =================== LÓGICA DE CLICK EN NOTIFICACIÓN ===================

self.addEventListener('notificationclick', event => {
    console.log('SW: Notificación clickeada', event.notification.tag);
    event.notification.close(); // Cerrar la notificación al ser tocada

    // Esta lógica abre la app. Busca si ya hay una ventana abierta y la enfoca.
    // Si no hay ninguna, abre una nueva.
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (windowClient.url.endsWith('/') && 'focus' in windowClient) {
                    return windowClient.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// =================== LÓGICA DE INSTALACIÓN Y CACHÉ ===================

self.addEventListener('install', event => {
    console.log('SW: Instalando nueva versión...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('SW: Activando nueva versión y limpiando cachés antiguos...');
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
                );
            }).catch(e => console.error("SW: Fallo al limpiar cachés antiguas:", e)),

            // Cargar la configuración guardada al activar
            getSetting('notificationsEnabled').then(value => {
                notificationsEnabled = value === true; // Asegurarse de que sea booleano
            }).catch(e => console.error("SW: Fallo al cargar 'notificationsEnabled':", e)),
            getSetting('notificationLeadTime').then(value => {
                notificationLeadTime = value || 2; // Valor por defecto si no existe
            }).catch(e => console.error("SW: Fallo al cargar 'notificationLeadTime':", e)),

            // Registrar la sincronización periódica cuando el SW se activa
            self.registration.periodicSync?.register('update-widget-periodic', {
                minInterval: 15 * 60 * 1000, // Cada 15 minutos
            }).catch(e => console.error('SW: Fallo al registrar la sincronización periódica:', e)),
            // Al activar, programamos las notificaciones de clase y también hacemos
            // una comprobación inicial para el fallback.
            scheduleClassNotifications(),
            checkAndShowDueNotifications()
        ])
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    const request = event.request;

    // Estrategia "Network First, then Cache" para las peticiones a la API (ej. anuncios).
    if (request.url.includes('/api/')) { // Identifica las llamadas a nuestra API
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    // Si la red responde, actualizamos la caché con la nueva respuesta
                    // y devolvemos la respuesta de la red.
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return networkResponse;
                })
                .catch(error => {
                    // Si la red falla (estamos offline), intentamos servir desde la caché como respaldo.
                    console.warn(`SW: Fallo de red para ${request.url}. Intentando desde caché.`);
                    return caches.match(request);
                })
        );
    } else {
        // Estrategia "Cache First" para todos los demás recursos (HTML, CSS, JS, imágenes).
        // Sirve desde la caché si está disponible para una carga súper rápida.
        // Si no está en caché, lo busca en la red.
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                return cachedResponse || fetch(request);
            })
        );
    }
});