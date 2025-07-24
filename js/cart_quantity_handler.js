// js/cart_quantity_handler.js
import { updateCartHeader } from './cart_updater.js';
import { loadCartDetails } from './cart_view_handler.js';

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

        // 1. Actualizar el total en el header
        await updateCartHeader();

        // 2. Si el panel del carrito está visible, recargarlo
        const cartPanel = document.getElementById('cart-panel');
        if (cartPanel && cartPanel.classList.contains('visible')) {
            await loadCartDetails();
        }

        // 3. --- ¡NUEVO! SINCRONIZAR LA TARJETA DEL PRODUCTO PRINCIPAL ---
        const productCardInput = document.querySelector(`.product-card[data-product-id="${productId}"] .quantity-input`);
        if (productCardInput) {
            productCardInput.value = quantity;
        }

    } catch (error) {
        console.error('Error al actualizar el carrito:', error);
    }
}

function handleQuantityButtonClick(event) {
    const button = event.target;
    const action = button.dataset.action;
    const selector = button.closest('.quantity-selector');
    const input = selector.querySelector('.quantity-input');
    const productId = input.dataset.productId;
    let currentValue = parseInt(input.value, 10);

    if (isNaN(currentValue)) currentValue = 0;

    if (action === 'increase') {
        currentValue++;
    } else if (action === 'decrease') {
        currentValue = Math.max(0, currentValue - 1);
    }
    input.value = currentValue;
    updateCartAPI(productId, currentValue);
}

let debounceTimer = null;
function handleQuantityInputChange(event) {
    const input = event.target;
    const productId = input.dataset.productId;
    let finalQuantity = parseInt(input.value, 10);
    if (isNaN(finalQuantity) || finalQuantity < 0) {
        finalQuantity = 0;
        input.value = finalQuantity;
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        updateCartAPI(productId, finalQuantity);
    }, 500);
}

export function initializeQuantityHandlers() {
    document.body.addEventListener('click', event => {
        if (event.target.matches('.quantity-btn')) {
            handleQuantityButtonClick(event);
        }
    });
    document.body.addEventListener('input', event => {
        if (event.target.matches('.quantity-input')) {
            handleQuantityInputChange(event);
        }
    });
}