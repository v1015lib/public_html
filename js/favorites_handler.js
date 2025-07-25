// js/favorites_handler.js
import { showNotification } from './notification_handler.js';

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

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error en la respuesta del servidor.');
        }
        
        if (result.success) {
            button.classList.toggle('is-favorite');
            showNotification(successMessage);
        } else {
            throw new Error(result.message || 'Error desconocido.');
        }

    } catch (error) {
        console.error(`No se pudo actualizar los favoritos: ${error.message}`);
        showNotification(`Error: ${error.message}`);
    }
}


export function initializeFavoritesHandler() {
    const loginPromptModal = document.getElementById('login-prompt-modal');
    const cancelPromptBtn = document.getElementById('login-prompt-cancel');

    // Evento para cerrar la ventana modal
    if (cancelPromptBtn && loginPromptModal) {
        cancelPromptBtn.addEventListener('click', () => {
            loginPromptModal.classList.remove('visible');
            // Usamos un delay para que la animación de salida termine antes de ocultarlo
            setTimeout(() => loginPromptModal.classList.add('hidden'), 300);
        });
    }

    // Evento principal en los botones de favoritos
    document.body.addEventListener('click', (event) => {
        const favoriteButton = event.target.closest('.favorite-btn');
        if (favoriteButton) {
            const isLoggedIn = document.querySelector('.welcome-message');

            if (isLoggedIn) {
                // Si el usuario ha iniciado sesión, funciona normal
                const productId = favoriteButton.dataset.productId;
                toggleFavorite(productId, favoriteButton);
            } else {
                // Si no ha iniciado sesión, muestra la ventana modal
                if (loginPromptModal) {
                    loginPromptModal.classList.remove('hidden');
                    // Usamos un pequeño delay para que la transición de opacidad funcione
                    setTimeout(() => loginPromptModal.classList.add('visible'), 10);
                }
            }
        }
    });
}