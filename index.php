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
            <div id="product-list" class="product-grid">
                </div>
            <div id="pagination-controls" class="pagination">
                </div>
        </div>
    </div>

    <?php include 'includes/footer.php'; ?>

    <script type="module" src="js/main.js"></script>
    <script type="module" src="js/mobile_menu.js"></script>
    <script type="module" src="js/ajax/product_loader.js"></script>
    <script type="module" src="js/ajax/search_handler.js"></script>
</body>
</html>