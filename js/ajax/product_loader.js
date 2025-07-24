// js/ajax/product_loader.js
let currentProductParams = {};

async function getCartState() {
    try {
        const response = await fetch('api/index.php?resource=cart-details');
        if (!response.ok) return {};
        const data = await response.json();
        const cartState = {};
        if (data.cart_items) {
            data.cart_items.forEach(item => {
                cartState[item.id_producto] = item.cantidad;
            });
        }
        return cartState;
    } catch (error) {
        console.error("No se pudo obtener el estado del carrito:", error);
        return {};
    }
}

export async function loadProducts(productListId, paginationControlsId, params = {}) {
    // Esta línea combina los parámetros viejos y nuevos. `department_id: null`
    // sobrescribirá cualquier valor anterior.
    currentProductParams = { ...currentProductParams, ...params };
    
    currentProductParams.page = params.page || 1;
    const productListElement = document.getElementById(productListId);
    const paginationControlsElement = document.getElementById(paginationControlsId);
    if (!productListElement || !paginationControlsElement) return;

    let summaryElement = document.getElementById('results-summary');
    if (!summaryElement) {
        summaryElement = document.createElement('div');
        summaryElement.id = 'results-summary';
        summaryElement.className = 'results-summary-style';
        productListElement.parentNode.insertBefore(summaryElement, productListElement);
    }
    
    summaryElement.innerHTML = 'Cargando...';
    productListElement.innerHTML = '<div class="loading-spinner">Cargando...</div>';
    paginationControlsElement.innerHTML = '';
    
    const cartState = await getCartState();

    const urlParams = new URLSearchParams({ resource: 'products' });
    for (const key in currentProductParams) {
        // --- CORRECCIÓN CLAVE: Ignoramos los parámetros que sean null ---
        if (currentProductParams[key] !== null && currentProductParams[key] !== undefined) {
            urlParams.append(key, currentProductParams[key]);
        }
    }

    try {
        const response = await fetch(`api/index.php?${urlParams.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        let summaryText = `<b>${data.total_products}</b> productos encontrados`;
        if (data.filter_name) summaryText += ` para "<b>${data.filter_name}</b>"`;
        summaryElement.innerHTML = summaryText;

        productListElement.innerHTML = '';
        if (data.products && data.products.length > 0) {
            data.products.forEach(product => {
                const currentQuantity = cartState[product.id_producto] || 0;
                const productCardHtml = `
                    <div class="product-card" data-product-id="${product.id_producto}">
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
                            <div class="quantity-selector">
                                <button class="quantity-btn minus" data-action="decrease">-</button>
                                <input type="number" class="quantity-input" value="${currentQuantity}" min="0" max="99" data-product-id="${product.id_producto}" aria-label="Cantidad">
                                <button class="quantity-btn plus" data-action="increase">+</button>
                            </div>
                        </div>
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
        summaryElement.innerHTML = '<span style="color: red;">Error al cargar resultados.</span>';
        productListElement.innerHTML = '<p>Error al cargar los productos.</p>';
    }
}

export function setupPagination(paginationControlsId, totalPages, currentPage, productListId) {
    const paginationControlsElement = document.getElementById(paginationControlsId);
    if (!paginationControlsElement) return;
    paginationControlsElement.innerHTML = '';
    if (totalPages <= 1) return;
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) startPage = Math.max(1, endPage - maxPagesToShow + 1);
    if (currentPage > 1) paginationControlsElement.appendChild(createPageButton('Anterior', currentPage - 1, productListId, paginationControlsId));
    for (let i = startPage; i <= endPage; i++) paginationControlsElement.appendChild(createPageButton(i, i, productListId, paginationControlsId, i === currentPage));
    if (currentPage < totalPages) paginationControlsElement.appendChild(createPageButton('Siguiente', currentPage + 1, productListId, paginationControlsId));
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