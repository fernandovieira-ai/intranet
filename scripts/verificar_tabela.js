const pool = require("../config/database");

async function verificarTabela() {
  try {
    console.log("🔍 Verificando estrutura da tabela...\n");

    // Verificar colunas da tabela
    const query = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'drfintra' 
            AND table_name = 'tab_usuario'
            ORDER BY ordinal_position;
        `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log("❌ Tabela drfintra.tab_usuario não encontrada!");
    } else {
      console.log("✅ Colunas da tabela drfintra.tab_usuario:");
      console.log("===========================================");
      result.rows.forEach((col) => {
        const length = col.character_maximum_length
          ? `(${col.character_maximum_length})`
          : "";
        console.log(`- ${col.column_name}: ${col.data_type}${length}`);
      });
      console.log("===========================================\n");
    }

    // Testar SELECT
    console.log("🔍 Testando SELECT na tabela...");
    const testSelect = await pool.query(
      "SELECT * FROM drfintra.tab_usuario LIMIT 1"
    );
    console.log(
      "✅ SELECT funcionou! Colunas retornadas:",
      Object.keys(testSelect.rows[0] || {})
    );
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await pool.end();
  }
}

verificarTabela();
