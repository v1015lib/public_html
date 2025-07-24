// js/main.js

import { loadProducts } from './ajax/product_loader.js';
import { initializeSearch } from './ajax/search_handler.js';
import { setupMobileMenu } from './mobile_menu.js';
import { initializeCartView } from './cart_view_handler.js';
import { updateCartHeader } from './cart_updater.js';
import { initializeQuantityHandlers } from './cart_quantity_handler.js';
// --- NUEVO: Importamos el manejador de favoritos ---
import { initializeFavoritesHandler } from './favorites_handler.js';

const API_BASE_URL = 'api/index.php'; 

document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    loadDepartments(); 
    initializeCartView();
    updateCartHeader();
    initializeQuantityHandlers();
    // --- NUEVO: Inicializamos el manejador de favoritos ---
    initializeFavoritesHandler();

    // --- LÍNEA MODIFICADA: El filtro de imagen está integrado aquí ---
    loadProducts('product-list', 'pagination-controls', { 
        sortBy: 'random', 
        apiBaseUrl: API_BASE_URL,
        hide_no_image: true // <-- Opción integrada aquí
    });

    initializeSearch('search-input', 'search-button', 'product-list', 'pagination-controls', API_BASE_URL);

    document.getElementById('sidemenu').addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.department-link')) {
            event.preventDefault(); 
            const departmentId = target.dataset.departmentId;
            let params = { page: 1 };
            if (departmentId !== 'all') {
                params.department_id = departmentId;
            } else {
                params.department_id = null; 
                params.sortBy = 'random'; 
            }
            loadProducts('product-list', 'pagination-controls', params);
            document.getElementById('sidemenu').classList.remove('active');
        }
    });
});

async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments`); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const departments = await response.json();
        const sidemenuUl = document.querySelector('#sidemenu nav ul');
        if (!sidemenuUl) return;
        sidemenuUl.querySelectorAll('li:not(:first-child)').forEach(li => li.remove());
        if (Array.isArray(departments)) {
            departments.forEach(dept => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="department-link" data-department-id="${dept.id_departamento}">${dept.departamento}</a>`;
                sidemenuUl.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error al cargar departamentos:', error);
    }
}