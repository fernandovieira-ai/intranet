const pool = require("../config/database");

async function criarTabelaConfig() {
  try {
    console.log("🔧 Criando tabela config...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS drfintra.config (
        chave VARCHAR(100) PRIMARY KEY,
        valor TEXT,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tabela drfintra.config criada com sucesso!");
    console.log("📋 Estrutura:");
    console.log("   - chave: VARCHAR(100) - Chave da configuração (PRIMARY KEY)");
    console.log("   - valor: TEXT - Valor da configuração");
    console.log("   - atualizado_em: TIMESTAMP - Data/hora da última atualização");

    // Criar índice para busca rápida
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_config_chave 
      ON drfintra.config(chave)
    `);

    console.log("✅ Índice criado com sucesso!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar tabela:", error.message);
    process.exit(1);
  }
}

criarTabelaConfig();
