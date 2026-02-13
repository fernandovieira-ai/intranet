const pool = require("../config/database");

async function configurarSyncTomTicket() {
  try {
    console.log("🔧 Configurando sincronização TomTicket...");

    // Verificar se já existe registro
    const check = await pool.query(
      "SELECT * FROM drfintra.config WHERE chave = 'tomticket_ultima_sinc'"
    );

    if (check.rows.length > 0) {
      console.log("📅 Configuração existente:");
      console.log(
        `   Última sincronização: ${new Date(
          check.rows[0].valor
        ).toLocaleString("pt-BR")}`
      );
      console.log(
        `   Atualizado em: ${new Date(
          check.rows[0].atualizado_em
        ).toLocaleString("pt-BR")}`
      );

      // Perguntar se quer resetar
      console.log("\n✅ Configuração já existe!");
      console.log("💡 Para forçar nova sincronização, delete o registro:");
      console.log(
        "   DELETE FROM drfintra.config WHERE chave = 'tomticket_ultima_sinc';"
      );
    } else {
      // Inserir configuração inicial (data antiga para forçar primeira sincronização)
      await pool.query(
        `INSERT INTO drfintra.config (chave, valor, atualizado_em) 
         VALUES ('tomticket_ultima_sinc', $1, CURRENT_TIMESTAMP)`,
        ["2000-01-01T00:00:00.000Z"]
      );

      console.log("✅ Configuração inicial criada!");
      console.log("📅 Última sincronização definida para: 01/01/2000");
      console.log(
        "🔄 Na próxima verificação, o sistema irá sincronizar automaticamente"
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

configurarSyncTomTicket();
