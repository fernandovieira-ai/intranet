const pool = require("../config/database");
const bcrypt = require("bcrypt");

async function criarUsuarioAdmin() {
  const usuario = "fernando.vieira";
  const senha = "fernando453";
  const email = "fernando.vieira@empresa.com";

  try {
    console.log("🔐 Gerando hash da senha...");
    const senhaHash = await bcrypt.hash(senha, 10);

    console.log("📝 Inserindo usuário no banco de dados...");

    const query = `
            INSERT INTO drfintra.tab_usuario 
            (nom_usuario, senha, email, ind_bloqueado, ind_ativo, ind_adm)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nom_usuario, email, ind_adm
        `;

    const values = [usuario, senhaHash, email, "N", "S", "S"];

    const result = await pool.query(query, values);

    console.log("\n✅ Usuário criado com sucesso!");
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
    console.log("===========================================\n");
  } catch (error) {
    if (error.code === "23505") {
      console.error("❌ Erro: Usuário já existe no banco de dados!");
    } else {
      console.error("❌ Erro ao criar usuário:", error.message);
    }
  } finally {
    await pool.end();
  }
}

criarUsuarioAdmin();
