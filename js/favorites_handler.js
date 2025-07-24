// js/favorites_handler.js
import { showNotification } from './notification_handler.js'; // <-- Importamos la nueva función

async function toggleFavorite(productId, button) {
    const isCurrentlyFavorite = button.classList.contains('is-favorite');
    
    const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
    const successMessage = isCurrentlyFavorite ? 'Producto eliminado de favoritos.' : '¡Producto añadido a favoritos!';

    try {
        const response = await fetch('api/index.php?resource=favorites', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });

        if (!response.ok) throw new Error('Error en la respuesta del servidor.');
        
        const data = await response.json();
        if (data.success) {
            button.classList.toggle('is-favorite');
            
            // ======================================================
            // LLAMAMOS A NUESTRA NUEVA NOTIFICACIÓN PERSONALIZADA
            // ======================================================
            showNotification(successMessage);

        } else {
            throw new Error(data.message || 'Error desconocido.');
        }

    } catch (error) {
        console.error(`No se pudo actualizar los favoritos: ${error.message}`);
        showNotification('Error al gestionar favoritos.'); // También mostramos errores
    }
}


export function initializeFavoritesHandler() {
    document.body.addEventListener('click', (event) => {
        const favoriteButton = event.target.closest('.favorite-btn');
        if (favoriteButton) {
            const productId = favoriteButton.dataset.productId;
            toggleFavorite(productId, favoriteButton);
        }
    });
}