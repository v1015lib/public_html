<?php
// api/index.php - VERSIÓN COMPLETA Y CORREGIDA CON NOMBRES DE TABLA

ini_set('display_errors', 1); // Muestra errores en la salida (¡DESACTIVAR EN PRODUCCIÓN!)
ini_set('display_startup_errors', 1); // Muestra errores de inicio (¡DESACTIVAR EN PRODUCCIÓN!)
error_reporting(E_ALL); // Reporta todos los tipos de errores (¡DESACTIVAR EN PRODUCCIÓN!)

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // ¡ADVERTENCIA! En producción, especificar dominios.

require_once __DIR__ . '/../config/config.php'; // Incluye el archivo de configuración de la BD

$resource = $_GET['resource'] ?? ''; // Obtener el recurso solicitado

try {
    switch ($resource) {
        case 'products':
            handleProductsRequest($pdo);
            break;
        case 'departments':
            handleDepartmentsRequest($pdo);
            break;
        default:
            http_response_code(400); // Bad Request
            echo json_encode(['error' => 'Recurso no especificado o no válido.']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    error_log("Error en la API (PDOException): " . $e->getMessage());
    // Mostramos el mensaje exacto de la BD en desarrollo para depuración
    echo json_encode(['error' => 'Error interno del servidor (BD): ' . $e->getMessage()]); 
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    error_log("Error en la API (General Exception): " . $e->getMessage());
    // Mostramos el mensaje exacto de la excepción en desarrollo para depuración
    echo json_encode(['error' => 'Error inesperado del servidor: ' . $e->getMessage()]);
}


/**
 * Maneja las solicitudes para obtener productos.
 * Incluye filtrado, búsqueda, paginación y ordenamiento.
 * @param PDO $pdo Objeto PDO para la conexión a la base de datos.
 */
function handleProductsRequest(PDO $pdo) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25; // 25 productos por página
    $offset = ($page - 1) * $limit;

    $department_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : null;
    $search_term = isset($_GET['search']) ? trim($_GET['search']) : '';
    $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'random'; // default random for initial page
    $order = isset($_GET['order']) ? strtoupper($_GET['order']) : 'ASC'; // ASC or DESC

    $allowedSorts = ['nombre_producto', 'precio_venta', 'precio_compra']; // Columnas permitidas para ordenar
    if (!in_array($sort_by, $allowedSorts) && $sort_by !== 'random') {
        $sort_by = 'random'; // Default to random if invalid
    }
    if (!in_array($order, ['ASC', 'DESC'])) {
        $order = 'ASC'; // Default to ASC if invalid
    }

    // ***** CORRECCIÓN DE NOMBRE DE TABLA: 'producto' a 'productos' y 'departamento' a 'departamentos' *****
    $sql = "SELECT p.*, d.departamento AS nombre_departamento
            FROM productos p
            INNER JOIN departamentos d ON p.departamento = d.id_departamento
            WHERE 1=1"; // Start with a true condition for easy appending

    $params = [];

    if ($department_id !== null && $department_id > 0) {
        $sql .= " AND p.departamento = :department_id";
        $params[':department_id'] = $department_id;
    }

    if (!empty($search_term)) {
        $sql .= " AND (p.nombre_producto LIKE :search_term OR p.codigo_producto LIKE :search_term_code)";
        $params[':search_term'] = '%' . $search_term . '%';
        $params[':search_term_code'] = '%' . $search_term . '%';
    }

    // Determine total count for pagination
    // ***** CORRECCIÓN DE NOMBRE DE TABLA: 'producto' a 'productos' *****
    $countSql = "SELECT COUNT(*) FROM productos p WHERE 1=1";
    $countParams = [];

    if ($department_id !== null && $department_id > 0) {
        $countSql .= " AND p.departamento = :department_id";
        $countParams[':department_id'] = $department_id;
    }
    if (!empty($search_term)) {
        $countSql .= " AND (p.nombre_producto LIKE :search_term OR p.codigo_producto LIKE :search_term_code)";
        $countParams[':search_term'] = '%' . $search_term . '%';
        $countParams[':search_term_code'] = '%' . $search_term . '%';
    }

    $stmtCount = $pdo->prepare($countSql);
    $stmtCount->execute($countParams);
    $total_products = $stmtCount->fetchColumn();
    $total_pages = ceil($total_products / $limit);

    // Add ordering
    if ($sort_by === 'random') {
        $sql .= " ORDER BY RAND()";
    } else {
        $sql .= " ORDER BY " . $sort_by . " " . $order;
    }

    // Add pagination limit
    $sql .= " LIMIT :limit OFFSET :offset";
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;


    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    echo json_encode([
        'products' => $products,
        'total_products' => $total_products,
        'total_pages' => $total_pages,
        'current_page' => $page,
        'limit' => $limit
    ]);
}

/**
 * Maneja las solicitudes para obtener la lista de departamentos.
 * @param PDO $pdo Objeto PDO para la conexión a la base de datos.
 */
function handleDepartmentsRequest(PDO $pdo) {
    // ***** CORRECCIÓN DE NOMBRE DE TABLA: 'departamento' a 'departamentos' *****
    $stmt = $pdo->query("SELECT id_departamento, codigo_departamento, departamento FROM departamentos ORDER BY departamento ASC");
    $departments = $stmt->fetchAll();
    echo json_encode($departments);
}
?>