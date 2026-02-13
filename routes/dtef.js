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
  if (!req.session.usuario || !req.session.usuario.admin) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Acesso permitido apenas para administradores",
    });
  }
  next();
};

// GET - Buscar senhas DTEF (com filtro opcional)
router.get("/senhas", verificarAutenticacao, async (req, res) => {
  try {
    const { search } = req.query;

    let query = "SELECT cnpj, loja, pass FROM drfintra.intra_dtef";
    let params = [];

    if (search && search.trim() !== "") {
      query += ` WHERE cnpj LIKE $1 OR LOWER(loja) LIKE $1`;
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    query += " ORDER BY loja ASC";

    const result = await pool.query(query, params);

    res.json({
      sucesso: true,
      senhas: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar senhas DTEF:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar senhas DTEF",
      erro: error.message,
    });
  }
});

// GET - Buscar senha específica por CNPJ
router.get("/senhas/:cnpj", verificarAutenticacao, async (req, res) => {
  try {
    const { cnpj } = req.params;

    const result = await pool.query(
      "SELECT cnpj, loja, pass FROM drfintra.intra_dtef WHERE cnpj = $1",
      [cnpj]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Senha DTEF não encontrada",
      });
    }

    res.json({
      sucesso: true,
      senha: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar senha DTEF:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar senha DTEF",
      erro: error.message,
    });
  }
});

// POST - Criar nova senha DTEF (apenas admin)
router.post("/senhas", verificarAdmin, async (req, res) => {
  try {
    const { cnpj, loja, pass } = req.body;

    // Validações
    if (!cnpj || cnpj.trim() === "") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "CNPJ é obrigatório",
      });
    }

    if (!pass || pass.trim() === "") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Senha é obrigatória",
      });
    }

    // Verificar se CNPJ já existe
    const existente = await pool.query(
      "SELECT cnpj FROM drfintra.intra_dtef WHERE cnpj = $1",
      [cnpj.trim()]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "CNPJ já cadastrado",
      });
    }

    // Inserir nova senha
    await pool.query(
      "INSERT INTO drfintra.intra_dtef (cnpj, loja, pass) VALUES ($1, $2, $3)",
      [cnpj.trim(), loja ? loja.trim() : null, pass.trim()]
    );

    console.log("✅ Senha DTEF criada:", cnpj);

    res.status(201).json({
      sucesso: true,
      mensagem: "Senha DTEF cadastrada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao criar senha DTEF:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar senha DTEF",
      erro: error.message,
    });
  }
});

// PUT - Atualizar senha DTEF (apenas admin)
router.put("/senhas/:cnpj", verificarAdmin, async (req, res) => {
  try {
    const { cnpj } = req.params;
    const { loja, pass } = req.body;

    // Validações
    if (!pass || pass.trim() === "") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Senha é obrigatória",
      });
    }

    // Verificar se existe
    const existente = await pool.query(
      "SELECT cnpj FROM drfintra.intra_dtef WHERE cnpj = $1",
      [cnpj]
    );

    if (existente.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Senha DTEF não encontrada",
      });
    }

    // Atualizar
    await pool.query(
      "UPDATE drfintra.intra_dtef SET loja = $1, pass = $2 WHERE cnpj = $3",
      [loja ? loja.trim() : null, pass.trim(), cnpj]
    );

    console.log("✅ Senha DTEF atualizada:", cnpj);

    res.json({
      sucesso: true,
      mensagem: "Senha DTEF atualizada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar senha DTEF:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar senha DTEF",
      erro: error.message,
    });
  }
});

// DELETE - Excluir senha DTEF (apenas admin)
router.delete("/senhas/:cnpj", verificarAdmin, async (req, res) => {
  try {
    const { cnpj } = req.params;

    // Verificar se existe
    const existente = await pool.query(
      "SELECT cnpj FROM drfintra.intra_dtef WHERE cnpj = $1",
      [cnpj]
    );

    if (existente.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Senha DTEF não encontrada",
      });
    }

    // Excluir
    await pool.query("DELETE FROM drfintra.intra_dtef WHERE cnpj = $1", [cnpj]);

    console.log("✅ Senha DTEF excluída:", cnpj);

    res.json({
      sucesso: true,
      mensagem: "Senha DTEF excluída com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao excluir senha DTEF:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir senha DTEF",
      erro: error.message,
    });
  }
});

module.exports = router;
