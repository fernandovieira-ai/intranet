<?php
require_once 'config.php';

// Obter dados do POST
$input = file_get_contents('php://input');
$dados = json_decode($input, true);

$response = [
    'sucesso' => false,
    'mensagem' => ''
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['mensagem'] = 'Método não permitido';
    echo json_encode($response);
    exit();
}

if (empty($dados['usuario']) || empty($dados['senha'])) {
    $response['mensagem'] = 'Usuário e senha são obrigatórios';
    echo json_encode($response);
    exit();
}

$usuario = trim($dados['usuario']);
$senha = $dados['senha'];
$lembrar = isset($dados['lembrar']) ? $dados['lembrar'] : false;

try {
    $pdo = getConexao();
    
    if (!$pdo) {
        $response['mensagem'] = 'Erro ao conectar ao banco de dados';
        echo json_encode($response);
        exit();
    }
    
    // Buscar usuário
    $sql = "SELECT id, nom_usuario, senha, email, ind_bloqueado, ind_ativo, ind_adm 
            FROM drfintra.tab_usuario 
            WHERE nom_usuario = :usuario";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':usuario', $usuario);
    $stmt->execute();
    
    $user = $stmt->fetch();
    
    if (!$user) {
        $response['mensagem'] = 'Usuário ou senha inválidos';
        echo json_encode($response);
        exit();
    }
    
    // Verificar se está bloqueado
    if ($user['ind_bloqueado'] === 'S') {
        $response['mensagem'] = 'Usuário bloqueado. Entre em contato com o administrador.';
        echo json_encode($response);
        exit();
    }
    
    // Verificar se está ativo
    if ($user['ind_ativo'] === 'N') {
        $response['mensagem'] = 'Usuário inativo. Entre em contato com o administrador.';
        echo json_encode($response);
        exit();
    }
    
    // Verificar senha
    if (!verificarSenha($senha, $user['senha'])) {
        $response['mensagem'] = 'Usuário ou senha inválidos';
        echo json_encode($response);
        exit();
    }
    
    // Login bem-sucedido - criar sessão
    $_SESSION['usuario_id'] = $user['id'];
    $_SESSION['usuario_nome'] = $user['nom_usuario'];
    $_SESSION['usuario_email'] = $user['email'];
    $_SESSION['usuario_admin'] = $user['ind_adm'] === 'S';
    $_SESSION['login_timestamp'] = time();
    
    // Se marcou "lembrar-me", aumentar tempo da sessão
    if ($lembrar) {
        ini_set('session.cookie_lifetime', 60 * 60 * 24 * 30); // 30 dias
    }
    
    // Registrar último acesso (opcional)
    $sqlUpdate = "UPDATE drfintra.tab_usuario 
                  SET ultimo_acesso = NOW() 
                  WHERE id = :id";
    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->bindParam(':id', $user['id']);
    $stmtUpdate->execute();
    
    $response['sucesso'] = true;
    $response['mensagem'] = 'Login realizado com sucesso';
    $response['usuario'] = [
        'nome' => $user['nom_usuario'],
        'email' => $user['email'],
        'admin' => $user['ind_adm'] === 'S'
    ];
    
} catch (PDOException $e) {
    error_log("Erro no login: " . $e->getMessage());
    $response['mensagem'] = 'Erro ao processar login';
}

echo json_encode($response);
?>
