<?php
// dashboard.php
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['id_cliente'])) {
    header('Location: login.php');
    exit;
}
$page_type = 'simplified';

$view = $_GET['view'] ?? 'perfil';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Cuenta</title>
    <link rel="stylesheet" href="css/style.css">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>

    <div class="dashboard-layout">
        
        <?php include 'includes/dashboard_sidemenu.php'; ?>

        <main class="dashboard-main">
            <?php include 'includes/dashboard_header.php'; ?>
            
            <div class="dashboard-content">
                <?php
                    switch ($view) {
                        case 'favoritos':
                            echo "<h1>Mis Favoritos</h1><p>Aquí se mostrarán tus productos favoritos.</p>";
                            break;
                        case 'pedidos':
                            echo "<h1>Historial de Pedidos</h1><p>Aquí se mostrará tu historial de compras.</p>";
                            break;
                        case 'ofertas':
                             echo "<h1>Mis Ofertas</h1><p>Aquí se mostrarán ofertas especiales para ti.</p>";
                            break;
                        case 'perfil':
                        default:
                            echo "<h1>Mi Perfil</h1><p>Bienvenido a tu panel de control.</p>";
                            break;
                    }
                ?>
            </div>
        </main>

    </div>

    <div id="cart-panel" class="cart-panel">
        <div class="cart-header">
            <h2>Mi Carrito</h2>
            <button id="close-cart-btn" class="close-cart-btn">&times;</button>
        </div>
        <div id="cart-content" class="cart-content"></div>
        <div class="cart-footer">
            <div class="cart-total">
                <span>Total:</span>
                <span id="cart-total-price">$0.00</span>
            </div>
            <a href="finalizar_compra.php" class="checkout-btn">Finalizar Compra</a>
        </div>
    </div>
    <div id="cart-overlay" class="cart-overlay"></div>

    <script type="module" src="js/dashboard.js"></script>
</body>
</html>