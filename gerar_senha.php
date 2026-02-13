<?php
/**
 * Script auxiliar para gerar hash de senhas
 * Use este script para gerar o hash de senha antes de inserir no banco
 * 
 * Exemplo de uso:
 * php gerar_senha.php
 * 
 * Ou acesse via navegador: http://localhost/intranet/gerar_senha.php
 */

// Definir a senha que deseja gerar o hash
$senha = "123456"; // ALTERE AQUI

// Gerar hash
$hash = password_hash($senha, PASSWORD_DEFAULT);

echo "<h2>Gerador de Hash de Senha</h2>";
echo "<p><strong>Senha:</strong> " . htmlspecialchars($senha) . "</p>";
echo "<p><strong>Hash:</strong> " . htmlspecialchars($hash) . "</p>";
echo "<hr>";
echo "<h3>SQL para inserir usuário:</h3>";
echo "<pre>";
echo "INSERT INTO drfintra.tab_usuario \n";
echo "(nom_usuario, senha, email, ind_bloqueado, ind_ativo, ind_adm) \n";
echo "VALUES \n";
echo "('admin', '" . $hash . "', 'admin@empresa.com', 'N', 'S', 'S');\n";
echo "</pre>";

// Exemplo de verificação
echo "<hr>";
echo "<h3>Teste de Verificação:</h3>";
if (password_verify($senha, $hash)) {
    echo "<p style='color: green;'>✓ Hash válido - A senha pode ser verificada corretamente!</p>";
} else {
    echo "<p style='color: red;'>✗ Erro ao verificar hash</p>";
}
?>
