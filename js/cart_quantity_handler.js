// js/cart_quantity_handler.js
import { updateCartHeader } from './cart_updater.js';
import { loadCartDetails } from './cart_view_handler.js';
import { showLoginPrompt } from './modal_handler.js'; // <-- Importamos la nueva función

async function updateCartAPI(productId, quantity) {
    try {
        const response = await fetch('api/index.php?resource=cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });
        if (!response.ok) throw new Error('La respuesta del servidor no fue exitosa.');
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Error del API.');

        await updateCartHeader();

        const cartPanel = document.getElementById('cart-panel');
        if (cartPanel && cartPanel.classList.contains('visible')) {
            await loadCartDetails();
        }

        const productCardInput = document.querySelector(`.product-card[data-product-id="${productId}"] .quantity-input`);
        if (productCardInput) {
            productCardInput.value = quantity;
        }

    } catch (error) {
        console.error('Error al actualizar el carrito:', error);
    }
}

function handleQuantityInteraction(event) {
    const isLoggedIn = document.querySelector('.my-account-link');
    if (!isLoggedIn) {
        // --- Llama a la nueva ventana modal en lugar de la alerta ---
        showLoginPrompt();
        // Reseteamos el input a 0 para evitar confusión.
        const input = event.target.closest('.quantity-selector')?.querySelector('.quantity-input');
        if (input) input.value = 0;
        return;
    }

    const target = event.target;
    const selector = target.closest('.quantity-selector');
    if (!selector) return;

    const input = selector.querySelector('.quantity-input');
    const productId = input.dataset.productId;
    let currentValue = parseInt(input.value, 10);

    if (isNaN(currentValue)) currentValue = 0;

    if (target.matches('.quantity-btn')) {
        const action = target.dataset.action;
        if (action === 'increase') {
            currentValue++;
        } else if (action === 'decrease') {
            currentValue = Math.max(0, currentValue - 1);
        }
        input.value = currentValue;
        updateCartAPI(productId, currentValue);
    } else if (target.matches('.quantity-input')) {
        let debounceTimer = null;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            updateCartAPI(productId, currentValue);
        }, 500);
    }
}

export function initializeQuantityHandlers() {
    document.body.addEventListener('click', event => {
        if (event.target.matches('.quantity-btn')) {
            handleQuantityInteraction(event);
        }
    });
    document.body.addEventListener('input', event => {
        if (event.target.matches('.quantity-input')) {
            handleQuantityInteraction(event);
        }
    });
}