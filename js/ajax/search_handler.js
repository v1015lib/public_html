// js/ajax/search_handler.js

import { loadProducts } from './product_loader.js';

let searchTimeout;

export function initializeSearch(searchInputId, searchButtonId, productListId, paginationControlsId, apiBaseUrl) {
    const searchInput = document.getElementById(searchInputId);
    const searchForm = searchInput ? searchInput.closest('form') : null;

    if (!searchInput || !searchForm) {
        console.error('Elementos del formulario de búsqueda no encontrados.');
        return;
    }

    const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        loadProducts(productListId, paginationControlsId, { search: searchTerm, page: 1, apiBaseUrl: apiBaseUrl });
    };

    // Búsqueda en tiempo real (con debounce)
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 500); 
    });

    // Búsqueda al hacer submit en el formulario
    searchForm.addEventListener('submit', (event) => {
        // Prevenimos que la página se recargue si ya estamos en index.php
        event.preventDefault(); 
        clearTimeout(searchTimeout);
        performSearch();
    });
}