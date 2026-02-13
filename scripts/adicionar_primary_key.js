const pool = require("../config/database");

async function adicionarPrimaryKey() {
  try {
    console.log("🔧 Adicionando PRIMARY KEY na tabela de clientes...");

    // Verificar se já existe PRIMARY KEY
    const checkPK = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'drfintra' 
        AND table_name = 'tomticket_clientes' 
        AND constraint_type = 'PRIMARY KEY'
    `);

    if (checkPK.rows.length > 0) {
      console.log("✅ PRIMARY KEY já existe!");
      process.exit(0);
    }

    // Limpar registros duplicados ou com ID nulo
    console.log("🧹 Limpando dados duplicados ou nulos...");
    await pool.query(`
      DELETE FROM drfintra.tomticket_clientes 
      WHERE id IS NULL OR id = ''
    `);

    await pool.query(`
      DELETE FROM drfintra.tomticket_clientes a
      USING drfintra.tomticket_clientes b
      WHERE a.id = b.id AND a.ctid < b.ctid
    `);

    // Adicionar PRIMARY KEY
    console.log("🔑 Adicionando PRIMARY KEY...");
    await pool.query(`
      ALTER TABLE drfintra.tomticket_clientes 
      ADD PRIMARY KEY (id)
    `);

    console.log("✅ PRIMARY KEY adicionada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

adicionarPrimaryKey();
