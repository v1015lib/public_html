<?php
// api/index.php

// Iniciar la sesión al principio de cualquier script que la necesite
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// =======================================================================
// LÓGICA DE CIERRE DE SESIÓN AUTOMÁTICO POR INACTIVIDAD
// =======================================================================

// 1. Definir el tiempo de inactividad en segundos (1800 segundos = 30 minutos)
$timeout_duration = 1800;

// 2. Comprobar si hay una sesión activa y si ha expirado
if (isset($_SESSION['id_cliente']) && isset($_SESSION['last_activity'])) {
    $elapsed_time = time() - $_SESSION['last_activity'];
    
    if ($elapsed_time > $timeout_duration) {
        session_unset();
        session_destroy();
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'Tu sesión ha expirado por inactividad.']);
        exit; // Detenemos la ejecución
    }
}

// 3. Actualizar la hora de la última actividad en cada petición
// Esto reinicia el "contador" de inactividad si el usuario está logueado
if (isset($_SESSION['id_cliente'])) {
    $_SESSION['last_activity'] = time();
}


// --- El resto de tu archivo se mantiene exactamente igual ---

ini_set('display_errors', 1);
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
            if ($method === 'POST' || $method === 'PUT') handleSetCartItemRequest($pdo);
            elseif ($method === 'DELETE') handleDeleteCartItemRequest($pdo);
            break;
        case 'cart-status':
             handleCartStatusRequest($pdo);
            break;
        case 'cart-details':
            handleCartDetailsRequest($pdo);
            break;
        case 'cart-checkout':
            if ($method === 'POST') handleCheckoutRequest($pdo);
            break;
        case 'favorites':
            if ($method === 'GET') handleGetFavoritesRequest($pdo);
            elseif ($method === 'POST') handleAddFavoriteRequest($pdo);
            elseif ($method === 'DELETE') handleRemoveFavoriteRequest($pdo);
            break;
        case 'register':
            if ($method === 'POST') handleRegisterRequest($pdo);
            break;
        case 'login':
            if ($method === 'POST') handleLoginRequest($pdo);
            break;
        case 'check-username':
            if ($method === 'GET') handleCheckUsernameRequest($pdo);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Recurso no especificado o no válido.']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

// --- LÓGICA DE LOGIN (CORREGIDA) ---
function handleLoginRequest(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['nombre_usuario']) || empty($data['password'])) throw new Exception("Nombre de usuario y contraseña son requeridos.");
    
    $stmt = $pdo->prepare("SELECT id_cliente, nombre_usuario, password_hash FROM clientes WHERE nombre_usuario = :nombre_usuario");
    $stmt->execute([':nombre_usuario' => $data['nombre_usuario']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($data['password'], $user['password_hash'])) {
        $_SESSION['id_cliente'] = $user['id_cliente'];
        $_SESSION['nombre_usuario'] = $user['nombre_usuario'];
        // --- CORRECCIÓN: Iniciamos el temporizador de actividad aquí ---
        $_SESSION['last_activity'] = time();
        echo json_encode(['success' => true, 'message' => 'Inicio de sesión exitoso. Redirigiendo...']);
    } else {
        throw new Exception("Nombre de usuario o contraseña incorrectos.");
    }
}

// --- LÓGICA DE REGISTRO (CORREGIDA) ---
function handleRegisterRequest(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $required_fields = ['nombre_usuario', 'password', 'nombre', 'telefono', 'id_tipo_cliente'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) throw new Exception("El campo '$field' es obligatorio.");
    }
    $stmt_check = $pdo->prepare("SELECT id_cliente FROM clientes WHERE nombre_usuario = :nombre_usuario");
    $stmt_check->execute([':nombre_usuario' => $data['nombre_usuario']]);
    if ($stmt_check->fetch()) throw new Exception("El nombre de usuario ya está en uso.");
    if (!empty($data['email'])) {
        $stmt_email_check = $pdo->prepare("SELECT id_cliente FROM clientes WHERE email = :email");
        $stmt_email_check->execute([':email' => $data['email']]);
        if ($stmt_email_check->fetch()) throw new Exception("El correo electrónico ya está en uso.");
    }
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $sql = "INSERT INTO clientes (nombre_usuario, nombre, apellido, email, telefono, password_hash, id_tipo_cliente, institucion, grado_actual) VALUES (:nombre_usuario, :nombre, :apellido, :email, :telefono, :password_hash, :id_tipo_cliente, :institucion, :grado_actual)";
    $stmt_insert = $pdo->prepare($sql);
    $stmt_insert->execute([':nombre_usuario' => $data['nombre_usuario'], ':nombre' => $data['nombre'], ':apellido' => empty($data['apellido']) ? null : $data['apellido'], ':email' => empty($data['email']) ? null : $data['email'], ':telefono' => $data['telefono'], ':password_hash' => $password_hash, ':id_tipo_cliente' => (int)$data['id_tipo_cliente'], ':institucion' => $data['institucion'] ?? null, ':grado_actual' => $data['grado_actual'] ?? null]);
    $new_user_id = $pdo->lastInsertId();
    $_SESSION['id_cliente'] = $new_user_id;
    $_SESSION['nombre_usuario'] = $data['nombre_usuario'];
    // --- CORRECCIÓN: Iniciamos el temporizador de actividad aquí también ---
    $_SESSION['last_activity'] = time(); 
    echo json_encode(['success' => true, 'message' => '¡Registro exitoso! Redirigiendo...']);
}


// --- LÓGICA DE FAVORITOS AHORA USA SESIONES Y DEVUELVE ERRORES CLAROS ---
function handleGetFavoritesRequest(PDO $pdo) {
    if (!isset($_SESSION['id_cliente'])) {
        echo json_encode([]);
        return;
    }
    $client_id = $_SESSION['id_cliente'];
    $stmt = $pdo->prepare("SELECT id_producto FROM favoritos WHERE id_cliente = :client_id");
    $stmt->execute([':client_id' => $client_id]);
    $favorites = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    echo json_encode($favorites);
}
function handleAddFavoriteRequest(PDO $pdo) {
    if (!isset($_SESSION['id_cliente'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'Debes iniciar sesión para añadir favoritos.']);
        return;
    }
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['product_id'])) throw new Exception('Falta el ID del producto.');
    $product_id = (int)$data['product_id'];
    $client_id = $_SESSION['id_cliente'];
    $stmt = $pdo->prepare("INSERT IGNORE INTO favoritos (id_cliente, id_producto) VALUES (:client_id, :product_id)");
    $stmt->execute([':client_id' => $client_id, ':product_id' => $product_id]);
    echo json_encode(['success' => true, 'message' => 'Producto añadido a favoritos.']);
}
function handleRemoveFavoriteRequest(PDO $pdo) {
    if (!isset($_SESSION['id_cliente'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'Debes iniciar sesión para quitar favoritos.']);
        return;
    }
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['product_id'])) throw new Exception('Falta el ID del producto.');
    $product_id = (int)$data['product_id'];
    $client_id = $_SESSION['id_cliente'];
    $stmt = $pdo->prepare("DELETE FROM favoritos WHERE id_cliente = :client_id AND id_producto = :product_id");
    $stmt->execute([':client_id' => $client_id, ':product_id' => $product_id]);
    echo json_encode(['success' => true, 'message' => 'Producto eliminado de favoritos.']);
}

// --- LÓGICA DEL CARRITO AHORA USA SESIONES Y DEVUELVE ERRORES CLAROS ---
function handleSetCartItemRequest(PDO $pdo) {
    if (!isset($_SESSION['id_cliente'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'Debes iniciar sesión para modificar el carrito.']);
        return;
    }
    $data = json_decode(file_get_contents('php://input'), true);
    $product_id = (int)$data['product_id'];
    $quantity = (int)$data['quantity'];
    $client_id = $_SESSION['id_cliente'];
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


function handleCartStatusRequest(PDO $pdo) {
    if (!isset($_SESSION['id_cliente'])) {
        echo json_encode(['total_price' => '0.00']); return;
    }
    $client_id = $_SESSION['id_cliente'];
    $stmt = $pdo->prepare("SELECT SUM(dc.cantidad * dc.precio_unitario) as total_price FROM detalle_carrito dc JOIN carritos_compra cc ON dc.id_carrito = cc.id_carrito WHERE cc.id_cliente = :client_id AND cc.estado_id = 1");
    $stmt->execute([':client_id' => $client_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $total_price = $result['total_price'] ? number_format($result['total_price'], 2, '.', '') : '0.00';
    echo json_encode(['total_price' => $total_price]);
}

function handleCartDetailsRequest(PDO $pdo) {
    if (!isset($_SESSION['id_cliente'])) {
        echo json_encode(['cart_items' => [], 'total' => '0.00']); return;
    }
    $client_id = $_SESSION['id_cliente'];
    $cart_id = getOrCreateCart($pdo, $client_id);
    if (!$cart_id) {
        echo json_encode(['cart_items' => [], 'total' => '0.00']); return;
    }
    $stmt_items = $pdo->prepare("SELECT p.id_producto, p.nombre_producto, p.url_imagen, dc.cantidad, dc.precio_unitario, (dc.cantidad * dc.precio_unitario) as subtotal FROM detalle_carrito dc JOIN productos p ON dc.id_producto = p.id_producto WHERE dc.id_carrito = :cart_id");
    $stmt_items->execute([':cart_id' => $cart_id]);
    $cart_items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);
    $total = 0;
    foreach ($cart_items as $item) $total += $item['subtotal'];
    echo json_encode(['cart_items' => $cart_items, 'total' => number_format($total, 2, '.', '')]);
}

function handleCheckoutRequest(PDO $pdo) {
    if (!isset($_SESSION['id_cliente'])) throw new Exception('Debes iniciar sesión para finalizar la compra.');
    $client_id = $_SESSION['id_cliente'];
    $cart_id = getOrCreateCart($pdo, $client_id);
    if (!$cart_id) throw new Exception("No se encontró un carrito activo para finalizar.");
    $stmt = $pdo->prepare("UPDATE carritos_compra SET estado_id = 20 WHERE id_carrito = :cart_id AND id_cliente = :client_id AND estado_id = 1");
    $stmt->execute([':cart_id' => $cart_id, ':client_id' => $client_id]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Compra finalizada con éxito.']);
    } else {
        echo json_encode(['success' => true, 'message' => 'El carrito ya estaba procesado o vacío.']);
    }
}

// --- El resto de las funciones se mantienen igual ---
function handleDeleteCartItemRequest(PDO $pdo) {
    if (!isset($_SESSION['id_cliente'])) throw new Exception('Debes iniciar sesión para modificar el carrito.');
    $data = json_decode(file_get_contents('php://input'), true);
    $product_id = (int)$data['product_id'];
    $client_id = $_SESSION['id_cliente'];
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


function handleCheckUsernameRequest(PDO $pdo) {
    $username = $_GET['username'] ?? '';
    if (empty($username)) {
        echo json_encode(['is_available' => false]); return;
    }
    $stmt = $pdo->prepare("SELECT 1 FROM clientes WHERE nombre_usuario = :nombre_usuario LIMIT 1");
    $stmt->execute([':nombre_usuario' => $username]);
    $userExists = $stmt->rowCount() > 0;
    $is_available = !$userExists;
    echo json_encode(['is_available' => $is_available]);
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