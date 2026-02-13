const express = require("express");
const router = express.Router();
const https = require("https");
const FormData = require("form-data");
const pool = require("../config/database");

// Token da API TomTicket
const TOMTICKET_TOKEN = "2acb8e81ab2c592cfdd8bba16ee83003";
const TOMTICKET_API_URL = "api.tomticket.com";

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

// Função auxiliar para mapear prioridade numérica para texto
function getPriorityFromNumber(num) {
  const map = {
    1: "urgent",
    2: "high",
    3: "normal",
    4: "low",
  };
  return map[num] || "normal";
}

// Função auxiliar para fazer requisições à API do TomTicket v2.0
function tomticketRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TOMTICKET_API_URL,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOMTICKET_TOKEN}`,
      },
    };

    console.log("📡 Requisição TomTicket:", {
      method: options.method,
      url: `https://${options.hostname}${options.path}`,
      headers: options.headers,
    });

    const req = https.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        console.log("📥 Status da resposta:", res.statusCode);
        console.log("📥 Tamanho do corpo:", body.length);

        try {
          const response = JSON.parse(body);
          console.log("🔍 Tipo da resposta parseada:", typeof response);
          console.log("🔍 É array?:", Array.isArray(response));
          console.log(
            "🔍 Chaves do objeto:",
            Object.keys(response).slice(0, 10)
          );
          resolve(response);
        } catch (error) {
          console.error("❌ Erro ao parsear JSON:", error.message);
          resolve(body);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ Erro na requisição:", error.message);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Listar chamados
router.get("/tomticket/chamados", verificarAutenticacao, async (req, res) => {
  const startTime = Date.now();
  console.log("🚀 ========== REQUISIÇÃO DE CHAMADOS RECEBIDA ==========");

  try {
    console.log("📋 Listando chamados do TomTicket");
    console.log("🔑 Token:", TOMTICKET_TOKEN ? "Presente" : "Ausente");
    console.log("🌐 URL:", TOMTICKET_API_URL);

    try {
      const pagina = req.query.pagina || 1;

      // Filtrar chamados: excluir finalizados (5) e cancelados (4)
      // Situações: 0,1,2,3,6,7,8,9,10,11
      const situacoes = "0,1,2,3,6,7,8,9,10,11";

      const response = await tomticketRequest(
        `/v2.0/ticket/list?page=${pagina}&situation=${situacoes}`
      );
      console.log("✅ Resposta da API tipo:", typeof response);
      console.log("✅ É array?:", Array.isArray(response));
      console.log("✅ Tem items?:", !!(response && response.items));
      console.log(
        "✅ Items length:",
        response && response.items ? response.items.length : 0
      );

      // A API pode retornar diretamente um array ou um objeto com items/data
      let chamados = [];
      if (Array.isArray(response)) {
        chamados = response;
        console.log("📊 Response é array direto, total:", chamados.length);
      } else if (response && response.data && Array.isArray(response.data)) {
        chamados = response.data;
        console.log("📊 Response tem data, total:", chamados.length);
      } else if (response && response.items && Array.isArray(response.items)) {
        chamados = response.items;
        console.log("📊 Response tem items, total:", chamados.length);
      } else if (response && Array.isArray(response.chamados)) {
        chamados = response.chamados;
        console.log("📊 Response tem chamados, total:", chamados.length);
      } else {
        console.log("⚠️ Formato de response não reconhecido:", typeof response);
        console.log(
          "⚠️ Chaves disponíveis:",
          response ? Object.keys(response) : "null"
        );
      }

      console.log("📊 Chamados brutos:", chamados.length);

      // Mapear para formato esperado pelo frontend (API v2.0)
      const chamadosFormatados = chamados.map((c) => ({
        id: c.protocol,
        idchamado: c.id,
        subject: c.subject,
        description: c.message,
        status: c.situation?.description || "N/A",
        ultimasituacao: c.situation?.id || 0,
        priority: getPriorityFromNumber(c.priority),
        created_at: c.creation_date,
        requester_name: c.customer?.name || "N/A",
        requester_email: c.customer?.email || "N/A",
        atendente: c.operator?.name || "Não atribuído",
        departamento: c.department?.name || "N/A",
        categoria: c.category?.name || "N/A",
      }));

      console.log("✅ Chamados formatados:", chamadosFormatados.length);
      if (chamadosFormatados.length > 0) {
        console.log("📝 Exemplo do primeiro chamado:", {
          id: chamadosFormatados[0].id,
          subject: chamadosFormatados[0].subject,
        });
      }

      const resultado = {
        sucesso: true,
        chamados: chamadosFormatados,
        total: response.size || chamadosFormatados.length,
        paginas: response.pages || 1,
        paginaAtual: parseInt(pagina),
        proximaPagina: response.next_page,
        paginaAnterior: response.previous_page,
      };

      console.log(
        "📤 Enviando resposta com",
        resultado.chamados.length,
        "chamados de",
        resultado.total,
        "total,",
        resultado.paginas,
        "páginas"
      );
      res.json(resultado);
    } catch (apiError) {
      console.error("❌ Erro na API TomTicket:", apiError.message);

      // Retornar dados de exemplo para visualização
      res.json({
        sucesso: true,
        chamados: [
          {
            id: 1,
            subject: "Exemplo - Acesso ao sistema TomTicket",
            description:
              "Este é um chamado de exemplo. Configure a API do TomTicket para visualizar chamados reais.",
            status: "open",
            priority: "normal",
            created_at: new Date().toISOString(),
            requester_name: "Sistema",
          },
        ],
        aviso: "Dados de exemplo. Verifique a configuração da API TomTicket.",
      });
    }
  } catch (error) {
    console.error("❌ Erro ao listar chamados:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar chamados: " + error.message,
    });
  }
});

// Buscar chamado específico
router.get(
  "/tomticket/chamados/:id",
  verificarAutenticacao,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 Buscando chamado ${id}`);

      const response = await tomticketRequest(`/api/tickets/${id}.json`);

      res.json({
        sucesso: true,
        chamado: response,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar chamado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao buscar chamado: " + error.message,
      });
    }
  }
);

// Buscar departamentos disponíveis
router.get(
  "/tomticket/departamentos",
  verificarAutenticacao,
  async (req, res) => {
    try {
      console.log("📋 Buscando departamentos da API TomTicket");

      // Usar show_nested_items=0 para retornar apenas ID e nome dos departamentos
      const response = await tomticketRequest(
        "/v2.0/department/list?show_nested_items=0"
      );

      console.log("✅ Departamentos recebidos:", response.data?.length || 0);

      res.json({
        sucesso: true,
        departamentos: response.data || [],
      });
    } catch (error) {
      console.error("❌ Erro ao buscar departamentos:", error);

      // Fallback com departamentos padrão em caso de erro
      res.json({
        sucesso: true,
        departamentos: [
          { id: "177598", name: "Suporte" },
          { id: "177599", name: "Desenvolvimento" },
        ],
        mensagem: "Usando departamentos padrão devido a erro na API",
      });
    }
  }
);

// Buscar categorias disponíveis
router.get("/tomticket/categorias", verificarAutenticacao, async (req, res) => {
  try {
    const department_id = req.query.department_id;
    console.log("📋 Buscando categorias do departamento:", department_id);

    if (!department_id) {
      res.json({
        sucesso: true,
        categorias: [],
        mensagem: "Selecione um departamento para ver as categorias",
      });
      return;
    }

    // Buscar departamento completo para incluir campos personalizados
    const response = await tomticketRequest("/v2.0/department/list");
    const departamento = response.data?.find((d) => d.id === department_id);

    if (departamento) {
      console.log(
        "✅ Categorias encontradas:",
        departamento.categories?.length || 0
      );

      res.json({
        sucesso: true,
        categorias: departamento.categories || [],
        campos_personalizados:
          departamento.general_custom_fields?.tickets || [],
      });
    } else {
      res.json({
        sucesso: true,
        categorias: [],
        campos_personalizados: [],
      });
    }
  } catch (error) {
    console.error("❌ Erro ao buscar categorias:", error);
    res.json({
      sucesso: true,
      categorias: [],
      campos_personalizados: [],
      mensagem: "Erro ao buscar categorias: " + error.message,
    });
  }
});

// Cache de clientes em memória (voltando ao original por performance)
let clientesCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000, // 5 minutos
};

// Controle de sincronização
let sincronizacaoEmAndamento = false;
let ultimaSincronizacao = null;

// Função para buscar última sincronização do banco
async function buscarUltimaSincronizacao() {
  try {
    const result = await pool.query(
      "SELECT valor FROM drfintra.config WHERE chave = 'tomticket_ultima_sinc' LIMIT 1"
    );
    if (result.rows.length > 0 && result.rows[0].valor) {
      ultimaSincronizacao = new Date(result.rows[0].valor);
      console.log(
        `📅 Última sincronização TomTicket: ${ultimaSincronizacao.toLocaleString(
          "pt-BR"
        )}`
      );
    }
  } catch (error) {
    console.log("⚠️ Tabela config não existe ainda, criando...");
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS drfintra.config (
          chave VARCHAR(100) PRIMARY KEY,
          valor TEXT,
          atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Tabela config criada com sucesso");
    } catch (err) {
      console.error("❌ Erro ao criar tabela config:", err.message);
    }
  }
}

// Função para salvar última sincronização no banco
async function salvarUltimaSincronizacao() {
  try {
    await pool.query(
      `INSERT INTO drfintra.config (chave, valor, atualizado_em) 
       VALUES ('tomticket_ultima_sinc', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (chave) DO UPDATE 
       SET valor = $1, atualizado_em = CURRENT_TIMESTAMP`,
      [new Date().toISOString()]
    );
  } catch (error) {
    console.error("❌ Erro ao salvar última sincronização:", error.message);
  }
}

// Função para verificar se já sincronizou hoje
function precisaSincronizar() {
  if (!ultimaSincronizacao) {
    return true; // Primeira sincronização
  }

  const agora = new Date();
  const dataUltimaSinc = new Date(ultimaSincronizacao);

  // Verifica se a última sincronização foi em outro dia
  return (
    agora.getDate() !== dataUltimaSinc.getDate() ||
    agora.getMonth() !== dataUltimaSinc.getMonth() ||
    agora.getFullYear() !== dataUltimaSinc.getFullYear()
  );
}

// Função para sincronizar clientes da API para o banco de dados (em background)
async function sincronizarClientesBackground() {
  if (sincronizacaoEmAndamento) {
    console.log("⏸️ Sincronização já em andamento, pulando...");
    return;
  }

  // Verificar se precisa sincronizar hoje
  if (!precisaSincronizar()) {
    const proximaSinc = new Date(ultimaSincronizacao);
    proximaSinc.setDate(proximaSinc.getDate() + 1);
    proximaSinc.setHours(0, 0, 0, 0);

    console.log(
      `⏭️ Já sincronizado hoje. Próxima sincronização: ${proximaSinc.toLocaleString(
        "pt-BR"
      )}`
    );
    return;
  }

  sincronizacaoEmAndamento = true;
  console.log("🔄 Iniciando sincronização de clientes em background...");

  try {
    let paginaAtual = 1;
    let totalPaginas = 1;
    let clientesSincronizados = 0;

    while (paginaAtual <= totalPaginas) {
      console.log(`📄 Sincronizando página ${paginaAtual}/${totalPaginas}...`);

      const response = await tomticketRequest(
        `/v2.0/customer/list?page=${paginaAtual}&show_custom_fields=0`
      );

      if (response.error || !response.data) {
        console.error("❌ Erro na resposta da API:", response.message);
        break;
      }

      totalPaginas = response.pages || 1;
      const clientes = response.data || [];

      console.log("📊 =========================");
      console.log("📊 EXEMPLO DE CLIENTE DA API:");
      if (clientes.length > 0) {
        console.log(JSON.stringify(clientes[0], null, 2));
      }
      console.log("📊 =========================");

      // Inserir/atualizar clientes no banco em lotes
      for (const cliente of clientes) {
        try {
          console.log(`💾 Processando cliente: ${cliente.name}`);

          await pool.query(
            `
            INSERT INTO drfintra.tomticket_clientes 
              (tomticket_id, name, email, phone, monthly_ticket_quota, allow_create_tickets, 
               email_validated, active, account_approved, organization_id, 
               organization_name, updated_at, last_sync)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            ON CONFLICT (name, email) 
            DO UPDATE SET
              tomticket_id = EXCLUDED.tomticket_id,
              phone = EXCLUDED.phone,
              monthly_ticket_quota = EXCLUDED.monthly_ticket_quota,
              allow_create_tickets = EXCLUDED.allow_create_tickets,
              email_validated = EXCLUDED.email_validated,
              active = EXCLUDED.active,
              account_approved = EXCLUDED.account_approved,
              organization_id = EXCLUDED.organization_id,
              organization_name = EXCLUDED.organization_name,
              updated_at = NOW(),
              last_sync = NOW()
          `,
            [
              cliente.id || null,
              cliente.name,
              cliente.email,
              cliente.phone || null,
              cliente.monthly_ticket_quota || 0,
              cliente.allow_create_tickets !== false,
              cliente.email_validated || false,
              cliente.active !== false,
              cliente.account_approved !== false,
              cliente.organization?.id || null,
              cliente.organization?.name || null,
            ]
          );
          clientesSincronizados++;
        } catch (error) {
          console.error(
            `❌ Erro ao inserir cliente ${cliente.name}:`,
            error.message
          );
        }
      }

      // Pequena pausa entre páginas para não sobrecarregar
      if (paginaAtual < totalPaginas) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      paginaAtual++;
    }

    ultimaSincronizacao = new Date();
    await salvarUltimaSincronizacao(); // Salvar no banco
    console.log(
      `✅ Sincronização concluída: ${clientesSincronizados} clientes atualizados`
    );
  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
  } finally {
    sincronizacaoEmAndamento = false;
  }
}

// Buscar última sincronização ao iniciar o servidor
buscarUltimaSincronizacao().then(() => {
  console.log("✅ Controle de sincronização TomTicket inicializado");
});

// Iniciar sincronização automática (a cada 30 minutos)
setInterval(() => {
  sincronizarClientesBackground();
}, 30 * 60 * 1000);

// Sincronizar na inicialização (após 10 segundos)
setTimeout(() => {
  sincronizarClientesBackground();
}, 10000);

// Buscar clientes (busca otimizada no banco de dados)
router.get("/tomticket/clientes", verificarAutenticacao, async (req, res) => {
  try {
    const email = req.query.email;
    const search = req.query.search;

    console.log("👥 Buscando clientes no banco de dados");

    let query = "SELECT * FROM drfintra.tomticket_clientes WHERE active = true";
    const params = [];

    // Filtrar por email
    if (email) {
      query += " AND LOWER(email) = LOWER($1)";
      params.push(email);
    }
    // Filtrar por busca (nome, email ou ID)
    else if (search) {
      query +=
        " AND (LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR tomticket_id = $2 OR id::text = $2)";
      params.push(`%${search}%`, search);
    }

    query += " ORDER BY name LIMIT 100";

    const result = await pool.query(query, params);
    const clientes = result.rows.map((row) => ({
      id: row.tomticket_id || row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      monthly_ticket_quota: row.monthly_ticket_quota,
      allow_create_tickets: row.allow_create_tickets,
      email_validated: row.email_validated,
      active: row.active,
      account_approved: row.account_approved,
      organization: row.organization_id
        ? {
            id: row.organization_id,
            name: row.organization_name,
          }
        : null,
    }));

    console.log(`✅ ${clientes.length} clientes encontrados no banco`);
    if (clientes.length > 0 && search) {
      console.log(
        `🔍 Primeiro cliente encontrado para busca "${search}":`,
        clientes[0]
      );
    }

    res.json({
      sucesso: true,
      clientes: clientes,
      total: clientes.length,
      ultima_sincronizacao: ultimaSincronizacao,
      sincronizacao_em_andamento: sincronizacaoEmAndamento,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar clientes: " + error.message,
      clientes: [],
    });
  }
});

// Forçar sincronização manual de clientes
router.post(
  "/tomticket/sincronizar-clientes",
  verificarAutenticacao,
  async (req, res) => {
    if (sincronizacaoEmAndamento) {
      return res.json({
        sucesso: false,
        mensagem: "Sincronização já está em andamento",
        sincronizacao_em_andamento: true,
      });
    }

    // Iniciar sincronização em background
    sincronizarClientesBackground();

    res.json({
      sucesso: true,
      mensagem: "Sincronização iniciada em background",
      sincronizacao_em_andamento: true,
    });
  }
);

// Criar novo chamado
router.post("/tomticket/chamados", verificarAutenticacao, async (req, res) => {
  try {
    const {
      subject,
      description,
      priority,
      department_id,
      category_id,
      custom_fields,
      customer_id,
      customer_id_type,
    } = req.body;

    console.log("📝 Criando novo chamado");
    console.log("Dados recebidos:", {
      subject,
      description,
      priority,
      department_id,
      category_id,
      custom_fields,
      customer_id,
      customer_id_type,
    });

    let finalCustomerId = customer_id;
    let finalCustomerIdType = customer_id_type;

    // Se não foi fornecido um cliente específico, usar o usuário da sessão
    if (!finalCustomerId) {
      const customer_email =
        req.session.usuario?.email || "suporte@digitalrf.com.br";

      // Verificar se já temos o cliente em cache na sessão
      if (
        req.session.tomticket_customer_cache &&
        req.session.tomticket_customer_cache.email === customer_email
      ) {
        finalCustomerId = req.session.tomticket_customer_cache.id;
        finalCustomerIdType = req.session.tomticket_customer_cache.type;
        console.log("✅ Usando cliente do cache:", finalCustomerId);
      } else {
        // Usar email diretamente (mais rápido) - API aceita email
        finalCustomerId = customer_email;
        finalCustomerIdType = "E"; // E = email
        console.log("✅ Usando email do usuário:", customer_email);

        // Armazenar em cache para próximas requisições
        req.session.tomticket_customer_cache = {
          email: customer_email,
          id: customer_email,
          type: "E",
        };
      }
    } else {
      console.log("✅ Usando cliente fornecido - ID:", finalCustomerId);
    }

    // Mapear prioridade para número
    const priorityMap = {
      low: 1,
      normal: 2,
      high: 3,
      urgent: 4,
    };

    const priorityNumber = priorityMap[priority] || 2;

    // Preparar dados para FormData
    const formData = new FormData();

    console.log("📤 DADOS SENDO ENVIADOS PARA API TOMTICKET:");
    console.log("   customer_id:", finalCustomerId);
    console.log("   customer_id_type:", finalCustomerIdType, "(Email)");
    console.log("   department_id:", department_id || "1");
    console.log("   subject:", subject);
    console.log("   priority:", priorityNumber);

    formData.append("customer_id", finalCustomerId);
    formData.append("customer_id_type", finalCustomerIdType);
    formData.append("department_id", department_id || "1");
    formData.append("subject", subject);
    formData.append("message", description);
    formData.append("priority", priorityNumber);

    if (category_id) {
      formData.append("category_id", category_id);
    }

    // Adicionar campos personalizados
    if (custom_fields && typeof custom_fields === "object") {
      console.log("   📋 Campos personalizados:");
      for (const [fieldId, value] of Object.entries(custom_fields)) {
        // Se o campo estiver vazio, usar "N/A" como padrão
        const finalValue = value && value.trim() !== "" ? value : "N/A";
        console.log(`      - custom_field[${fieldId}] = ${finalValue}`);
        formData.append(`custom_field[${fieldId}]`, finalValue);
      }
    }

    // Fazer requisição com FormData
    const options = {
      hostname: TOMTICKET_API_URL,
      path: "/v2.0/ticket/new",
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOMTICKET_TOKEN}`,
        ...formData.getHeaders(),
      },
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (data.error) {
              reject(new Error(data.message || "Erro ao criar chamado"));
            } else {
              resolve(data);
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      formData.pipe(req);
    });

    console.log("✅ Chamado criado com sucesso:", response);

    res.status(201).json({
      sucesso: true,
      mensagem: "Chamado criado com sucesso",
      chamado: response,
    });
  } catch (error) {
    console.error("❌ Erro ao criar chamado:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar chamado: " + error.message,
    });
  }
});

// Adicionar resposta ao chamado
router.post(
  "/tomticket/chamados/:id/resposta",
  verificarAutenticacao,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      console.log(`💬 Adicionando resposta ao chamado ${id}`);

      const data = {
        body: message,
      };

      const response = await tomticketRequest(
        `/api/tickets/${id}/messages.json`,
        "POST",
        data
      );

      res.json({
        sucesso: true,
        mensagem: "Resposta adicionada com sucesso",
        resposta: response,
      });
    } catch (error) {
      console.error("❌ Erro ao adicionar resposta:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao adicionar resposta: " + error.message,
      });
    }
  }
);

// Atualizar status do chamado
router.put(
  "/tomticket/chamados/:id/status",
  verificarAutenticacao,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      console.log(`🔄 Atualizando status do chamado ${id} para ${status}`);

      const data = {
        status,
      };

      const response = await tomticketRequest(
        `/api/tickets/${id}.json`,
        "PUT",
        data
      );

      res.json({
        sucesso: true,
        mensagem: "Status atualizado com sucesso",
        chamado: response,
      });
    } catch (error) {
      console.error("❌ Erro ao atualizar status:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao atualizar status: " + error.message,
      });
    }
  }
);

// Listar prioridades
router.get(
  "/tomticket/prioridades",
  verificarAutenticacao,
  async (req, res) => {
    try {
      const prioridades = [
        { id: "low", nome: "Baixa" },
        { id: "normal", nome: "Normal" },
        { id: "high", nome: "Alta" },
        { id: "urgent", nome: "Urgente" },
      ];

      res.json({
        sucesso: true,
        prioridades: prioridades,
      });
    } catch (error) {
      console.error("❌ Erro ao listar prioridades:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao listar prioridades: " + error.message,
      });
    }
  }
);

// Sincronização automática desabilitada para melhor performance
// Os clientes serão sincronizados apenas quando necessário (primeira busca)

module.exports = router;
