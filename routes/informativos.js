const express = require("express");
const router = express.Router();
const pool = require("../config/database");

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
  console.log("🔍 Verificando admin em informativos...");
  console.log("Sessão completa:", JSON.stringify(req.session, null, 2));
  console.log("Usuário:", req.session.usuario);
  console.log("Admin?", req.session.usuario?.admin);

  if (!req.session.usuario) {
    console.log("❌ Sem sessão de usuário");
    return res.status(401).json({
      sucesso: false,
      mensagem: "Acesso não autorizado",
    });
  }

  if (!req.session.usuario.admin) {
    console.log("❌ Usuário não é admin");
    return res.status(403).json({
      sucesso: false,
      mensagem:
        "Acesso negado. Apenas administradores podem gerenciar informativos.",
    });
  }

  console.log("✅ Usuário é admin");
  next();
};

// Listar informativos válidos (todos os usuários)
router.get("/informativos", verificarAutenticacao, async (req, res) => {
  try {
    const query = `
      SELECT id, titulo, descricao, dta_validade
      FROM drfintra.informativos
      WHERE dta_validade IS NULL OR dta_validade >= CURRENT_DATE
      ORDER BY id DESC
    `;

    const result = await pool.query(query);

    res.json({
      sucesso: true,
      informativos: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar informativos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar informativos: " + error.message,
    });
  }
});

// Listar todos os informativos (admin) - DEVE VIR ANTES DE /:id
router.get("/informativos/todos", verificarAdmin, async (req, res) => {
  console.log("📋 Listando todos os informativos (admin)");
  try {
    const query = `
      SELECT id, titulo, descricao, dta_validade
      FROM drfintra.informativos
      ORDER BY id DESC
    `;

    const result = await pool.query(query);
    console.log(`✅ Encontrados ${result.rows.length} informativos`);

    res.json({
      sucesso: true,
      informativos: result.rows,
    });
  } catch (error) {
    console.error("❌ Erro ao listar informativos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar informativos: " + error.message,
    });
  }
});

// Buscar informativo específico (admin) - DEVE VIR DEPOIS DE /todos
router.get("/informativos/:id", verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT id, titulo, descricao, dta_validade
      FROM drfintra.informativos
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Informativo não encontrado",
      });
    }

    res.json({
      sucesso: true,
      informativo: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar informativo:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar informativo",
    });
  }
});

// Criar novo informativo (admin)
router.post("/informativos", verificarAdmin, async (req, res) => {
  console.log("📝 Recebendo requisição para criar informativo");
  console.log("Body:", req.body);

  const { titulo, descricao, dta_validade } = req.body;

  if (!titulo || !descricao) {
    console.log("❌ Validação falhou: título ou descrição vazios");
    return res.status(400).json({
      sucesso: false,
      mensagem: "Título e descrição são obrigatórios",
    });
  }

  try {
    console.log("✅ Inserindo no banco de dados...");
    const query = `
      INSERT INTO drfintra.informativos (titulo, descricao, dta_validade)
      VALUES ($1, $2, $3)
      RETURNING id, titulo, descricao, dta_validade
    `;

    const values = [titulo, descricao, dta_validade || null];
    console.log("Values:", values);

    const result = await pool.query(query, values);
    console.log("✅ Informativo criado:", result.rows[0]);

    res.status(201).json({
      sucesso: true,
      mensagem: "Informativo criado com sucesso",
      informativo: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Erro ao criar informativo:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar informativo: " + error.message,
    });
  }
});

// Atualizar informativo (admin)
router.put("/informativos/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, dta_validade } = req.body;

  if (!titulo || !descricao) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Título e descrição são obrigatórios",
    });
  }

  try {
    const checkQuery = "SELECT id FROM drfintra.informativos WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Informativo não encontrado",
      });
    }

    const query = `
      UPDATE drfintra.informativos
      SET titulo = $1, descricao = $2, dta_validade = $3
      WHERE id = $4
      RETURNING id, titulo, descricao, dta_validade
    `;

    const values = [titulo, descricao, dta_validade || null, id];

    const result = await pool.query(query, values);

    res.json({
      sucesso: true,
      mensagem: "Informativo atualizado com sucesso",
      informativo: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar informativo:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar informativo",
    });
  }
});

// Excluir informativo (admin)
router.delete("/informativos/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const checkQuery = "SELECT id FROM drfintra.informativos WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Informativo não encontrado",
      });
    }

    await pool.query("DELETE FROM drfintra.informativos WHERE id = $1", [id]);

    res.json({
      sucesso: true,
      mensagem: "Informativo excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir informativo:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir informativo",
    });
  }
});

module.exports = router;
