// js/main.js

import { loadProducts } from './ajax/product_loader.js';
import { initializeSearch } from './ajax/search_handler.js';
import { setupMobileMenu } from './mobile_menu.js';

// Define la URL base de tu API.
const API_BASE_URL = 'api/index.php'; 

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado y parseado.');

    // 1. Inicializa el menú móvil
    setupMobileMenu();
    
    // 2. Carga los departamentos en el menú lateral
    loadDepartments(); 

    // 3. Carga los productos iniciales
    loadProducts('product-list', 'pagination-controls', { sortBy: 'random', apiBaseUrl: API_BASE_URL });

    // 4. Inicializa la búsqueda
    initializeSearch('search-input', 'search-button', 'product-list', 'pagination-controls', API_BASE_URL);

    // 5. Maneja los clics en los enlaces de departamento
    document.getElementById('sidemenu').addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.department-link')) {
            event.preventDefault(); 
            const departmentId = target.dataset.departmentId;

            let params = { apiBaseUrl: API_BASE_URL, page: 1 }; // Resetea a la página 1
            if (departmentId !== 'all') {
                params.departmentId = departmentId;
            } else {
                params.sortBy = 'random'; 
            }
            loadProducts('product-list', 'pagination-controls', params);

            // Cierra el menú lateral en móviles después de la selección
            document.getElementById('sidemenu').classList.remove('active');
        }
    });
});


// Función para cargar departamentos desde la API
async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments`); 
        
        if (!response.ok) {
            throw new Error(`Error HTTP! status: ${response.status}`);
        }

        const departments = await response.json();
        const sidemenuUl = document.querySelector('#sidemenu nav ul');

        if (!sidemenuUl) {
            console.error('Elemento <ul> del sidemenu no encontrado.');
            return;
        }

        // Limpiar departamentos existentes (excepto el "Ver todos")
        sidemenuUl.querySelectorAll('li:not(:first-child)').forEach(li => li.remove());

        if (Array.isArray(departments)) {
            departments.forEach(dept => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="department-link" data-department-id="${dept.id_departamento}">${dept.departamento}</a>`;
                sidemenuUl.appendChild(li);
            });
        } else {
            console.error('La respuesta de departamentos no es un array:', departments);
        }
    } catch (error) {
        console.error('Error al cargar departamentos:', error);
        const sidemenuUl = document.querySelector('#sidemenu nav ul');
        if (sidemenuUl) {
             const errorLi = document.createElement('li');
             errorLi.textContent = 'Error al cargar.';
             errorLi.style.color = 'red';
             sidemenuUl.appendChild(errorLi);
        }
    }
}