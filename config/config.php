<?php
$host = 'localhost';      
$db   = 'diezqpys_data_lib';   
$user = 'diezqpys_diezqpys_cpanel';        
$pass = 'Masterbeta89@1998';     
$charset = 'utf8mb4';    

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Modo de errores
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Retornar como array asociativo
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Desactiva emulación de consultas preparadas
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

} catch (PDOException $e) {
    echo "Error de conexion: " . $e->getMessage();
}
?>
