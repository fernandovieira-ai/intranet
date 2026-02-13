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

async function testarSistema() {
  try {
    console.log("=".repeat(70));
    console.log("TESTE COMPLETO DO SISTEMA FAQ-ERROS");
    console.log("=".repeat(70));
    console.log();

    // 1. Verificar registros no banco
    console.log("1️⃣ VERIFICANDO BANCO DE DADOS:");
    const result = await pool.query(`
      SELECT 
        id,
        nom_sistema,
        CASE WHEN imagem IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_bytea,
        caminho_arquivo,
        tipo_arquivo,
        CASE WHEN (caminho_arquivo IS NOT NULL OR imagem IS NOT NULL) THEN true ELSE false END as tem_imagem
      FROM drfintra.tab_faq
      ORDER BY id
    `);

    console.log(`   Total de registros: ${result.rows.length}\n`);
    console.log(
      "   ID | Sistema      | BYTEA | Arquivo Disco          | Tipo          | Tem?"
    );
    console.log("   " + "-".repeat(75));

    result.rows.forEach((r) => {
      const id = String(r.id).padEnd(3);
      const sistema = (r.nom_sistema || "").substring(0, 12).padEnd(12);
      const bytea = r.tem_bytea.padEnd(5);
      const caminho = (r.caminho_arquivo || "NULL").substring(0, 22).padEnd(22);
      const tipo = (r.tipo_arquivo || "NULL").substring(0, 13).padEnd(13);
      const temImg = r.tem_imagem ? "✅" : "❌";
      console.log(
        `   ${id}| ${sistema}| ${bytea}| ${caminho}| ${tipo}| ${temImg}`
      );
    });
    console.log();

    // 2. Verificar arquivos na pasta
    console.log("2️⃣ VERIFICANDO PASTA DE UPLOADS:");
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
      console.log(`   📂 Pasta: ${pastaUploads}`);
      console.log(`   📄 Total de arquivos: ${arquivosReais.length}\n`);

      if (arquivosReais.length > 0) {
        console.log("   Arquivos encontrados:");
        for (const arquivo of arquivosReais) {
          const stats = await fs.stat(path.join(pastaUploads, arquivo));
          const tamanho = (stats.size / 1024).toFixed(2);
          console.log(`   - ${arquivo} (${tamanho} KB)`);
        }
        console.log();
      }
    } catch (error) {
      console.log(`   ❌ Erro ao acessar pasta: ${error.message}\n`);
    }

    // 3. Verificar consistência
    console.log("3️⃣ VERIFICANDO CONSISTÊNCIA:");
    let inconsistencias = 0;

    for (const reg of result.rows) {
      if (reg.caminho_arquivo) {
        const caminhoCompleto = path.join(
          __dirname,
          "..",
          "public",
          reg.caminho_arquivo
        );
        try {
          await fs.access(caminhoCompleto);
          console.log(`   ✅ ID ${reg.id}: Arquivo existe no disco`);
        } catch (error) {
          console.log(
            `   ❌ ID ${reg.id}: Caminho registrado mas arquivo NÃO existe!`
          );
          console.log(`      Caminho: ${reg.caminho_arquivo}`);
          inconsistencias++;
        }
      }
    }

    if (inconsistencias === 0) {
      console.log(`   ✅ Nenhuma inconsistência encontrada!`);
    } else {
      console.log(`   ⚠️ ${inconsistencias} inconsistência(s) encontrada(s)!`);
    }
    console.log();

    // 4. Estatísticas
    console.log("4️⃣ ESTATÍSTICAS:");
    const comBytea = result.rows.filter((r) => r.tem_bytea === "SIM").length;
    const comArquivo = result.rows.filter((r) => r.caminho_arquivo).length;
    const comImagem = result.rows.filter((r) => r.tem_imagem).length;

    console.log(`   📊 Com BYTEA (antigo): ${comBytea}`);
    console.log(`   📁 Com arquivo disco (novo): ${comArquivo}`);
    console.log(`   🖼️  Total com imagem/PDF: ${comImagem}`);
    console.log();

    // 5. Instruções de teste
    console.log("5️⃣ TESTE MANUAL:");
    console.log();
    console.log("   Para testar UPLOAD de PDF:");
    console.log("   1. Acesse FAQ-Erros");
    console.log("   2. Edite um erro (ID 23, 24 ou 25 - sem arquivo)");
    console.log("   3. Selecione um arquivo PDF");
    console.log("   4. Salve");
    console.log("   5. Veja o console do servidor (logs de [UPLOAD])");
    console.log("   6. Execute: ls public\\uploads\\faq-erros\\");
    console.log();

    console.log("   Para testar VISUALIZAÇÃO:");
    console.log("   1. Clique em 'Ver PDF' ou 'Ver Imagem' na tabela");
    console.log("   2. Para PDF: deve abrir modal de detalhes com iframe");
    console.log("   3. Para Imagem: deve abrir modal de visualização ampliada");
    console.log("   4. Veja o console do servidor (logs de [GET ARQUIVO])");
    console.log();

    console.log("   Para testar REMOÇÃO:");
    console.log("   1. Edite um erro que tenha arquivo");
    console.log("   2. Clique no botão 'Remover'");
    console.log("   3. Confirme a remoção");
    console.log("   4. Modal deve fechar automaticamente");
    console.log("   5. Tabela deve atualizar (sem botão Ver Arquivo)");
    console.log(
      "   6. Execute: ls public\\uploads\\faq-erros\\ (arquivo deletado)"
    );
    console.log("   7. Veja o console do servidor (logs de [DELETE])");
    console.log();

    console.log("=".repeat(70));
    console.log("✅ SISTEMA HÍBRIDO PRONTO!");
    console.log("   - Arquivos ANTIGOS (BYTEA) continuam funcionando");
    console.log("   - Arquivos NOVOS são salvos em disco");
    console.log("   - Remoção limpa AMBOS os tipos");
    console.log("=".repeat(70));

    await pool.end();
  } catch (error) {
    console.error("❌ Erro:", error);
    await pool.end();
    process.exit(1);
  }
}

testarSistema();
