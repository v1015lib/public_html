// js/ajax/product_loader.js

let currentProductParams = {};

/**
 * Carga productos desde la API y los renderiza.
 */
export async function loadProducts(productListId, paginationControlsId, params = {}) {
    currentProductParams = { ...currentProductParams, ...params };
    currentProductParams.page = params.page || 1; 

    const productListElement = document.getElementById(productListId);
    const paginationControlsElement = document.getElementById(paginationControlsId);

    if (!productListElement || !paginationControlsElement) return;

    productListElement.innerHTML = '<div class="loading-spinner">Cargando...</div>';
    paginationControlsElement.innerHTML = '';

    const urlParams = new URLSearchParams({ resource: 'products' });
    for (const key in currentProductParams) {
        if (currentProductParams[key]) {
            urlParams.append(key, currentProductParams[key]);
        }
    }

    try {
        const response = await fetch(`api/index.php?${urlParams.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        productListElement.innerHTML = '';

        if (data.products && data.products.length > 0) {
            data.products.forEach(product => {
                const productCardHtml = `
                    <div class="product-card">
                        <div class="product-image-container">
                            <img src="${product.url_imagen || 'https://via.placeholder.com/200'}" alt="${product.nombre_producto}">
                        </div>
                        <div class="product-info">
                            <h3>${product.nombre_producto}</h3>
                            <p class="department">Depto: ${product.nombre_departamento}</p>
                            <div class="price-container">
                                <p class="price">$${parseFloat(product.precio_venta).toFixed(2)}</p>
                                <p class="code"># ${product.codigo_producto}</p>
                            </div>
                        </div>
                    </div>
                `;
                productListElement.insertAdjacentHTML('beforeend', productCardHtml);
            });
        } else {
            productListElement.innerHTML = '<p>No se encontraron productos que coincidan con su búsqueda.</p>';
        }

        setupPagination(paginationControlsId, data.total_pages, data.current_page, productListId);

    } catch (error) {
        console.error('Error al cargar productos:', error);
        productListElement.innerHTML = '<p>Error al cargar los productos. Intente de nuevo más tarde.</p>';
    }
}

/**
 * Configura los controles de paginación.
 */
export function setupPagination(paginationControlsId, totalPages, currentPage, productListId) {
    const paginationControlsElement = document.getElementById(paginationControlsId);
    if (totalPages <= 1) return;

    // Lógica de paginación... (se mantiene igual)
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    if (currentPage > 1) {
        paginationControlsElement.appendChild(createPageButton('Anterior', currentPage - 1, productListId, paginationControlsId));
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationControlsElement.appendChild(createPageButton(i, i, productListId, paginationControlsId, i === currentPage));
    }

    if (currentPage < totalPages) {
        paginationControlsElement.appendChild(createPageButton('Siguiente', currentPage + 1, productListId, paginationControlsId));
    }
}

function createPageButton(text, page, productListId, paginationControlsId, isActive = false) {
    const button = document.createElement('button');
    button.textContent = text;
    if (isActive) button.classList.add('active');
    button.addEventListener('click', () => {
        loadProducts(productListId, paginationControlsId, { page: page });
    });
    return button;
}