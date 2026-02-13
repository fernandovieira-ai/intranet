const pool = require("../config/database");

async function testarRotaUsuarios() {
  try {
    console.log("🔍 Testando rota de usuários...\n");

    // Simular requisição
    const query = `
            SELECT id, nom_usuario, email, ind_bloqueado, ind_ativo, ind_adm, ultimo_acesso
            FROM drfintra.tab_usuario
            ORDER BY nom_usuario
        `;

    const result = await pool.query(query);

    console.log("✅ Query executada com sucesso!");
    console.log(`📊 Total de usuários: ${result.rows.length}\n`);

    console.log("Usuários encontrados:");
    console.log("===========================================");
    result.rows.forEach((user) => {
      console.log(
        `ID: ${user.id} | Usuário: ${user.nom_usuario} | Admin: ${user.ind_adm}`
      );
    });
    console.log("===========================================\n");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await pool.end();
  }
}

testarRotaUsuarios();
