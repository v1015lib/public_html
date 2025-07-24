// js/notification_handler.js

const container = document.getElementById('notification-container');

export function showNotification(message) {
    if (!container) return;

    // Crear el elemento de la notificación
    const notification = document.createElement('div');
    notification.className = 'toast-notification';
    notification.textContent = message;

    // Añadirlo al contenedor
    container.appendChild(notification);

    // Forzar un reflow para que la animación funcione
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Ocultar y eliminar la notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        // Esperar a que la animación de salida termine antes de eliminar el elemento
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, 3000);
}