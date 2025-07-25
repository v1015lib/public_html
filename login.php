<?php
// login.php
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
if (isset($_SESSION['id_cliente'])) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="overflow-y: auto;">
    <?php include 'includes/header.php'; ?>

    <div class="form-container">
        <h1>Iniciar Sesión</h1>
        <p>Ingresa tus credenciales para acceder a tu cuenta.</p>
        
        <form id="login-form" class="login-form" method="POST">
            <div id="form-message" class="form-message"></div>
            <div class="form-group">
                <label for="nombre_usuario">Nombre de Usuario</label>
                <input type="text" id="nombre_usuario" name="nombre_usuario" required>
            </div>
            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="submit-btn">Acceder</button>
        </form>
        <p class="form-footer-link">¿No tienes una cuenta? <a href="registro.php">Regístrate aquí</a>.</p>
    </div>

    <?php include 'includes/footer.php'; ?>
    <script type="module" src="js/login.js"></script>
</body>
</html>