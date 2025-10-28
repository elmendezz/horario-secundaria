// c:\Users\Admin\Documents\GitHub\horario\error-logic.js

/**
 * Reporta un error a la consola y, opcionalmente, a un endpoint remoto.
 * Esto permite al desarrollador monitorear los errores que ocurren en producción.
 * @param {Error} error - El objeto de error capturado.
 * @param {string} context - Una cadena que describe dónde ocurrió el error (ej. 'fetchTime').
 */
export async function reportError(error, context = 'General') {
    // 1. Siempre mostrar el error en la consola local para depuración inmediata.
    console.error(`[Error en ${context}]:`, error);

    // 2. Construir un objeto de error para enviar al servidor.
    const errorData = {
        type: 'feedback', // Usamos el mismo tipo que el feedback para que llegue al mismo lugar.
        feedbackType: 'error_report', // Un nuevo tipo específico para reportes automáticos.
        text: `Error en ${context}: ${error.message}`,
        author: localStorage.getItem('username') || 'Anónimo',
        stack: error.stack, // Incluir el stack trace para una depuración más fácil.
        userAgent: navigator.userAgent,
        url: window.location.href
    };

    // 3. Enviar el reporte al endpoint.
    // Usamos un try/catch aquí para que el propio reporte de errores no cause un error.
    try {
        await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Usamos JSON.stringify para enviar el objeto completo.
            body: JSON.stringify(errorData)
        });
        console.log('Error reportado al servidor exitosamente.');
    } catch (reportingError) {
        console.error('Fallo al reportar el error al servidor:', reportingError);
    }
}