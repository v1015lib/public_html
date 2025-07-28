<?php
// finalizar_compra.php

// Inicia la sesión
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Proteger la página
if (!isset($_SESSION['id_cliente'])) {
    header('Location: login.php');
    exit;
}

require_once __DIR__ . '/config/config.php';

// Usamos el ID de la sesión
$client_id = $_SESSION['id_cliente'];

$cart_items = [];
$total = 0;
$error_message = '';
$cliente_nombre = 'No disponible';
$cliente_telefono = 'No disponible';

try {
    // Obtener datos del cliente
    $stmt_cliente = $pdo->prepare("SELECT nombre_usuario, telefono FROM clientes WHERE id_cliente = :client_id");
    $stmt_cliente->execute([':client_id' => $client_id]);
    $cliente = $stmt_cliente->fetch(PDO::FETCH_ASSOC);

    if ($cliente) {
        $cliente_nombre = $cliente['nombre_usuario'];
        $cliente_telefono = $cliente['telefono'];
    }

    // Obtener carrito y sus productos
    $stmt_cart = $pdo->prepare("SELECT id_carrito FROM carritos_compra WHERE id_cliente = :client_id AND estado_id = 1");
    $stmt_cart->execute([':client_id' => $client_id]);
    $cart_id = $stmt_cart->fetchColumn();

    if ($cart_id) {
        $stmt_items = $pdo->prepare(
            "SELECT p.nombre_producto, dc.cantidad, dc.precio_unitario, (dc.cantidad * dc.precio_unitario) as subtotal
             FROM detalle_carrito dc
             JOIN productos p ON dc.id_producto = p.id_producto
             WHERE dc.id_carrito = :cart_id"
        );
        $stmt_items->execute([':cart_id' => $cart_id]);
        $cart_items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        foreach ($cart_items as $item) {
            $total += $item['subtotal'];
        }
    }
    
    // --- LÓGICA PARA EL MENSAJE DE WHATSAPP (VERSIÓN LIMPIA) ---
    $whatsapp_message = "*-- DATOS DEL CLIENTE --*\n";
    $whatsapp_message .= "*ID Cliente:* " . $client_id . "\n";
    $whatsapp_message .= "*Nombre:* " . htmlspecialchars($cliente_nombre) . "\n";
    $whatsapp_message .= "*Teléfono:* " . htmlspecialchars($cliente_telefono) . "\n\n";

    $whatsapp_message .= "¡Hola! Quisiera realizar el siguiente pedido:\n\n";
    $whatsapp_message .= "*-- LISTA DE PRODUCTOS --*\n";
    $whatsapp_message .= "```\n";
    $whatsapp_message .= "| Cant | Producto             | Subtotal |\n";
    $whatsapp_message .= "|------|----------------------|----------|\n";
    
    foreach ($cart_items as $item) {
        $cantidad = str_pad($item['cantidad'], 4, " ", STR_PAD_LEFT);
        
        $producto_nombre = $item['nombre_producto'];
        if (strlen($producto_nombre) > 20) {
            $producto_nombre = substr($producto_nombre, 0, 17) . "...";
        }
        $producto_nombre_col = str_pad($producto_nombre, 20, " ", STR_PAD_RIGHT);
        
        $subtotal = str_pad("$" . number_format($item['subtotal'], 2), 9, " ", STR_PAD_LEFT);
        
        $whatsapp_message .= "| " . $cantidad . " | " . $producto_nombre_col . " | " . $subtotal . " |\n";
    }
    
    $whatsapp_message .= "----------------------------------------\n";
    $whatsapp_message .= "```\n";
    $whatsapp_message .= "\n*Total a Pagar: $" . number_format($total, 2) . "*";
    
    $whatsapp_number = "50368345121"; 
    $whatsapp_url = "https://wa.me/" . $whatsapp_number . "?text=" . urlencode($whatsapp_message);

} catch (Exception $e) {
    $error_message = "Error al cargar el carrito: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finalizar Compra</title>
    <link rel="stylesheet" href="css/style.css">
    <?php /* EL BLOQUE <style> SE HA ELIMINADO */ ?>
</head>
<body class="page-checkout"> 
    <?php include 'includes/header.php'; ?>

    <div class="summary-container">
        
        <div class="summary-main">
            <div class="summary-header">
                <h1>Resumen de tu Pedido</h1>
            </div>

            <?php if (!empty($cart_items)): ?>
                <div class="summary-table-container">
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th class="col-product">Producto</th>
                                <th class="col-quantity">Cantidad</th>
                                <th class="col-subtotal">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($cart_items as $item): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($item['nombre_producto']); ?></td>
                                    <td><?php echo $item['cantidad']; ?></td>
                                    <td>$<?php echo number_format($item['subtotal'], 2); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php else: ?>
                <div class="cart-empty-message">
                    <p>Tu carrito está vacío. <a href="index.php">Volver a la tienda</a>.</p>
                </div>
            <?php endif; ?>
        </div>

        <?php if (!empty($cart_items)): ?>
            <div class="summary-sidebar">
                <div class="summary-total">
                    <span>Total a Pagar</span>
                    <strong>$<?php echo number_format($total, 2); ?></strong>
                </div>

                <a href="<?php echo $whatsapp_url; ?>" id="send-whatsapp-btn" class="whatsapp-button" target="_blank">
                    ✔ Enviar Pedido por WhatsApp
                </a>
                
                <a href="index.php" class="cancel-button">
                    Cancelar y Volver a la Tienda
                </a>
            </div>
        <?php endif; ?>

    </div>
    
    <?php include 'includes/footer.php'; ?>
    <script type="module" src="js/checkout.js"></script>
</body>
</html>