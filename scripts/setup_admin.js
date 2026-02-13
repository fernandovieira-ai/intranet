const pool = require("../config/database");
const bcrypt = require("bcrypt");

async function criarUsuarioAdmin() {
  const usuario = "fernando.vieira";
  const senha = "fernando453";
  const email = "fernando.vieira@empresa.com";

  try {
    console.log("🔐 Gerando hash da senha...");
    const senhaHash = await bcrypt.hash(senha, 10);

    console.log("📝 Verificando e criando estrutura do banco...");

    // Tentar criar schema se não existir
    try {
      await pool.query("CREATE SCHEMA IF NOT EXISTS drfintra");
      console.log("✅ Schema verificado/criado");
    } catch (err) {
      console.log("⚠️  Schema já existe ou sem permissão para criar");
    }

    // Tentar criar tabela se não existir
    try {
      const createTable = `
                CREATE TABLE IF NOT EXISTS drfintra.tab_usuario (
                    id SERIAL PRIMARY KEY,
                    nom_usuario VARCHAR(20) UNIQUE NOT NULL,
                    senha VARCHAR(100) NOT NULL,
                    email VARCHAR(100),
                    ind_bloqueado CHAR(1) DEFAULT 'N',
                    ind_ativo CHAR(1) DEFAULT 'S',
                    ind_adm CHAR(1) DEFAULT 'N',
                    ultimo_acesso TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `;
      await pool.query(createTable);
      console.log("✅ Tabela verificada/criada");
    } catch (err) {
      console.log("⚠️  Tabela já existe ou sem permissão:", err.message);
    }

    console.log("📝 Inserindo usuário administrador...");

    const query = `
            INSERT INTO drfintra.tab_usuario 
            (nom_usuario, senha, email, ind_bloqueado, ind_ativo, ind_adm)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nom_usuario, email, ind_adm
        `;

    const values = [usuario, senhaHash, email, "N", "S", "S"];

    const result = await pool.query(query, values);

    console.log("\n✅ Usuário administrador criado com sucesso!");
    console.log("===========================================");
    console.log("Dados do usuário:");
    console.log("===========================================");
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Usuário: ${result.rows[0].nom_usuario}`);
    console.log(`Email: ${result.rows[0].email}`);
    console.log(
      `Administrador: ${result.rows[0].ind_adm === "S" ? "Sim" : "Não"}`
    );
    console.log("===========================================");
    console.log("\n🔑 Credenciais de acesso:");
    console.log(`Usuário: ${usuario}`);
    console.log(`Senha: ${senha}`);
    console.log("===========================================");
    console.log("\n💡 Acesse: http://localhost:3000");
    console.log("===========================================\n");
  } catch (error) {
    if (error.code === "23505") {
      console.error("\n❌ Erro: Usuário já existe no banco de dados!");
      console.log("\n🔑 Use as credenciais:");
      console.log(`Usuário: ${usuario}`);
      console.log(`Senha: ${senha}\n`);
    } else {
      console.error("\n❌ Erro ao criar usuário:", error.message);
      console.error("Código do erro:", error.code);
      console.error("\nDetalhes:", error);
    }
  } finally {
    await pool.end();
  }
}

criarUsuarioAdmin();
