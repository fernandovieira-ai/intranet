const bcrypt = require("bcrypt");

/**
 * Script para gerar hash de senhas
 * Execute: node utils/gerar_senha.js
 */

async function gerarHash() {
  const senha = "fernando453"; // ALTERE AQUI

  try {
    const hash = await bcrypt.hash(senha, 10);

    console.log("\n===========================================");
    console.log("📝 Gerador de Hash de Senha");
    console.log("===========================================\n");
    console.log(`Senha: ${senha}`);
    console.log(`Hash:  ${hash}\n`);
    console.log("===========================================");
    console.log("📋 SQL para inserir usuário:");
    console.log("===========================================\n");
    console.log(`INSERT INTO drfintra.tab_usuario`);
    console.log(
      `(nom_usuario, senha, email, ind_bloqueado, ind_ativo, ind_adm)`
    );
    console.log(`VALUES`);
    console.log(
      `('fernando.vieira', '${hash}', 'fernando.vieira@empresa.com', 'N', 'S', 'S');\n`
    );

    // Testar verificação
    const valido = await bcrypt.compare(senha, hash);
    console.log("===========================================");
    console.log("🔍 Teste de Verificação:");
    console.log("===========================================");
    console.log(
      valido
        ? "✅ Hash válido - A senha pode ser verificada!"
        : "❌ Erro ao verificar hash"
    );
    console.log("===========================================\n");
  } catch (error) {
    console.error("❌ Erro ao gerar hash:", error);
  }
}

gerarHash();
