// js/main.js

import { loadProducts, setupPagination } from './ajax/product_loader.js';
import { initializeSearch } from './ajax/search_handler.js';
import { setupMobileMenu } from './mobile_menu.js';

// Define la URL base de tu API aquí.
// ¡AJUSTA ESTO PARA QUE COINCIDA CON TU CONFIGURACIÓN EXACTA DE XAMPP!
const API_BASE_URL = 'http://localhost:8848/public_html/api/index.php'; 

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado y parseado.');

    setupMobileMenu();
    loadDepartments();

    // Cargar productos iniciales (aleatorios por defecto)
    loadProducts('product-list', 'pagination-controls', { sortBy: 'random', apiBaseUrl: API_BASE_URL });

    // Inicializar la búsqueda en tiempo real
    initializeSearch('search-input', 'search-button', 'product-list', 'pagination-controls', API_BASE_URL);

    // Manejar clics en los enlaces de departamento
    document.getElementById('sidemenu').addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.department-link')) {
            event.preventDefault(); 
            const departmentId = target.dataset.departmentId;
            console.log(`Cargando productos para departamento: ${departmentId}`);

            let params = { apiBaseUrl: API_BASE_URL }; 
            if (departmentId !== 'all') {
                params.departmentId = departmentId;
            } else {
                params.sortBy = 'random'; 
            }
            loadProducts('product-list', 'pagination-controls', params);

            // Cerrar sidemenu en móviles después de la selección
            const sidemenu = document.getElementById('sidemenu');
            if (sidemenu.classList.contains('active')) {
                sidemenu.classList.remove('active');
            }
        }
    });

    // Ajustar la altura del contenedor de productos para el scroll
    function adjustProductContainerHeight() {
        const headerElement = document.querySelector('.main-header');
        const productsContainer = document.querySelector('.products-container');
        if (!headerElement || !productsContainer) return; 

        const headerHeight = headerElement.offsetHeight;
        
        // Asegúrate de que el breakpoint de tablet (768) coincida con tu SCSS
        if (window.innerWidth >= 768) { 
            productsContainer.style.height = `calc(100vh - ${headerHeight}px)`;
            productsContainer.style.overflowY = 'auto';
        } else {
            productsContainer.style.height = 'auto'; 
            productsContainer.style.overflowY = 'visible'; 
        }
    }

    adjustProductContainerHeight();
    window.addEventListener('resize', adjustProductContainerHeight);

});


// Función para cargar departamentos
async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments`);
        
        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(`Error HTTP! status: ${response.status}. Response: ${errorText}`);
        }

        const departments = await response.json();
        const sidemenuUl = document.querySelector('#sidemenu ul');

        if (!sidemenuUl) {
            console.error('Elemento <ul> del sidemenu no encontrado.');
            return;
        }

        sidemenuUl.querySelectorAll('li:not(:first-child)').forEach(li => li.remove());

        if (Array.isArray(departments)) {
            departments.forEach(dept => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.classList.add('department-link');
                a.dataset.departmentId = dept.id_departamento;
                a.textContent = dept.departamento;
                li.appendChild(a);
                sidemenuUl.appendChild(li);
            });
        } else {
            console.error('La respuesta de departamentos no es un array:', departments);
        }
    } catch (error) {
        console.error('Error al cargar departamentos:', error);
        const sidemenuUl = document.querySelector('#sidemenu ul');
        if (sidemenuUl) {
             sidemenuUl.querySelectorAll('li:not(:first-child)').forEach(li => li.remove());
             const errorLi = document.createElement('li');
             errorLi.textContent = 'Error al cargar departamentos.';
             errorLi.style.color = 'red';
             sidemenuUl.appendChild(errorLi);
        }
    }
}