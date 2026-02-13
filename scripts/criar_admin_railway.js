/**
 * Script para criar usuário administrador no Railway
 *
 * USO:
 * railway run node scripts/criar_admin_railway.js
 *
 * Ou localmente com DATABASE_URL do Railway:
 * DATABASE_URL=postgresql://... node scripts/criar_admin_railway.js
 */

const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const readline = require("readline");

// Usar DATABASE_URL do ambiente
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Erro: variável DATABASE_URL não encontrada");
  console.log("\n💡 Para usar localmente:");
  console.log("   1. Copie DATABASE_URL do Railway");
  console.log(
    "   2. Execute: DATABASE_URL=sua_url node scripts/criar_admin_railway.js",
  );
  console.log("\n💡 Ou use via Railway CLI:");
  console.log("   railway run node scripts/criar_admin_railway.js");
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function pergunta(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function criarAdmin() {
  try {
    console.log("🚀 Criando usuário administrador...\n");

    // Verificar conexão
    const testConn = await pool.query("SELECT NOW()");
    console.log("✅ Conectado ao PostgreSQL");
    console.log(`⏰ Hora do servidor: ${testConn.rows[0].now}\n`);

    // Verificar se schema existe
    const schemaCheck = await pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'drfintra'",
    );

    if (schemaCheck.rows.length === 0) {
      console.log("⚠️  Schema drfintra não existe!");
      console.log("📝 Execute primeiro o script: sql/setup_database.sql");
      process.exit(1);
    }

    // Verificar se tabela existe
    const tableCheck = await pool.query(
      `SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'drfintra' AND table_name = 'tab_usuario'`,
    );

    if (tableCheck.rows.length === 0) {
      console.log("⚠️  Tabela tab_usuario não existe!");
      console.log("📝 Execute primeiro o script: sql/setup_database.sql");
      process.exit(1);
    }

    console.log("✅ Schema e tabela encontrados\n");

    // Perguntar dados do admin
    const usuario =
      (await pergunta("👤 Nome de usuário (padrão: admin): ")) || "admin";
    const email =
      (await pergunta("📧 Email (padrão: admin@digitalrf.com.br): ")) ||
      "admin@digitalrf.com.br";
    const senha =
      (await pergunta("🔐 Senha (padrão: admin123): ")) || "admin123";

    console.log("\n🔒 Gerando hash da senha...");
    const senhaHash = await bcrypt.hash(senha, 10);

    // Verificar se usuário já existe
    const userExists = await pool.query(
      "SELECT id FROM drfintra.tab_usuario WHERE nom_usuario = $1",
      [usuario],
    );

    if (userExists.rows.length > 0) {
      const resposta = await pergunta(
        `\n⚠️  Usuário '${usuario}' já existe. Atualizar senha? (s/N): `,
      );

      if (resposta.toLowerCase() === "s") {
        await pool.query(
          "UPDATE drfintra.tab_usuario SET senha = $1, email = $2 WHERE nom_usuario = $3",
          [senhaHash, email, usuario],
        );
        console.log("\n✅ Senha atualizada com sucesso!");
      } else {
        console.log("\n❌ Operação cancelada");
      }
    } else {
      // Criar novo usuário
      const result = await pool.query(
        `INSERT INTO drfintra.tab_usuario 
                (nom_usuario, senha, email, ind_adm, ind_ativo, ind_bloqueado)
                VALUES ($1, $2, $3, 'S', 'S', 'N')
                RETURNING id, nom_usuario, email`,
        [usuario, senhaHash, email],
      );

      console.log("\n✅ Usuário administrador criado com sucesso!");
      console.log("📋 Detalhes:");
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Usuário: ${result.rows[0].nom_usuario}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Admin: Sim`);
    }

    console.log("\n🎉 Pronto! Você pode fazer login agora.\n");
  } catch (error) {
    console.error("\n❌ Erro ao criar administrador:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Verifique se o PostgreSQL está rodando no Railway");
    } else if (error.code === "23505") {
      console.log("\n💡 Usuário ou email já existe no banco");
    } else {
      console.error("Detalhes:", error);
    }
  } finally {
    rl.close();
    await pool.end();
  }
}

// Executar
criarAdmin();
