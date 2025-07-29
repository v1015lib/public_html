<?php
// registro.php
require_once __DIR__ . '/config/config.php';
$page_type = 'simplified';
$departments = [];
try {
    if (!isset($pdo)) throw new Exception("La conexión a la base de datos no está disponible.");
    $stmt_deps = $pdo->query("SELECT id_departamento, departamento FROM departamentos ORDER BY departamento ASC");
    $departments = $stmt_deps->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) { /* Si falla, no se mostrarán las preferencias */ }
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crear tu Cuenta</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="page-register">
    <?php include 'includes/header.php'; ?>

    <div class="wizard-container">
        <div class="wizard-sidebar">
            <h1 id="wizard-title">Crea tu cuenta</h1>
            <p id="wizard-subtitle">Sigue los pasos para unirte a nosotros.</p>
            <div class="progress-bar">
                <div class="progress-step active" data-step="1"><strong>1.</strong> Datos Personales</div>
                <div class="progress-step" data-step="2"><strong>2.</strong> Seguridad de la Cuenta</div>
                <div class="progress-step" data-step="3"><strong>3.</strong> Tus Intereses</div>
            </div>
        </div>

        <div class="wizard-content">
            <form id="register-form" method="POST" novalidate>
                <div id="form-message" class="form-message" style="display:none;"></div>

                <div class="form-step active" data-step="1">
                    <div class="form-group"><label for="nombre">Nombre <span class="required">*</span></label><input type="text" id="nombre" name="nombre" required></div>
                    <div class="form-group"><label for="apellido">Apellido (Opcional)</label><input type="text" id="apellido" name="apellido"></div>
                    <div class="form-group">
                        <label for="nombre_usuario">Nombre de Usuario <span class="required">*</span></label>
                        <input type="text" id="nombre_usuario" name="nombre_usuario" required>
                        <div id="username-availability" class="availability-message"></div>
                    </div>
                    <div class="form-group"><label for="telefono">Teléfono <span class="required">*</span></label><input type="tel" id="telefono" name="telefono" required></div>
                </div>

                <div class="form-step" data-step="2">
                    <div class="form-group"><label for="email">Correo (Opcional)</label><input type="email" id="email" name="email"></div>
                    <div class="form-group"><label for="password">Contraseña <span class="required">*</span></label><input type="password" id="password" name="password" required></div>
                    <div class="form-group"><label for="password_confirm">Confirmar Contraseña <span class="required">*</span></label><input type="password" id="password_confirm" name="password_confirm" required></div>
                </div>

                <div class="form-step" data-step="3">
                    <div class="form-group-checkbox"><input type="checkbox" id="is_student_check" name="is_student_check"><label for="is_student_check">Soy estudiante</label></div>
                    <div id="student-fields" class="student-fields hidden">
                         <div class="form-group"><label for="institucion">Institución Educativa <span class="required">*</span></label><input type="text" id="institucion" name="institucion"></div>
                         <div class="form-group"><label for="grado_actual">Grado Actual <span class="required">*</span></label><input type="text" id="grado_actual" name="grado_actual"></div>
                    </div>
                    <?php if (!empty($departments)): ?>
                    <fieldset class="form-group">
                        <legend>Mis Intereses</legend>
                        <div class="checkbox-group">
                            <?php foreach ($departments as $dept): ?>
                                <div class="checkbox-item"><input type="checkbox" id="dept_<?php echo $dept['id_departamento']; ?>" name="preferencias[]" value="<?php echo $dept['id_departamento']; ?>"><label for="dept_<?php echo $dept['id_departamento']; ?>"><?php echo htmlspecialchars($dept['departamento']); ?></label></div>
                            <?php endforeach; ?>
                        </div>
                    </fieldset>
                    <?php endif; ?>
                </div>
                
                <input type="hidden" id="id_tipo_cliente" name="id_tipo_cliente" value="1">
            </form>
            
            <div class="form-navigation">
                <button type="button" id="btn-prev" class="btn-secondary">Atrás</button>
                <button type="button" id="btn-next" class="submit-btn">Siguiente</button>
            </div>
            
            <div id="success-container" style="display: none;"></div>
            <p class="form-footer-link">¿Ya tienes una cuenta? <a href="login.php">Inicia Sesión</a></p>
        </div>
    </div>

    <?php include 'includes/footer.php'; ?>
        <div id="notification-container" class="notification-container"></div>

    <script type="module" src="js/register.js"></script>
</body>
</html>