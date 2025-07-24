<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tienda de Productos</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>

    <div class="main-container">
        <?php include 'includes/sidemenu.php'; ?>

        <div class="products-container">
            <div id="product-list" class="product-grid"></div>
            <div id="pagination-controls" class="pagination"></div>
        </div>
    </div>

    <div id="cart-panel" class="cart-panel">
        <div class="cart-header">
            <h2>Mi Carrito</h2>
            <button id="close-cart-btn" class="close-cart-btn">&times;</button>
        </div>
        <div id="cart-content" class="cart-content">
            <p>Tu carrito está vacío.</p>
        </div>
        <div class="cart-footer">
            <div class="cart-total">
                <span>Total:</span>
                <span id="cart-total-price">$0.00</span>
            </div>
            <button class="checkout-btn">Finalizar Compra</button>
        </div>
    </div>
    <div id="cart-overlay" class="cart-overlay"></div>


    <?php include 'includes/footer.php'; ?>
    <div id="notification-container" class="notification-container"></div>

    <script type="module" src="js/main.js"></script>
</body>
</html>