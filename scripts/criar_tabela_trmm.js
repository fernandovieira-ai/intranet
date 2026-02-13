const pool = require("../config/database");

async function criarTabelaTRMM() {
  const client = await pool.connect();

  try {
    console.log("🔧 Criando tabela drfintra.intra_trmm...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS drfintra.intra_trmm (
        id SERIAL PRIMARY KEY,
        cliente_nome VARCHAR(255) NOT NULL,
        api_url VARCHAR(500) NOT NULL,
        api_key VARCHAR(100) NOT NULL,
        observacao TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_cliente_trmm UNIQUE(cliente_nome)
      );
    `);

    console.log("✅ Tabela drfintra.intra_trmm criada com sucesso!");

    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trmm_cliente ON drfintra.intra_trmm(cliente_nome);
      CREATE INDEX IF NOT EXISTS idx_trmm_ativo ON drfintra.intra_trmm(ativo);
    `);

    console.log("✅ Índices criados com sucesso!");

    console.log("\n📋 Estrutura da tabela:");
    console.log("- id: SERIAL PRIMARY KEY");
    console.log("- cliente_nome: VARCHAR(255) NOT NULL UNIQUE");
    console.log("- api_url: VARCHAR(500) NOT NULL");
    console.log("- api_key: VARCHAR(100) NOT NULL");
    console.log("- observacao: TEXT");
    console.log("- ativo: BOOLEAN DEFAULT true");
    console.log("- criado_em: TIMESTAMP");
    console.log("- atualizado_em: TIMESTAMP");
  } catch (error) {
    console.error("❌ Erro ao criar tabela:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

criarTabelaTRMM();
