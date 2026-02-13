const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const https = require("https");

// Middleware para verificar autenticação
const verificarAutenticacao = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Acesso não autorizado",
    });
  }
  next();
};

// Middleware para verificar se é administrador
const verificarAdmin = (req, res, next) => {
  if (!req.session.usuario || !req.session.usuario.admin) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Acesso permitido apenas para administradores",
    });
  }
  next();
};

// Função para fazer requisições HTTPS à API do TRMM
function trmmRequest(apiUrl, apiKey, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(apiUrl);

    console.log(`🌐 Requisição TRMM: ${apiUrl}${path}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: path,
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      // Desabilitar verificação SSL (como no Python com verify=False)
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`✅ Status TRMM: ${res.statusCode}`);

        if (res.statusCode !== 200) {
          console.error(`❌ Erro HTTP ${res.statusCode}`);
          console.error(`📄 Resposta: ${data.substring(0, 300)}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const parsed = JSON.parse(data);
          console.log(
            `📦 Tipo: ${
              Array.isArray(parsed)
                ? "Array com " + parsed.length + " items"
                : typeof parsed
            }`
          );

          if (!Array.isArray(parsed) && typeof parsed === "object") {
            console.log(
              `📋 Chaves: ${Object.keys(parsed).slice(0, 5).join(", ")}`
            );
          }

          resolve(parsed);
        } catch (error) {
          console.error("❌ Erro ao parsear JSON:", error.message);
          console.error("📄 Início da resposta:", data.substring(0, 200));
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ Erro HTTPS:", error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Timeout na requisição"));
    });

    req.end();
  });
}

// GET - Listar todos os clientes TRMM
router.get("/clientes", verificarAutenticacao, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, cliente_nome, api_url, observacao, ativo, criado_em 
       FROM drfintra.intra_trmm 
       ORDER BY cliente_nome ASC`
    );

    res.json({
      sucesso: true,
      clientes: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Erro ao listar clientes TRMM:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar clientes",
      erro: error.message,
    });
  }
});

// GET - Buscar cliente específico por ID
router.get("/clientes/:id", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, cliente_nome, api_url, api_key, observacao, ativo 
       FROM drfintra.intra_trmm 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Cliente não encontrado",
      });
    }

    res.json({
      sucesso: true,
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar cliente TRMM:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar cliente",
      erro: error.message,
    });
  }
});

// POST - Criar novo cliente TRMM (apenas admin)
router.post("/clientes", verificarAdmin, async (req, res) => {
  try {
    const { cliente_nome, api_url, api_key, observacao } = req.body;

    if (!cliente_nome || !api_url || !api_key) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nome do cliente, URL da API e API Key são obrigatórios",
      });
    }

    // Verificar se cliente já existe
    const existente = await pool.query(
      "SELECT id FROM drfintra.intra_trmm WHERE cliente_nome = $1",
      [cliente_nome.trim()]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Cliente já cadastrado",
      });
    }

    // Inserir novo cliente
    const result = await pool.query(
      `INSERT INTO drfintra.intra_trmm (cliente_nome, api_url, api_key, observacao) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [cliente_nome.trim(), api_url.trim(), api_key.trim(), observacao || null]
    );

    console.log(
      "✅ Cliente TRMM criado:",
      cliente_nome,
      "ID:",
      result.rows[0].id
    );

    res.status(201).json({
      sucesso: true,
      mensagem: "Cliente cadastrado com sucesso",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("❌ Erro ao criar cliente TRMM:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar cliente",
      erro: error.message,
    });
  }
});

// PUT - Atualizar cliente TRMM (apenas admin)
router.put("/clientes/:id", verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_nome, api_url, api_key, observacao, ativo } = req.body;

    if (!cliente_nome || !api_url || !api_key) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nome do cliente, URL da API e API Key são obrigatórios",
      });
    }

    // Verificar se existe
    const existente = await pool.query(
      "SELECT id FROM drfintra.intra_trmm WHERE id = $1",
      [id]
    );

    if (existente.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Cliente não encontrado",
      });
    }

    // Atualizar
    await pool.query(
      `UPDATE drfintra.intra_trmm 
       SET cliente_nome = $1, api_url = $2, api_key = $3, observacao = $4, 
           ativo = $5, atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $6`,
      [
        cliente_nome.trim(),
        api_url.trim(),
        api_key.trim(),
        observacao || null,
        ativo !== undefined ? ativo : true,
        id,
      ]
    );

    console.log("✅ Cliente TRMM atualizado:", cliente_nome);

    res.json({
      sucesso: true,
      mensagem: "Cliente atualizado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar cliente TRMM:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar cliente",
      erro: error.message,
    });
  }
});

// DELETE - Excluir cliente TRMM (apenas admin)
router.delete("/clientes/:id", verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existente = await pool.query(
      "SELECT cliente_nome FROM drfintra.intra_trmm WHERE id = $1",
      [id]
    );

    if (existente.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Cliente não encontrado",
      });
    }

    await pool.query("DELETE FROM drfintra.intra_trmm WHERE id = $1", [id]);

    console.log("✅ Cliente TRMM excluído:", existente.rows[0].cliente_nome);

    res.json({
      sucesso: true,
      mensagem: "Cliente excluído com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao excluir cliente TRMM:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir cliente",
      erro: error.message,
    });
  }
});

// POST - Testar conexão com API TRMM
router.post("/testar/:id", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT api_url, api_key FROM drfintra.intra_trmm WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Cliente não encontrado",
      });
    }

    const { api_url, api_key } = result.rows[0];

    // Testar conexão com API
    const data = await trmmRequest(api_url, api_key, "/agents/?detail=false");

    if (Array.isArray(data)) {
      res.json({
        sucesso: true,
        mensagem: "Conexão estabelecida com sucesso",
        total_agents: data.length,
      });
    } else {
      res.json({
        sucesso: false,
        mensagem: "Resposta inválida da API",
      });
    }
  } catch (error) {
    console.error("❌ Erro ao testar API TRMM:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao conectar com API",
      erro: error.message,
    });
  }
});

// GET - Buscar agents do cliente TRMM
router.get("/clientes/:id/agents", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT api_url, api_key, cliente_nome FROM drfintra.intra_trmm WHERE id = $1 AND ativo = true",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Cliente não encontrado ou inativo",
      });
    }

    const { api_url, api_key, cliente_nome } = result.rows[0];

    console.log(`🔍 Buscando agents para cliente: ${cliente_nome}`);
    console.log(`📡 API URL: ${api_url}`);

    // Buscar agents sem detalhes (mais rápido)
    const agents = await trmmRequest(api_url, api_key, "/agents/?detail=false");

    console.log(
      `📊 Total de agents na API: ${Array.isArray(agents) ? agents.length : 0}`
    );

    if (!Array.isArray(agents)) {
      console.error(`❌ Resposta inválida da API:`, agents);
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao buscar agents - resposta inválida da API",
      });
    }

    if (agents.length > 0) {
      // Debug: mostrar campo client dos primeiros 3 agents
      console.log(
        `🔍 Primeiros 3 agents (campo client):`,
        agents.slice(0, 3).map((a) => ({
          hostname: a.hostname,
          client: a.client,
        }))
      );
    }

    // Filtrar apenas agents do cliente específico
    const agentsDoCliente = agents.filter(
      (a) => a.client && String(a.client).trim() === cliente_nome
    );

    console.log(
      `✅ Agents filtrados para "${cliente_nome}": ${agentsDoCliente.length}`
    );

    // Mapear agents sem buscar informações de disco (evitar erro 404)
    const agentsComDiscos = agentsDoCliente.map((a) => {
      // Determinar se há erro baseado em múltiplos indicadores
      const temErro =
        a.status === "offline" ||
        (a.last_seen && new Date() - new Date(a.last_seen) > 15 * 60 * 1000); // 15 minutos offline

      return {
        agent_id: a.agent_id,
        hostname: a.hostname,
        site_name: a.site_name,
        client_name: a.client || cliente_nome,
        monitoring_type: a.monitoring_type,
        plat: a.plat,
        status: a.status,
        last_seen: a.last_seen,
        version: a.version,
        operating_system: a.operating_system,
        disks: [],
        tem_erro: temErro,
        discos_criticos: 0,
        needs_reboot: a.needs_reboot || false,
        has_patches_pending: a.has_patches_pending || false,
        maintenance_mode: a.maintenance_mode || false,
      };
    });

    // Contar agents com erro
    const comErro = agentsComDiscos.filter((a) => a.tem_erro).length;
    const semErro = agentsComDiscos.length - comErro;

    res.json({
      sucesso: true,
      cliente: cliente_nome,
      agents: agentsComDiscos,
      total: agentsComDiscos.length,
      estatisticas: {
        com_erro: comErro,
        sem_erro: semErro,
        online: agentsComDiscos.filter((a) => a.status === "online").length,
        offline: agentsComDiscos.filter((a) => a.status === "offline").length,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar agents:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar agents",
      erro: error.message,
    });
  }
});

// POST - Importar clientes automaticamente da API TRMM
router.post("/importar", verificarAdmin, async (req, res) => {
  try {
    const { api_url, api_key } = req.body;

    if (!api_url || !api_key) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "URL da API e API Key são obrigatórios",
      });
    }

    console.log("🔄 Iniciando importação de clientes do TRMM...");
    console.log("📡 API URL:", api_url);

    // Buscar agents para extrair lista de clientes únicos
    const agents = await trmmRequest(api_url, api_key, "/agents/?detail=false");

    if (!Array.isArray(agents)) {
      console.error("❌ Resposta não é um array:", typeof agents);
      return res.status(500).json({
        sucesso: false,
        mensagem: "Resposta inválida da API - não foi possível buscar agents",
        detalhes:
          typeof agents === "object"
            ? JSON.stringify(agents).substring(0, 200)
            : String(agents).substring(0, 200),
      });
    }

    console.log(`📊 Total de agents encontrados: ${agents.length}`);

    // Extrair clientes únicos (não agents individuais)
    const clientesMap = new Map();

    agents.forEach((agent) => {
      if (agent.client && String(agent.client).trim()) {
        const clienteNome = String(agent.client).trim();
        if (!clientesMap.has(clienteNome)) {
          clientesMap.set(clienteNome, {
            nome: clienteNome,
            agents: [],
          });
        }
        clientesMap.get(clienteNome).agents.push({
          hostname: agent.hostname,
          site: agent.site_name,
          so: agent.operating_system,
        });
      }
    });

    console.log(`📊 Total de clientes únicos encontrados: ${clientesMap.size}`);

    let importados = 0;
    let erros = 0;
    let ja_existentes = 0;

    for (const [clienteNome, dadosCliente] of clientesMap) {
      try {
        // Verificar se já existe
        const existente = await pool.query(
          "SELECT id FROM drfintra.intra_trmm WHERE cliente_nome = $1",
          [clienteNome]
        );

        if (existente.rows.length > 0) {
          ja_existentes++;
          continue;
        }

        // Montar observação com lista de agents
        const agentsInfo = dadosCliente.agents
          .slice(0, 5)
          .map((a) => a.hostname || "sem hostname")
          .join(", ");

        const maisAgents =
          dadosCliente.agents.length > 5
            ? ` e mais ${dadosCliente.agents.length - 5} agent(s)`
            : "";

        const observacao = `Cliente importado automaticamente. Total de ${dadosCliente.agents.length} agent(s): ${agentsInfo}${maisAgents}`;

        // Inserir cliente
        await pool.query(
          `INSERT INTO drfintra.intra_trmm (cliente_nome, api_url, api_key, observacao) 
           VALUES ($1, $2, $3, $4)`,
          [clienteNome, api_url, api_key, observacao]
        );

        importados++;
        console.log(
          `✅ Cliente importado: ${clienteNome} (${dadosCliente.agents.length} agents)`
        );
      } catch (error) {
        erros++;
        console.error(
          `❌ Erro ao importar cliente ${clienteNome}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Importação concluída: ${importados} importados, ${ja_existentes} já existentes, ${erros} erros`
    );

    res.json({
      sucesso: true,
      mensagem: `Importação concluída com sucesso`,
      total: clientesMap.size,
      importados: importados,
      ja_existentes: ja_existentes,
      erros: erros,
    });
  } catch (error) {
    console.error("❌ Erro na importação:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao importar clientes",
      erro: error.message,
    });
  }
});

// Rota para acessar TRMM com autenticação automática
router.post("/acessar-trmm", verificarAutenticacao, async (req, res) => {
  try {
    // Buscar credenciais do usuário logado
    const usuarioQuery = await pool.query(
      "SELECT usuario_tac, senha_tac FROM drfintra.tab_usuario WHERE id = $1",
      [req.session.usuario.id]
    );

    if (usuarioQuery.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado",
      });
    }

    const { usuario_tac, senha_tac } = usuarioQuery.rows[0];

    if (!usuario_tac || !senha_tac) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Credenciais do Tactical RMM não configuradas. Entre em contato com o administrador.",
      });
    }

    const url = "https://remoto.digitalrf.com.br/";
    const urlObj = new URL(url);
    const authUrl = `${urlObj.protocol}//${usuario_tac}:${senha_tac}@${urlObj.host}${urlObj.pathname}`;

    res.json({
      sucesso: true,
      url: authUrl,
      mensagem: "Acesso autorizado ao Tactical RMM",
    });
  } catch (error) {
    console.error("❌ Erro ao gerar acesso TRMM:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao acessar Tactical RMM",
      erro: error.message,
    });
  }
});

// Rota para buscar credenciais do usuário logado
router.get("/credenciais-usuario", verificarAutenticacao, async (req, res) => {
  try {
    const usuarioQuery = await pool.query(
      "SELECT usuario_tac, senha_tac FROM drfintra.tab_usuario WHERE id = $1",
      [req.session.usuario.id]
    );

    if (usuarioQuery.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado",
      });
    }

    res.json({
      sucesso: true,
      usuario_tac: usuarioQuery.rows[0].usuario_tac,
      senha_tac: usuarioQuery.rows[0].senha_tac,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar credenciais:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar credenciais",
    });
  }
});

module.exports = router;
