const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Middleware para verificar se está logado
const verificarAutenticacao = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Acesso não autorizado",
    });
  }
  next();
};

// Buscar lista de usuários para o select de analistas
router.get("/plantao/usuarios", verificarAutenticacao, async (req, res) => {
  try {
    const query = `
      SELECT nom_usuario
      FROM drfintra.tab_usuario
      WHERE ind_ativo = 'S'
      ORDER BY nom_usuario
    `;

    const result = await pool.query(query);

    res.json({
      sucesso: true,
      usuarios: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar usuários",
    });
  }
});

// Listar todos os plantões
router.get("/plantao", verificarAutenticacao, async (req, res) => {
  try {
    const { dataInicio, dataFim, mostrarFinalizados } = req.query;

    let query = `
      SELECT id, dtainicio, dtafinal, analista, dia_semana, observacao, ind_finalizado
      FROM drfintra.tab_plantao
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filtro de período
    if (dataInicio) {
      query += ` AND dtainicio >= $${paramCount++}`;
      params.push(dataInicio);
    }

    if (dataFim) {
      query += ` AND dtafinal <= $${paramCount++}`;
      params.push(dataFim);
    }

    // Filtro de finalizados
    if (mostrarFinalizados !== "true") {
      query += ` AND (ind_finalizado IS NULL OR ind_finalizado = 'N')`;
    }

    query += ` ORDER BY dtainicio DESC`;

    const result = await pool.query(query, params);

    res.json({
      sucesso: true,
      plantoes: result.rows,
      admin: req.session.usuario.admin || false,
    });
  } catch (error) {
    console.error("Erro ao listar plantões:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar plantões",
    });
  }
});

// Buscar um plantão específico
router.get("/plantao/:id", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT id, dtainicio, dtafinal, analista, dia_semana, observacao, ind_finalizado
      FROM drfintra.tab_plantao
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Plantão não encontrado",
      });
    }

    res.json({
      sucesso: true,
      plantao: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar plantão:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar plantão",
    });
  }
});

// Criar novo plantão (apenas admin)
router.post("/plantao", verificarAutenticacao, async (req, res) => {
  if (!req.session.usuario.admin) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Apenas administradores podem criar plantões",
    });
  }

  const {
    dtainicio,
    dtafinal,
    analista,
    dia_semana,
    observacao,
    ind_finalizado,
  } = req.body;

  // Validações
  if (!dtainicio || !dtafinal || !analista) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Data início, data final e analista são obrigatórios",
    });
  }

  try {
    const query = `
      INSERT INTO drfintra.tab_plantao 
      (dtainicio, dtafinal, analista, dia_semana, observacao, ind_finalizado)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, dtainicio, dtafinal, analista, dia_semana, observacao, ind_finalizado
    `;

    const values = [
      dtainicio,
      dtafinal,
      analista,
      dia_semana || null,
      observacao || null,
      ind_finalizado || "N",
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      sucesso: true,
      mensagem: "Plantão criado com sucesso",
      plantao: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar plantão:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar plantão",
    });
  }
});

// Atualizar plantão (apenas admin)
router.put("/plantao/:id", verificarAutenticacao, async (req, res) => {
  if (!req.session.usuario.admin) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Apenas administradores podem editar plantões",
    });
  }

  const { id } = req.params;
  const {
    dtainicio,
    dtafinal,
    analista,
    dia_semana,
    observacao,
    ind_finalizado,
  } = req.body;

  try {
    // Verificar se plantão existe
    const checkPlantao = await pool.query(
      "SELECT id FROM drfintra.tab_plantao WHERE id = $1",
      [id]
    );

    if (checkPlantao.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Plantão não encontrado",
      });
    }

    // Construir query de update dinamicamente
    let updates = [];
    let values = [];
    let paramCount = 1;

    if (dtainicio !== undefined) {
      updates.push(`dtainicio = $${paramCount++}`);
      values.push(dtainicio);
    }

    if (dtafinal !== undefined) {
      updates.push(`dtafinal = $${paramCount++}`);
      values.push(dtafinal);
    }

    if (analista !== undefined) {
      updates.push(`analista = $${paramCount++}`);
      values.push(analista);
    }

    if (dia_semana !== undefined) {
      updates.push(`dia_semana = $${paramCount++}`);
      values.push(dia_semana);
    }

    if (observacao !== undefined) {
      updates.push(`observacao = $${paramCount++}`);
      values.push(observacao);
    }

    if (ind_finalizado !== undefined) {
      updates.push(`ind_finalizado = $${paramCount++}`);
      values.push(ind_finalizado);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nenhum campo para atualizar",
      });
    }

    values.push(id);

    const query = `
      UPDATE drfintra.tab_plantao 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, dtainicio, dtafinal, analista, dia_semana, observacao, ind_finalizado
    `;

    const result = await pool.query(query, values);

    res.json({
      sucesso: true,
      mensagem: "Plantão atualizado com sucesso",
      plantao: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar plantão:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar plantão",
    });
  }
});

// Excluir plantão (apenas admin)
router.delete("/plantao/:id", verificarAutenticacao, async (req, res) => {
  if (!req.session.usuario.admin) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Apenas administradores podem excluir plantões",
    });
  }

  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM drfintra.tab_plantao WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Plantão não encontrado",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Plantão excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir plantão:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir plantão",
    });
  }
});

module.exports = router;
