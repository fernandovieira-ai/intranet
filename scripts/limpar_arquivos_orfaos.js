const { Pool } = require("pg");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5432,
  ssl: false,
});

async function limparArquivosOrfaos() {
  try {
    console.log("🧹 LIMPEZA DE ARQUIVOS ÓRFÃOS\n");

    // 1. Buscar todos os caminhos registrados no banco
    const result = await pool.query(`
      SELECT caminho_arquivo 
      FROM drfintra.tab_faq 
      WHERE caminho_arquivo IS NOT NULL
    `);

    const arquivosRegistrados = result.rows
      .map((r) => path.basename(r.caminho_arquivo))
      .filter(Boolean);

    console.log(
      `📋 Arquivos registrados no banco: ${arquivosRegistrados.length}`
    );
    if (arquivosRegistrados.length > 0) {
      arquivosRegistrados.forEach((a) => console.log(`   - ${a}`));
    }
    console.log();

    // 2. Listar arquivos na pasta
    const pastaUploads = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "faq-erros"
    );
    const arquivos = await fs.readdir(pastaUploads);
    const arquivosReais = arquivos.filter((f) => !f.endsWith(".md"));

    console.log(`📂 Arquivos na pasta: ${arquivosReais.length}`);
    if (arquivosReais.length > 0) {
      arquivosReais.forEach((a) => console.log(`   - ${a}`));
    }
    console.log();

    // 3. Identificar órfãos
    const orfaos = arquivosReais.filter(
      (arquivo) => !arquivosRegistrados.includes(arquivo)
    );

    if (orfaos.length === 0) {
      console.log("✅ Nenhum arquivo órfão encontrado!\n");
      await pool.end();
      return;
    }

    console.log(`⚠️ Arquivos órfãos encontrados: ${orfaos.length}`);
    orfaos.forEach((a) => console.log(`   - ${a}`));
    console.log();

    // 4. Calcular tamanho total
    let tamanhoTotal = 0;
    for (const arquivo of orfaos) {
      const stats = await fs.stat(path.join(pastaUploads, arquivo));
      tamanhoTotal += stats.size;
    }
    console.log(
      `💾 Espaço a ser liberado: ${(tamanhoTotal / 1024).toFixed(2)} KB\n`
    );

    // 5. Perguntar se quer deletar (simulação - em produção use readline)
    console.log("Para deletar os órfãos, execute:");
    console.log("node scripts/limpar_arquivos_orfaos.js --delete\n");

    // Se passou --delete como argumento
    if (process.argv.includes("--delete")) {
      console.log("🗑️ Deletando arquivos órfãos...\n");

      for (const arquivo of orfaos) {
        const caminhoCompleto = path.join(pastaUploads, arquivo);
        await fs.unlink(caminhoCompleto);
        console.log(`   ✅ Deletado: ${arquivo}`);
      }

      console.log(`\n✅ ${orfaos.length} arquivo(s) deletado(s) com sucesso!`);
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Erro:", error);
    await pool.end();
    process.exit(1);
  }
}

limparArquivosOrfaos();
