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

async function verificarMigracao() {
  try {
    console.log("=".repeat(60));
    console.log("VERIFICAÇÃO DE MIGRAÇÃO - FAQ ERROS");
    console.log("=".repeat(60));
    console.log();

    // 1. Verificar se coluna caminho_arquivo existe
    console.log("1️⃣ Verificando coluna caminho_arquivo...");
    const coluna = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'drfintra' 
        AND table_name = 'tab_faq' 
        AND column_name = 'caminho_arquivo'
    `);

    if (coluna.rows.length === 0) {
      console.log("   ❌ Coluna caminho_arquivo NÃO existe!");
      console.log("\n   Execute o SQL:");
      console.log(
        "   ALTER TABLE drfintra.tab_faq ADD COLUMN caminho_arquivo VARCHAR(255);\n"
      );
      await pool.end();
      return;
    }

    console.log(
      `   ✅ Coluna existe: ${coluna.rows[0].data_type}(${coluna.rows[0].character_maximum_length})`
    );
    console.log();

    // 2. Verificar registros
    console.log("2️⃣ Verificando registros...");
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(imagem) as com_imagem_bytea,
        COUNT(caminho_arquivo) as com_caminho_arquivo,
        COUNT(tipo_arquivo) as com_tipo_arquivo
      FROM drfintra.tab_faq
    `);

    const s = stats.rows[0];
    console.log(`   📊 Total de registros: ${s.total}`);
    console.log(`   📦 Com imagem (BYTEA): ${s.com_imagem_bytea}`);
    console.log(`   📁 Com caminho_arquivo: ${s.com_caminho_arquivo}`);
    console.log(`   🏷️  Com tipo_arquivo: ${s.com_tipo_arquivo}`);
    console.log();

    // 3. Listar registros com detalhes
    console.log("3️⃣ Detalhes dos registros:");
    const registros = await pool.query(`
      SELECT 
        id,
        nom_sistema,
        CASE WHEN imagem IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_bytea,
        caminho_arquivo,
        tipo_arquivo,
        LENGTH(des_assunto) as tamanho_assunto
      FROM drfintra.tab_faq
      ORDER BY id
    `);

    console.log();
    console.log(
      "   ID | Sistema           | BYTEA | Caminho                    | Tipo"
    );
    console.log("   " + "-".repeat(80));
    registros.rows.forEach((r) => {
      const id = String(r.id).padEnd(4);
      const sistema = (r.nom_sistema || "").substring(0, 17).padEnd(17);
      const bytea = (r.tem_bytea || "NÃO").padEnd(5);
      const caminho = (r.caminho_arquivo || "NULL").substring(0, 26).padEnd(26);
      const tipo = (r.tipo_arquivo || "NULL").substring(0, 20);
      console.log(`   ${id}| ${sistema}| ${bytea}| ${caminho}| ${tipo}`);
    });
    console.log();

    // 4. Verificar pasta de uploads
    console.log("4️⃣ Verificando pasta de uploads...");
    const fs = require("fs").promises;
    const path = require("path");
    const pastaUploads = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "faq-erros"
    );

    try {
      const arquivos = await fs.readdir(pastaUploads);
      const arquivosReais = arquivos.filter((f) => !f.endsWith(".md"));
      console.log(`   📂 Pasta existe: ${pastaUploads}`);
      console.log(`   📄 Arquivos na pasta: ${arquivosReais.length}`);
      if (arquivosReais.length > 0) {
        console.log(`   Arquivos: ${arquivosReais.join(", ")}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Erro ao acessar pasta: ${error.message}`);
    }
    console.log();

    // 5. Instruções
    console.log("5️⃣ PRÓXIMOS PASSOS:");
    console.log();

    if (s.com_imagem_bytea > 0 && s.com_caminho_arquivo === 0) {
      console.log("   ⚠️ ATENÇÃO: Existem imagens no formato BYTEA!");
      console.log("   ℹ️  Novos uploads usarão arquivos em disco.");
      console.log(
        "   ℹ️  Imagens antigas continuarão funcionando (compatibilidade)."
      );
      console.log();
    }

    console.log("   1. Reinicie o servidor: npm start");
    console.log("   2. Teste fazer upload de um PDF");
    console.log("   3. Verifique a pasta: public/uploads/faq-erros/");
    console.log("   4. Teste visualizar e remover o arquivo");
    console.log();
    console.log("   ✅ Sistema pronto para usar arquivos em disco!");
    console.log();
    console.log("=".repeat(60));

    await pool.end();
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

verificarMigracao();
