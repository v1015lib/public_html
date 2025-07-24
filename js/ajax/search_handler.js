// js/ajax/search_handler.js

import { loadProducts } from './product_loader.js';

let searchTimeout;

/**
 * Inicializa la funcionalidad de búsqueda.
 * @param {string} searchInputId ID del input de búsqueda.
 * @param {string} searchButtonId ID del botón de búsqueda.
 * @param {string} productListId ID del contenedor de productos.
 * @param {string} paginationControlsId ID del contenedor de paginación.
 * @param {string} apiBaseUrl URL base de la API.
 */
export function initializeSearch(searchInputId, searchButtonId, productListId, paginationControlsId, apiBaseUrl) {
    const searchInput = document.getElementById(searchInputId);
    const searchButton = document.getElementById(searchButtonId);

    if (!searchInput) {
        console.error('Input de búsqueda no encontrado.');
        return;
    }

    // Búsqueda en tiempo real (con debounce)
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = searchInput.value.trim();
            // Restablecer la página a 1 al buscar, y pasa la URL base
            loadProducts(productListId, paginationControlsId, { search: searchTerm, page: 1, departmentId: null, sortBy: null, order: null, apiBaseUrl: apiBaseUrl });
        }, 500); 
    });

    // Búsqueda al hacer clic en el botón (útil si hay un botón explícito)
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            clearTimeout(searchTimeout); 
            const searchTerm = searchInput.value.trim();
            loadProducts(productListId, paginationControlsId, { search: searchTerm, page: 1, departmentId: null, sortBy: null, order: null, apiBaseUrl: apiBaseUrl });
        });
    }
}