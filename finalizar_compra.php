<?php
// finalizar_compra.php

require_once __DIR__ . '/config/config.php'; // Conexión a la BD

// Simulación de usuario logueado
$client_id = 1;

// Obtenemos los detalles del carrito para mostrarlos en el resumen
$cart_items = [];
$total = 0;

try {
    // Buscar el carrito activo del cliente
    $stmt_cart = $pdo->prepare("SELECT id_carrito FROM carritos_compra WHERE id_cliente = :client_id AND estado_id = 1");
    $stmt_cart->execute([':client_id' => $client_id]);
    $cart_id = $stmt_cart->fetchColumn();

    if ($cart_id) {
        // Obtener los productos del carrito
        $stmt_items = $pdo->prepare(
            "SELECT p.nombre_producto, dc.cantidad, dc.precio_unitario, (dc.cantidad * dc.precio_unitario) as subtotal
             FROM detalle_carrito dc
             JOIN productos p ON dc.id_producto = p.id_producto
             WHERE dc.id_carrito = :cart_id"
        );
        $stmt_items->execute([':cart_id' => $cart_id]);
        $cart_items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        // Calcular el total
        foreach ($cart_items as $item) {
            $total += $item['subtotal'];
        }
    }
    
    // --- PREPARAR MENSAJE PARA WHATSAPP ---
    $whatsapp_message = "¡Hola! Quisiera realizar el siguiente pedido:\n\n";
    foreach ($cart_items as $item) {
        $whatsapp_message .= "- " . $item['cantidad'] . " x " . $item['nombre_producto'] . " ($" . number_format($item['subtotal'], 2) . ")\n";
    }
    $whatsapp_message .= "\n*Total a Pagar: $" . number_format($total, 2) . "*";
    
    // Reemplaza TUNUMERO con tu número de WhatsApp en formato internacional (ej. 50377778888)
    $whatsapp_number = "50368345121"; 
    $whatsapp_url = "https://wa.me/" . $whatsapp_number . "?text=" . urlencode($whatsapp_message);

} catch (Exception $e) {
    // Manejo de errores
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
        .summary-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
        }
        .summary-table th, .summary-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .summary-table th {
            background-color: #f8f9fa;
        }
        .summary-total {
            text-align: right;
            font-size: 1.5rem;
            font-weight: bold;
        }
        .whatsapp-button {
            display: inline-block;
            background-color: #25D366;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.2rem;
            text-align: center;
            margin-top: 1rem;
        }
        .whatsapp-button:hover {
            background-color: #1DA851;
        }
    </style>
</head>
<body>
    <?php include 'includes/header.php'; ?>

    <div class="summary-container">
        <h1>Resumen de tu Pedido</h1>

        <?php if (!empty($cart_items)): ?>
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($cart_items as $item): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($item['nombre_producto']); ?></td>
                            <td><?php echo $item['cantidad']; ?></td>
                            <td>$<?php echo number_format($item['precio_unitario'], 2); ?></td>
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