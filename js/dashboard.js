// js/dashboard.js

import { updateCartHeader } from './cart_updater.js';
import { initializeCartView } from './cart_view_handler.js';
import { initializeQuantityHandlers } from './cart_quantity_handler.js';

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('dashboard-menu-toggle');
    const sidemenu = document.getElementById('dashboard-sidemenu');

    if (menuToggle && sidemenu) {
        menuToggle.addEventListener('click', () => {
            sidemenu.classList.toggle('active');
        });
    }

    // --- LÓGICA DEL CARRITO (AÑADIDA AL DASHBOARD) ---
    
    // 1. Actualiza el total en el header al cargar la página
    updateCartHeader();

    // 2. Inicializa la lógica para abrir/cerrar el panel del carrito
    initializeCartView();

    // 3. Inicializa los contadores de cantidad para que funcionen dentro del panel
    initializeQuantityHandlers();
});