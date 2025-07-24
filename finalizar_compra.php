<?php
// finalizar_compra.php

require_once __DIR__ . '/config/config.php'; // Conexión a la BD

// Simulación de usuario logueado
$client_id = 1;

$cart_items = [];
$total = 0;
$error_message = '';

try {
    $stmt_cart = $pdo->prepare("SELECT id_carrito FROM carritos_compra WHERE id_cliente = :client_id AND estado_id = 1");
    $stmt_cart->execute([':client_id' => $client_id]);
    $cart_id = $stmt_cart->fetchColumn();

    if ($cart_id) {
        $stmt_items = $pdo->prepare(
            "SELECT p.nombre_producto, p.codigo_producto, dc.cantidad, dc.precio_unitario, (dc.cantidad * dc.precio_unitario) as subtotal
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
    
    // --- NUEVO FORMATO DE WHATSAPP OPTIMIZADO ---
    $whatsapp_message = "¡Hola! Quisiera realizar el siguiente pedido:\n\n";
    
    // Encabezado de la "tabla" más ancha
    $whatsapp_message .= "```\n"; // Inicia el bloque monoespaciado
    $whatsapp_message .= "Cant | Código          | Producto      | Subtotal\n";
    $whatsapp_message .= "--------------------------------------------------\n";

    foreach ($cart_items as $item) {
        // Ajustamos las columnas para el nuevo formato
        $cantidad = str_pad($item['cantidad'], 4, " ", STR_PAD_LEFT);
        
        // Columna Código (más ancha)
        $codigo = str_pad($item['codigo_producto'], 15, " ", STR_PAD_RIGHT);

        // Columna Producto (más corta)
        $producto_nombre = $item['nombre_producto'];
        if (strlen($producto_nombre) > 13) {
            $producto_nombre = substr($producto_nombre, 0, 10) . "...";
        }
        $producto_nombre = str_pad($producto_nombre, 13, " ", STR_PAD_RIGHT);

        // Columna Subtotal
        $subtotal = str_pad("$" . number_format($item['subtotal'], 2), 9, " ", STR_PAD_LEFT);

        $whatsapp_message .= $cantidad . " | " . $codigo . " | " . $producto_nombre . " | " . $subtotal . "\n";
    }
    $whatsapp_message .= "--------------------------------------------------\n";
    $whatsapp_message .= "```\n"; // Cierra el bloque monoespaciado

    $whatsapp_message .= "\n*Total a Pagar: $" . number_format($total, 2) . "*";
    
    // Tu número de teléfono
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
    <style>
        /* Estilos rápidos para la página de resumen */
        .summary-container { max-width: 800px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
        .summary-table th, .summary-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .summary-table th { background-color: #f8f9fa; }
        .summary-total { text-align: right; font-size: 1.5rem; font-weight: bold; }
        .whatsapp-button { display: inline-block; background-color: #25D366; color: white; padding: 1rem 2rem; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 1.2rem; text-align: center; margin-top: 1rem; }
        .whatsapp-button:hover { background-color: #1DA851; }
    </style>
</head>
<body style="overflow-y: auto;">
    <?php include 'includes/header.php'; ?>

    <div class="summary-container">
        <h1>Resumen de tu Pedido</h1>

        <?php if (!empty($cart_items)): ?>
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($cart_items as $item): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($item['codigo_producto']); ?></td>
                            <td><?php echo htmlspecialchars($item['nombre_producto']); ?></td>
                            <td><?php echo $item['cantidad']; ?></td>
                            <td>$<?php echo number_format($item['subtotal'], 2); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <div class="summary-total">
                Total: $<?php echo number_format($total, 2); ?>
            </div>

            <a href="<?php echo $whatsapp_url; ?>" id="send-whatsapp-btn" class="whatsapp-button" target="_blank">
                ✔ Enviar Pedido por WhatsApp
            </a>
            <p style="margin-top: 1rem; color: #666;">Serás redirigido a WhatsApp para enviar tu pedido.</p>

        <?php elseif (isset($error_message)): ?>
             <p style="color: red;"><?php echo $error_message; ?></p>
        <?php else: ?>
            <p>Tu carrito está vacío. <a href="index.php">Volver a la tienda</a>.</p>
        <?php endif; ?>
    </div>
    
    <?php include 'includes/footer.php'; ?>
    <script type="module" src="js/checkout.js"></script>
</body>
</html>