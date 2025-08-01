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

// --- NUEVO: Función para obtener los favoritos del usuario ---
async function getUserFavorites() {
    try {
        const response = await fetch('api/index.php?resource=favorites');
        if (!response.ok) return new Set();
        const favoriteIds = await response.json();
        // Convertimos el array de IDs en un Set para búsquedas rápidas
        return new Set(favoriteIds.map(id => parseInt(id, 10)));
    } catch (error) {
        console.error("No se pudieron cargar los favoritos:", error);
        return new Set();
    }
}

export async function loadProducts(productListId, paginationControlsId, params = {}) {
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
    
    const [cartState, userFavorites] = await Promise.all([getCartState(), getUserFavorites()]);

    const urlParams = new URLSearchParams({ resource: 'products' });
    for (const key in currentProductParams) {
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
                const isFavorite = userFavorites.has(parseInt(product.id_producto, 10));

                // --- INICIO: LÓGICA DE PRECIOS INTEGRADA ---
                const precioVenta = parseFloat(product.precio_venta);
                const precioOferta = parseFloat(product.precio_oferta);
                
                // Por defecto, se usa la estructura original del precio
                let priceHtml = `
                    <p class="price">$${precioVenta.toFixed(2)}</p>
                    <p class="code"># ${product.codigo_producto}</p>
                `;
                // La etiqueta de descuento está vacía por defecto
                let discountBadgeHtml = '';

                // Si hay una oferta válida, se sobreescribe el HTML
                if (precioOferta && precioOferta > 0 && precioOferta < precioVenta) {
                    priceHtml = `
                        <p class="price" ">$${precioOferta.toFixed(2)}</p>
                        <p class="price-older" >$${precioVenta.toFixed(2)}</p>
                    `;
                    const discountPercent = Math.round(((precioVenta - precioOferta) / precioVenta) * 100);
                    // Y se crea la etiqueta de descuento
                    discountBadgeHtml = `<div class="discount-badge">-${discountPercent}%</div>`;
                }
                // --- FIN: LÓGICA DE PRECIOS INTEGRADA ---

                const productCardHtml = `
                    <div class="product-card" data-product-id="${product.id_producto}">
                        <button class="favorite-btn ${isFavorite ? 'is-favorite' : ''}" data-product-id="${product.id_producto}" aria-label="Añadir a favoritos">&#10084;</button>
                        <div class="product-image-container">
                            <img src="${product.url_imagen || 'https://via.placeholder.com/200'}" alt="${product.nombre_producto}">
                            ${discountBadgeHtml}
                        </div>
                        <div class="product-info">
                            <h3>${product.nombre_producto}</h3>
                            <p class="department">Depto: ${product.nombre_departamento}</p>
                            <div class="price-container">
                                ${priceHtml}
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

    // ✅ Lógica para determinar cuántos botones mostrar según el ancho de la pantalla
    const maxPagesToShow = window.innerWidth < 768 ? 3 : 5; 

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Botón "Anterior"
    if (currentPage > 1) {
        paginationControlsElement.appendChild(createPageButton('<', currentPage - 1, productListId, paginationControlsId));
    }
    
    // ✅ Botones de número de página (con una nueva clase para CSS)
    for (let i = startPage; i <= endPage; i++) {
        paginationControlsElement.appendChild(createPageButton(i, i, productListId, paginationControlsId, i === currentPage, true));
    }

    // Botón "Siguiente"
    if (currentPage < totalPages) {
        paginationControlsElement.appendChild(createPageButton('>', currentPage + 1, productListId, paginationControlsId));
    }
}

function createPageButton(text, page, productListId, paginationControlsId, isActive = false, isPageNumber = false) {
    const button = document.createElement('button');
    button.textContent = text;
    if (isActive) {
        button.classList.add('active');
    }
    // ✅ Añadimos la clase 'page-number' si es un botón de número
    if (isPageNumber) {
        button.classList.add('page-number');
    }
    button.addEventListener('click', () => {
        // Aseguramos que se mantengan los parámetros de búsqueda o departamento al cambiar de página
        currentProductParams.page = page;
        loadProducts(productListId, paginationControlsId, currentProductParams);
    });
    return button;
}