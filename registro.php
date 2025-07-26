<?php
// registro.php
require_once __DIR__ . '/config/config.php';
try {
    $stmt = $pdo->query("SELECT id_tipo, nombre_tipo FROM tipo_clientes ORDER BY id_tipo");
    $tipos_cliente = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $tipos_cliente = [];
    $form_error = "No se pudieron cargar los tipos de cliente.";
}
$page_type = 'simplified';

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro de Nuevo Cliente</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="overflow-y: auto;">
    <?php include 'includes/header.php'; ?>

    <div class="form-container">
        <div id="register-title-container">
            <h1>Crear una cuenta</h1>
            <p>Completa el siguiente formulario para registrarte.</p>
        </div>
        
        <form id="register-form" class="register-form" method="POST" novalidate>
            <div id="form-message" class="form-message"></div>

            <div class="form-group">
                <label for="nombre">Nombre <span class="required">*</span></label>
                <input type="text" id="nombre" name="nombre" required>
            </div>
            <div class="form-group">
                <label for="apellido">Apellido (Opcional)</label>
                <input type="text" id="apellido" name="apellido">
            </div>
            <div class="form-group">
                <label for="nombre_usuario">Nombre de Usuario <span class="required">*</span></label>
                <input type="text" id="nombre_usuario" name="nombre_usuario" required>
                <div id="username-availability" class="availability-message"></div>
            </div>
            <div class="form-group">
                <label for="email">Correo Electrónico (Opcional)</label>
                <input type="email" id="email" name="email">
            </div>
            <div class="form-group">
                <label for="password">Contraseña <span class="required">*</span></label>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="form-group">
                <label for="password_confirm">Repetir Contraseña <span class="required">*</span></label>
                <input type="password" id="password_confirm" name="password_confirm" required>
            </div>
            <div class="form-group">
                <label for="telefono">Teléfono <span class="required">*</span></label>
                <input type="tel" id="telefono" name="telefono" required>
            </div>
            <div class="form-group-checkbox">
                <input type="checkbox" id="is_student_check" name="is_student_check">
                <label for="is_student_check">Soy estudiante</label>
            </div>
            
            <div id="student-fields" class="student-fields hidden">
                <div class="form-group">
                    <label for="institucion">Institución Educativa <span class="required">*</span></label>
                    <input type="text" id="institucion" name="institucion">
                </div>
                <div class="form-group">
                    <label for="grado_actual">Grado Actual <span class="required">*</span></label>
                    <input type="text" id="grado_actual" name="grado_actual">
                </div>
            </div>

            <input type="hidden" id="id_tipo_cliente" name="id_tipo_cliente" value="1">
            <button type="submit" class="submit-btn">Crear Cuenta</button>
        </form>

        <div id="success-container" class="success-container" style="display: none;">
            <h2>¡Registro Exitoso!</h2>
            <p>Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.</p>
            <a href="login.php" class="submit-btn">Ir a Iniciar Sesión</a>
        </div>

        <p id="form-footer-link" class="form-footer-link">¿Ya tienes una cuenta? <a href="login.php">Inicia Sesión aquí</a>.</p>
    </div>

    <?php include 'includes/footer.php'; ?>
    <script type="module" src="js/register.js"></script>
</body>
</html>