// js/cart_quantity_handler.js
import { updateCartHeader } from './cart_updater.js';
import { loadCartDetails } from './cart_view_handler.js';
import { showLoginPrompt } from './modal_handler.js';

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
        await loadCartDetails();

        const productCardInput = document.querySelector(`.product-card[data-product-id="${productId}"] .quantity-input`);
        if (productCardInput) {
            productCardInput.value = quantity;
        }

    } catch (error) {
        console.error('Error al actualizar el carrito:', error);
    }
}

function handleQuantityInteraction(event) {
    // --- LA CORRECCIÓN DEFINITIVA ESTÁ AQUÍ ---
    // Ahora, la variable `isLoggedIn` será verdadera si encuentra el enlace de "Mi Cuenta"
    // O si encuentra el layout principal del dashboard, lo que soluciona el problema.
    const isLoggedIn = document.querySelector('.my-account-link') || document.querySelector('.dashboard-layout');

    if (!isLoggedIn) {
        showLoginPrompt();
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
    // Volvemos al listener en el body, que tus propias pruebas demostraron que sí funciona.
    // Esto es más simple y robusto para capturar todos los clics.
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