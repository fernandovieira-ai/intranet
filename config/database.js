const { Pool } = require("pg");
require("dotenv").config();

// Configuração para Railway e outros ambientes cloud
const isProduction = process.env.NODE_ENV === "production";
const connectionString = process.env.DATABASE_URL;

// Verificar se deve usar SSL (padrão: false para compatibilidade)
// Defina DB_SSL=true apenas se o servidor PostgreSQL suportar SSL
const useSSL = process.env.DB_SSL === "true";

const pool = connectionString
  ? new Pool({
      connectionString: connectionString,
      ssl: useSSL
        ? {
            rejectUnauthorized: false, // Necessário para Railway e outros providers
          }
        : false,
    })
  : new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT || 5432,
      ssl: useSSL
        ? {
            rejectUnauthorized: false,
          }
        : false,
    });

// Testar conexão
pool.on("connect", () => {
  console.log("✅ Conectado ao PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Erro na conexão com PostgreSQL:", err);
});

module.exports = pool;
