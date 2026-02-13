const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5432,
  ssl: false,
});

async function verificarColunaTipoArquivo() {
  try {
    console.log("Verificando se a coluna tipo_arquivo existe...\n");

    // Verificar se a coluna existe
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'drfintra' 
        AND table_name = 'tab_faq' 
        AND column_name = 'tipo_arquivo'
    `);

    if (result.rows.length === 0) {
      console.log("❌ A coluna tipo_arquivo NÃO existe!");
      console.log("\nExecute o script SQL:");
      console.log("sql/add_tipo_arquivo.sql\n");

      // Tentar criar a coluna
      console.log("Tentando criar a coluna automaticamente...");
      await pool.query(`
        ALTER TABLE drfintra.tab_faq 
        ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(50);
      `);

      await pool.query(`
        UPDATE drfintra.tab_faq 
        SET tipo_arquivo = 'image/jpeg' 
        WHERE imagem IS NOT NULL AND tipo_arquivo IS NULL;
      `);

      console.log("✅ Coluna tipo_arquivo criada com sucesso!");
    } else {
      console.log("✅ A coluna tipo_arquivo existe!");
      console.log(`   Tipo: ${result.rows[0].data_type}\n`);

      // Verificar registros
      const count = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(imagem) as com_arquivo,
          COUNT(tipo_arquivo) as com_tipo
        FROM drfintra.tab_faq
      `);

      console.log("Estatísticas:");
      console.log(`  Total de registros: ${count.rows[0].total}`);
      console.log(`  Com arquivo: ${count.rows[0].com_arquivo}`);
      console.log(`  Com tipo_arquivo: ${count.rows[0].com_tipo}`);

      // Atualizar registros sem tipo
      if (count.rows[0].com_arquivo > count.rows[0].com_tipo) {
        console.log("\nAtualizando registros sem tipo_arquivo...");
        const updateResult = await pool.query(`
          UPDATE drfintra.tab_faq 
          SET tipo_arquivo = 'image/jpeg' 
          WHERE imagem IS NOT NULL AND tipo_arquivo IS NULL
        `);
        console.log(`✅ ${updateResult.rowCount} registros atualizados!`);
      }
    }

    await pool.end();
  } catch (error) {
    console.error("Erro ao verificar coluna:", error);
    process.exit(1);
  }
}

verificarColunaTipoArquivo();
