<?php
// includes/header.php
// Inicia la sesión en cada página que incluya este header para poder leer las variables de sesión.
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
?>
<header class="main-header">
    <div class="header-content">
        <div class="logo">
            <a href="index.php">TuLogo</a>
        </div>
        <div class="search-bar">
            <input type="text" id="search-input" placeholder="Buscar productos o códigos...">
            <button id="search-button">Buscar</button>
        </div>
        <nav class="main-nav">
            <ul>
                <?php if (isset($_SESSION['id_cliente'])): ?>
                    <li class="welcome-message">Hola, <?php echo htmlspecialchars($_SESSION['nombre_usuario']); ?></li>
                    <li><a href="dashboard.php">Mi Cuenta</a></li>
                    <li><a href="logout.php">Cerrar Sesión</a></li>
                <?php else: ?>
                    <li><a href="index.php">Inicio</a></li>
                    <li><a href="#">Ofertas</a></li>
                    <li><a href="registro.php">Crear Cuenta</a></li>
                    <li class="login-link"><a href="login.php">Iniciar Sesión</a></li>
                <?php endif; ?>
            </ul>
        </nav>

        <div class="cart-widget-container">
            <a href="#" aria-label="Ver carrito de compras">
                <span class="cart-icon">&#128722;</span>
                <span id="cart-total-header" class="cart-total-header">$0.00</span>
            </a>
        </div>

        <div class="mobile-menu-toggle" id="mobile-menu-toggle">
            &#9776;
        </div>
    </div>
</header>
