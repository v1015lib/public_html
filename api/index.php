<?php
// api/index.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Usamos la ruta correcta a tu archivo de configuración
require_once __DIR__ . '/../config/config.php';

$resource = $_GET['resource'] ?? '';

try {
    switch ($resource) {
        case 'products':
            // Pasamos la conexión $pdo a la función
            handleProductsRequest($pdo);
            break;
        case 'departments':
            handleDepartmentsRequest($pdo);
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

function handleProductsRequest(PDO $pdo) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
    $offset = ($page - 1) * $limit;

    $department_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : null;
    $search_term = isset($_GET['search']) ? trim($_GET['search']) : '';
    $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'random';
    $order = isset($_GET['order']) ? strtoupper($_GET['order']) : 'ASC';

    $allowedSorts = ['nombre_producto', 'precio_venta', 'precio_compra'];
    if (!in_array($sort_by, $allowedSorts) && $sort_by !== 'random') {
        $sort_by = 'random';
    }
    if (!in_array($order, ['ASC', 'DESC'])) {
        $order = 'ASC';
    }

    // --- Lógica de la consulta ---
    $base_sql = "FROM productos p INNER JOIN departamentos d ON p.departamento = d.id_departamento";
    $where_clauses = ["1=1"]; // Empezamos con una condición base
    $params = [];

    if ($department_id !== null && $department_id > 0) {
        $where_clauses[] = "p.departamento = :department_id";
        $params[':department_id'] = $department_id;
    }

    if (!empty($search_term)) {
        $where_clauses[] = "(p.nombre_producto LIKE :search_term OR p.codigo_producto LIKE :search_term_code)";
        $params[':search_term'] = '%' . $search_term . '%';
        $params[':search_term_code'] = '%' . $search_term . '%';
    }

    // =======================================================================
    // FILTRO OPCIONAL PARA OCULTAR PRODUCTOS SIN IMAGEN (LADO DEL SERVIDOR)
    // Este bloque SOLO se ejecuta si la llamada desde JavaScript incluye
    // el parámetro "hide_no_image=true".
    // =======================================================================
    if (isset($_GET['hide_no_image']) && $_GET['hide_no_image'] === 'true') {
        $where_clauses[] = "(p.url_imagen IS NOT NULL AND p.url_imagen != '')";
    }
    
    $where_sql = " WHERE " . implode(" AND ", $where_clauses);

    // --- Consulta para contar el total de productos ---
    $countSql = "SELECT COUNT(*) " . $base_sql . $where_sql;
    $stmtCount = $pdo->prepare($countSql);
    $stmtCount->execute($params);
    $total_products = $stmtCount->fetchColumn();
    $total_pages = ceil($total_products / $limit);

    // --- Consulta para obtener los productos de la página ---
    $sql = "SELECT p.*, d.departamento AS nombre_departamento " . $base_sql . $where_sql;

    if ($sort_by === 'random') {
        $sql .= " ORDER BY RAND()";
    } else {
        $sql .= " ORDER BY " . $sort_by . " " . $order;
    }

    $sql .= " LIMIT :limit OFFSET :offset";
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;

    $stmt = $pdo->prepare($sql);
    
    // Asignar los tipos de parámetros para LIMIT y OFFSET
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $key => &$val) {
        if ($key !== ':limit' && $key !== ':offset') {
            $stmt->bindParam($key, $val);
        }
    }
    
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'products' => $products,
        'total_products' => (int) $total_products,
        'total_pages' => $total_pages,
        'current_page' => $page,
        'limit' => $limit
    ]);
}

function handleDepartmentsRequest(PDO $pdo) {
    $stmt = $pdo->query("SELECT id_departamento, codigo_departamento, departamento FROM departamentos ORDER BY departamento ASC");
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($departments);
}
?>