const pool = require("../config/database");

async function criarTabelaClientes() {
  try {
    console.log("🔧 Criando tabela de clientes TomTicket...");

    const query = `
      CREATE TABLE IF NOT EXISTS drfintra.tomticket_clientes (
        id SERIAL PRIMARY KEY,
        tomticket_id VARCHAR(255) UNIQUE,
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
        last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, email)
      );

      -- Criar índices para melhorar performance
      CREATE INDEX IF NOT EXISTS idx_tomticket_clientes_tomticket_id 
        ON drfintra.tomticket_clientes(tomticket_id);
      
      CREATE INDEX IF NOT EXISTS idx_tomticket_clientes_email 
        ON drfintra.tomticket_clientes(email);
      
      CREATE INDEX IF NOT EXISTS idx_tomticket_clientes_name 
        ON drfintra.tomticket_clientes(name);
      
      CREATE INDEX IF NOT EXISTS idx_tomticket_clientes_active 
        ON drfintra.tomticket_clientes(active);

      -- Criar índice de busca textual
      CREATE INDEX IF NOT EXISTS idx_tomticket_clientes_search 
        ON drfintra.tomticket_clientes USING gin(to_tsvector('portuguese', name || ' ' || email));
    `;

    await pool.query(query);
    console.log("✅ Tabela drfintra.tomticket_clientes criada com sucesso!");
    console.log("✅ Índices criados com sucesso!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar tabela:", error);
    process.exit(1);
  }
}

criarTabelaClientes();
