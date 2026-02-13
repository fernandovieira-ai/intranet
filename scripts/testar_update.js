const pool = require("../config/database");

async function testarUpdate() {
  try {
    console.log("🔍 Testando UPDATE na tabela...\n");

    // Buscar o primeiro usuário
    const selectResult = await pool.query(
      "SELECT id FROM drfintra.tab_usuario LIMIT 1"
    );

    if (selectResult.rows.length === 0) {
      console.log("❌ Nenhum usuário encontrado na tabela");
      return;
    }

    const userId = selectResult.rows[0].id;
    console.log(`✅ Usuário ID encontrado: ${userId}`);

    // Testar UPDATE
    console.log("📝 Executando UPDATE...");
    const updateQuery =
      "UPDATE drfintra.tab_usuario SET ultimo_acesso = NOW() WHERE id = $1";
    await pool.query(updateQuery, [userId]);

    console.log("✅ UPDATE executado com sucesso!");

    // Verificar se foi atualizado
    const verifyResult = await pool.query(
      "SELECT id, nom_usuario, ultimo_acesso FROM drfintra.tab_usuario WHERE id = $1",
      [userId]
    );

    console.log("\n📋 Dados após UPDATE:");
    console.log(verifyResult.rows[0]);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    console.error("Código:", error.code);
    console.error("Detalhes completos:", error);
  } finally {
    await pool.end();
  }
}

testarUpdate();
