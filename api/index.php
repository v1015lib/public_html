<?php
// api/index.php (Versión final y completa con favoritos)

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/config.php';

$resource = $_GET['resource'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($resource) {
        case 'products':
            handleProductsRequest($pdo);
            break;
        case 'departments':
            handleDepartmentsRequest($pdo);
            break;
        case 'cart':
            if ($method === 'POST' || $method === 'PUT') {
                handleSetCartItemRequest($pdo);
            } elseif ($method === 'DELETE') {
                handleDeleteCartItemRequest($pdo);
            }
            break;
        case 'cart-status':
             if ($method === 'GET') {
                handleCartStatusRequest($pdo);
            }
            break;
        case 'cart-details':
            if ($method === 'GET') {
                handleCartDetailsRequest($pdo);
            }
            break;
        case 'cart-checkout':
            if ($method === 'POST') {
                handleCheckoutRequest($pdo);
            }
            break;
        // --- NUEVA RUTA PARA MANEJAR FAVORITOS ---
        case 'favorites':
            if ($method === 'GET') {
                handleGetFavoritesRequest($pdo);
            } elseif ($method === 'POST') {
                handleAddFavoriteRequest($pdo);
            } elseif ($method === 'DELETE') {
                handleRemoveFavoriteRequest($pdo);
            }
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Recurso no especificado o no válido.']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error en la API (PDOException): " . $e->getMessage());
    echo json_encode(['error' => 'Error interno del servidor (BD): ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Error en la API (General Exception): " . $e->getMessage());
    echo json_encode(['error' => 'Error inesperado del servidor: ' . $e->getMessage()]);
}


// =======================================================================
// NUEVAS FUNCIONES PARA MANEJAR FAVORITOS
// =======================================================================

function handleGetFavoritesRequest(PDO $pdo) {
    $client_id = 1; // Simulación de usuario
    $stmt = $pdo->prepare("SELECT id_producto FROM favoritos WHERE id_cliente = :client_id");
    $stmt->execute([':client_id' => $client_id]);
    $favorites = $stmt->fetchAll(PDO::FETCH_COLUMN, 0); // Devuelve un array simple de IDs de producto
    echo json_encode($favorites);
}

function handleAddFavoriteRequest(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['product_id'])) throw new Exception('Falta el ID del producto.');
    
    $product_id = (int)$data['product_id'];
    $client_id = 1; // Simulación de usuario

    // Usamos INSERT IGNORE para evitar errores si el favorito ya existe
    $stmt = $pdo->prepare("INSERT IGNORE INTO favoritos (id_cliente, id_producto) VALUES (:client_id, :product_id)");
    $stmt->execute([':client_id' => $client_id, ':product_id' => $product_id]);

    echo json_encode(['success' => true, 'message' => 'Producto añadido a favoritos.']);
}

function handleRemoveFavoriteRequest(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['product_id'])) throw new Exception('Falta el ID del producto.');

    $product_id = (int)$data['product_id'];
    $client_id = 1; // Simulación de usuario

    $stmt = $pdo->prepare("DELETE FROM favoritos WHERE id_cliente = :client_id AND id_producto = :product_id");
    $stmt->execute([':client_id' => $client_id, ':product_id' => $product_id]);

    echo json_encode(['success' => true, 'message' => 'Producto eliminado de favoritos.']);
}


// --- FUNCIONES EXISTENTES (SIN CAMBIOS) ---

function handleSetCartItemRequest(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['product_id']) || !isset($data['quantity'])) throw new Exception('Faltan datos.');
    $product_id = (int)$data['product_id'];
    $quantity = (int)$data['quantity'];
    $client_id = 1;
    $pdo->beginTransaction();
    $cart_id = getOrCreateCart($pdo, $client_id);
    if ($quantity <= 0) {
        deleteCartItem($pdo, $cart_id, $product_id);
    } else {
        $stmt_check = $pdo->prepare("SELECT id_detalle_carrito FROM detalle_carrito WHERE id_carrito = :cart_id AND id_producto = :product_id");
        $stmt_check->execute([':cart_id' => $cart_id, ':product_id' => $product_id]);
        $detail_id = $stmt_check->fetchColumn();
        if ($detail_id) {
            $stmt_update = $pdo->prepare("UPDATE detalle_carrito SET cantidad = :quantity WHERE id_detalle_carrito = :detail_id");
            $stmt_update->execute([':quantity' => $quantity, ':detail_id' => $detail_id]);
        } else {
            $stmt_price = $pdo->prepare("SELECT precio_venta FROM productos WHERE id_producto = :product_id");
            $stmt_price->execute([':product_id' => $product_id]);
            $unit_price = $stmt_price->fetchColumn();
            if ($unit_price === false) throw new Exception("Producto no encontrado.");
            $stmt_insert = $pdo->prepare("INSERT INTO detalle_carrito (id_carrito, id_producto, cantidad, precio_unitario) VALUES (:cart_id, :product_id, :quantity, :unit_price)");
            $stmt_insert->execute([':cart_id' => $cart_id, ':product_id' => $product_id, ':quantity' => $quantity, ':unit_price' => $unit_price]);
        }
    }
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Carrito actualizado.']);
}

function handleDeleteCartItemRequest(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $product_id = (int)$data['product_id'];
    $client_id = 1;
    $cart_id = getOrCreateCart($pdo, $client_id);
    deleteCartItem($pdo, $cart_id, $product_id);
    echo json_encode(['success' => true, 'message' => 'Producto eliminado.']);
}

function getOrCreateCart(PDO $pdo, int $client_id) {
    $stmt = $pdo->prepare("SELECT id_carrito FROM carritos_compra WHERE id_cliente = :client_id AND estado_id = 1");
    $stmt->execute([':client_id' => $client_id]);
    $cart_id = $stmt->fetchColumn();
    if (!$cart_id) {
        $stmt_new = $pdo->prepare("INSERT INTO carritos_compra (id_cliente, estado_id) VALUES (:client_id, 1)");
        $stmt_new->execute([':client_id' => $client_id]);
        return $pdo->lastInsertId();
    }
    return $cart_id;
}

function deleteCartItem(PDO $pdo, int $cart_id, int $product_id) {
    $stmt = $pdo->prepare("DELETE FROM detalle_carrito WHERE id_carrito = :cart_id AND id_producto = :product_id");
    $stmt->execute([':cart_id' => $cart_id, ':product_id' => $product_id]);
}

function handleCartStatusRequest(PDO $pdo) {
    $client_id = 1; 
    $stmt = $pdo->prepare("SELECT SUM(dc.cantidad * dc.precio_unitario) as total_price FROM detalle_carrito dc JOIN carritos_compra cc ON dc.id_carrito = cc.id_carrito WHERE cc.id_cliente = :client_id AND cc.estado_id = 1");
    $stmt->execute([':client_id' => $client_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $total_price = $result['total_price'] ? number_format($result['total_price'], 2, '.', '') : '0.00';
    echo json_encode(['total_price' => $total_price]);
}

function handleCartDetailsRequest(PDO $pdo) {
    $client_id = 1;
    $stmt_cart = $pdo->prepare("SELECT id_carrito FROM carritos_compra WHERE id_cliente = :client_id AND estado_id = 1");
    $stmt_cart->execute([':client_id' => $client_id]);
    $cart_id = $stmt_cart->fetchColumn();
    if (!$cart_id) {
        echo json_encode(['cart_items' => [], 'total' => '0.00']);
        return;
    }
    $stmt_items = $pdo->prepare("SELECT p.id_producto, p.nombre_producto, p.url_imagen, dc.cantidad, dc.precio_unitario, (dc.cantidad * dc.precio_unitario) as subtotal FROM detalle_carrito dc JOIN productos p ON dc.id_producto = p.id_producto WHERE dc.id_carrito = :cart_id");
    $stmt_items->execute([':cart_id' => $cart_id]);
    $cart_items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);
    $total = 0;
    foreach ($cart_items as $item) $total += $item['subtotal'];
    echo json_encode(['cart_items' => $cart_items, 'total' => number_format($total, 2, '.', '')]);
}

function handleCheckoutRequest(PDO $pdo) {
    $client_id = 1;
    $cart_id = getOrCreateCart($pdo, $client_id);
    if (!$cart_id) {
        http_response_code(404);
        echo json_encode(['error' => 'No se encontró un carrito activo para finalizar.']);
        return;
    }
    $stmt = $pdo->prepare("UPDATE carritos_compra SET estado_id = 20 WHERE id_carrito = :cart_id AND id_cliente = :client_id AND estado_id = 1");
    $stmt->execute([':cart_id' => $cart_id, ':client_id' => $client_id]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Compra finalizada con éxito.']);
    } else {
        echo json_encode(['success' => true, 'message' => 'El carrito ya estaba procesado o vacío.']);
    }
}

function handleProductsRequest(PDO $pdo) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
    $offset = ($page - 1) * $limit;
    $department_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : null;
    $search_term = isset($_GET['search']) ? trim($_GET['search']) : '';
    $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'random';
    $order = isset($_GET['order']) ? strtoupper($_GET['order']) : 'ASC';
    $filter_name = '';
    $allowedSorts = ['nombre_producto', 'precio_venta', 'precio_compra'];
    if (!in_array($sort_by, $allowedSorts) && $sort_by !== 'random') $sort_by = 'random';
    if (!in_array($order, ['ASC', 'DESC'])) $order = 'ASC';
    $base_sql = "FROM productos p INNER JOIN departamentos d ON p.departamento = d.id_departamento";
    $where_clauses = ["1=1"];
    $params = [];
    if ($department_id !== null && $department_id > 0) {
        $where_clauses[] = "p.departamento = :department_id";
        $params[':department_id'] = $department_id;
        $stmt_dept_name = $pdo->prepare("SELECT departamento FROM departamentos WHERE id_departamento = :dept_id");
        $stmt_dept_name->execute([':dept_id' => $department_id]);
        $filter_name = $stmt_dept_name->fetchColumn();
    }
    if (!empty($search_term)) {
        $where_clauses[] = "(p.nombre_producto LIKE :search_term OR p.codigo_producto LIKE :search_term_code)";
        $params[':search_term'] = '%' . $search_term . '%';
        $params[':search_term_code'] = '%' . $search_term . '%';
        $filter_name = $search_term;
    }
    if (isset($_GET['hide_no_image']) && $_GET['hide_no_image'] === 'true') {
        $where_clauses[] = "(p.url_imagen IS NOT NULL AND p.url_imagen != '')";
    }
    $where_sql = " WHERE " . implode(" AND ", $where_clauses);
    $countSql = "SELECT COUNT(*) " . $base_sql . $where_sql;
    $stmtCount = $pdo->prepare($countSql);
    $stmtCount->execute($params);
    $total_products = $stmtCount->fetchColumn();
    $total_pages = ceil($total_products / $limit);
    $sql = "SELECT p.*, d.departamento AS nombre_departamento " . $base_sql . $where_sql;
    if ($sort_by === 'random') $sql .= " ORDER BY RAND()";
    else $sql .= " ORDER BY " . $sort_by . " " . $order;
    $sql .= " LIMIT :limit OFFSET :offset";
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $key => &$val) {
        if ($key !== ':limit' && $key !== ':offset') $stmt->bindParam($key, $val);
    }
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['products' => $products, 'total_products' => (int) $total_products, 'total_pages' => $total_pages, 'current_page' => $page, 'limit' => $limit, 'filter_name' => $filter_name]);
}

function handleDepartmentsRequest(PDO $pdo) {
    $stmt = $pdo->query("SELECT id_departamento, codigo_departamento, departamento FROM departamentos ORDER BY departamento ASC");
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($departments);
}
?>