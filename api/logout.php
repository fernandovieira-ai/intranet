<?php
require_once 'config.php';

// Destruir sessão
session_unset();
session_destroy();

// Limpar cookie de sessão
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

$response = [
    'sucesso' => true,
    'mensagem' => 'Logout realizado com sucesso'
];

echo json_encode($response);
?>
