<?php
require_once 'config.php';

$response = [
    'logado' => false,
    'usuario' => null
];

if (isset($_SESSION['usuario_id'])) {
    $response['logado'] = true;
    $response['usuario'] = [
        'id' => $_SESSION['usuario_id'],
        'nome' => $_SESSION['usuario_nome'],
        'email' => $_SESSION['usuario_email'],
        'admin' => $_SESSION['usuario_admin']
    ];
}

echo json_encode($response);
?>
