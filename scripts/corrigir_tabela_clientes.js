const pool = require("../config/database");

async function corrigirTabelaClientes() {
  try {
    console.log("🔧 Corrigindo tabela de clientes TomTicket...");

    // Remover tabela antiga se existir
    await pool.query(
      "DROP TABLE IF EXISTS drfintra.tomticket_clientes CASCADE"
    );
    console.log("✅ Tabela antiga removida");

    // Criar tabela novamente com PRIMARY KEY
    const query = `
      CREATE TABLE drfintra.tomticket_clientes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        monthly_ticket_quota INTEGER,
        allow_create_tickets BOOLEAN DEFAULT true,
        email_validated BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        account_approved BOOLEAN DEFAULT true,
        organization_id VARCHAR(255),
        organization_name VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Criar índices para melhorar performance
      CREATE INDEX idx_tomticket_clientes_email 
        ON drfintra.tomticket_clientes(email);
      
      CREATE INDEX idx_tomticket_clientes_name 
        ON drfintra.tomticket_clientes(name);
      
      CREATE INDEX idx_tomticket_clientes_active 
        ON drfintra.tomticket_clientes(active);

      -- Criar índice de busca textual
      CREATE INDEX idx_tomticket_clientes_search 
        ON drfintra.tomticket_clientes USING gin(to_tsvector('portuguese', name || ' ' || email));
    `;

    await pool.query(query);
    console.log(
      "✅ Tabela drfintra.tomticket_clientes criada com PRIMARY KEY!"
    );
    console.log("✅ Índices criados com sucesso!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao corrigir tabela:", error);
    process.exit(1);
  }
}

corrigirTabelaClientes();
