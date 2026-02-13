const pool = require("../config/database");

async function limparTabelaTRMM() {
  try {
    console.log(
      "🗑️ Limpando clientes importados automaticamente da tabela intra_trmm..."
    );

    const result = await pool.query(
      "DELETE FROM drfintra.intra_trmm WHERE observacao LIKE '%importado automaticamente%'"
    );

    console.log(`✅ ${result.rowCount} registros removidos com sucesso!`);
    console.log(
      "✅ Tabela limpa. Agora você pode importar novamente com os nomes corretos."
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao limpar tabela:", error.message);
    process.exit(1);
  }
}

limparTabelaTRMM();
