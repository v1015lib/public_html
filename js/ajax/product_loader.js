// js/ajax/product_loader.js

// Mantener el estado actual de los filtros para paginación y recarga
let currentProductParams = {};

/**
 * Carga productos desde la API y los renderiza.
 * @param {string} productListId ID del contenedor de productos.
 * @param {string} paginationControlsId ID del contenedor de paginación.
 * @param {Object} params Parámetros de la solicitud (departmentId, search, page, sortBy, order).
 */
export async function loadProducts(productListId, paginationControlsId, params = {}) {
    // Fusionar parámetros nuevos con los actuales para mantener el estado
    currentProductParams = { ...currentProductParams, ...params };
    currentProductParams.page = currentProductParams.page || 1; // Asegurarse de que haya una página

    const productListElement = document.getElementById(productListId);
    const paginationControlsElement = document.getElementById(paginationControlsId);

    if (!productListElement || !paginationControlsElement) {
        console.error('Elementos de lista de productos o paginación no encontrados.');
        return;
    }

    productListElement.innerHTML = '<div class="loading-spinner">Cargando productos...</div>'; // Mensaje de carga

    const urlParams = new URLSearchParams({ resource: 'products' });
    for (const key in currentProductParams) {
        if (currentProductParams[key] !== null && currentProductParams[key] !== undefined && currentProductParams[key] !== '') {
            urlParams.append(key, currentProductParams[key]);
        }
    }

    try {
        const response = await fetch(`api/index.php?${urlParams.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        productListElement.innerHTML = ''; // Limpiar mensaje de carga/productos anteriores

        if (data.products && data.products.length > 0) {
            data.products.forEach(product => {
                const productCardHtml = `
                    <div class="product-card">
                        <img src="${product.url_imagen || 'https://via.placeholder.com/150'}" alt="${product.nombre_producto}">
                        <h3>${product.nombre_producto}</h3>
                        <p>Departamento: ${product.nombre_departamento}</p>
                        <p class="price">Precio: $${parseFloat(product.precio_venta).toFixed(2)}</p>
                        <p class="code">Código: ${product.codigo_producto}</p>
                        </div>
                `;
                productListElement.insertAdjacentHTML('beforeend', productCardHtml);
            });
        } else {
            productListElement.innerHTML = '<p>No se encontraron productos.</p>';
        }

        setupPagination(paginationControlsId, data.total_pages, data.current_page, productListId);

    } catch (error) {
        console.error('Error al cargar productos:', error);
        productListElement.innerHTML = '<p>Error al cargar productos. Por favor, intente de nuevo más tarde.</p>';
    }
}

/**
 * Configura los controles de paginación.
 * @param {string} paginationControlsId ID del contenedor de paginación.
 * @param {number} totalPages Número total de páginas.
 * @param {number} currentPage Página actual.
 * @param {string} productListId ID del contenedor de productos (para recargar).
 */
export function setupPagination(paginationControlsId, totalPages, currentPage, productListId) {
    const paginationControlsElement = document.getElementById(paginationControlsId);
    paginationControlsElement.innerHTML = ''; // Limpiar paginación anterior

    if (totalPages <= 1) {
        return; // No mostrar paginación si solo hay una página
    }

    const maxPagesToShow = 5; // Número máximo de botones de página a mostrar
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Botón "Anterior"
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.addEventListener('click', () => {
            loadProducts(productListId, paginationControlsId, { page: currentPage - 1 });
        });
        paginationControlsElement.appendChild(prevButton);
    }

    // Botones de número de página
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            loadProducts(productListId, paginationControlsId, { page: i });
        });
        paginationControlsElement.appendChild(pageButton);
    }

    // Botón "Siguiente"
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.addEventListener('click', () => {
            loadProducts(productListId, paginationControlsId, { page: currentPage + 1 });
        });
        paginationControlsElement.appendChild(nextButton);
    }
}