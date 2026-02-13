<?php
// Configurações do banco de dados - usar variáveis de ambiente
define('DB_HOST', getenv('DB_HOST') ?: 'cloud.digitalrf.com.br');
define('DB_NAME', getenv('DB_NAME') ?: 'drfweb');
define('DB_USER', getenv('DB_USER') ?: 'drfweb');
define('DB_PASS', getenv('DB_PASS') ?: 'ASf5S6g7d6d0s');

// Configurações de sessão
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Mudar para 1 se usar HTTPS

// Iniciar sessão se não estiver iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Função para conectar ao banco de dados
function getConexao() {
    try {
        $dsn = "pgsql:host=" . DB_HOST . ";dbname=" . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Erro na conexão: " . $e->getMessage());
        return null;
    }
}

// Função para gerar hash de senha
function hashSenha($senha) {
    return password_hash($senha, PASSWORD_DEFAULT);
}

// Função para verificar senha
function verificarSenha($senha, $hash) {
    return password_verify($senha, $hash);
}

// Headers CORS (ajustar conforme necessário)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Responder OPTIONS para preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
