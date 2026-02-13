const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const multer = require("multer");

// Configurar multer para upload de imagens em memória
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

// Middleware para verificar autenticação
function verificarAutenticacao(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ sucesso: false, mensagem: "Não autenticado" });
  }
  next();
}

// Listar todas as mensagens
router.get("/", verificarAutenticacao, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        m.id,
        m.username,
        m.mensagem,
        m.imagem IS NOT NULL as tem_imagem,
        m.dta_hota as created_at,
        m.dta_hota as updated_at,
        u.id as usuario_id,
        CASE WHEN u.foto_perfil IS NOT NULL THEN true ELSE false END as foto_perfil
      FROM drfintra.tab_mensagem m
      LEFT JOIN drfintra.tab_usuario u ON m.username = u.nom_usuario
      ORDER BY m.dta_hota DESC`
    );

    res.json({
      sucesso: true,
      mensagens: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar mensagens:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao carregar mensagens",
    });
  }
});

// Buscar imagem de uma mensagem
router.get("/:id/imagem", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT imagem FROM drfintra.tab_mensagem WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].imagem) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Imagem não encontrada",
      });
    }

    // Enviar a imagem como resposta
    res.set("Content-Type", "image/jpeg");
    res.send(result.rows[0].imagem);
  } catch (error) {
    console.error("Erro ao buscar imagem:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao carregar imagem",
    });
  }
});

// Criar nova mensagem
router.post("/", verificarAutenticacao, upload.single("imagem"), async (req, res) => {
  try {
    const { mensagem } = req.body;
    const username = req.session.usuario.nome;
    const imagem = req.file ? req.file.buffer : null;

    if (!mensagem && !imagem) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Mensagem ou imagem é obrigatória",
      });
    }

    const result = await pool.query(
      `INSERT INTO drfintra.tab_mensagem
        (username, mensagem, imagem, dta_hota)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, username, mensagem, imagem IS NOT NULL as tem_imagem, dta_hota as created_at, dta_hota as updated_at`,
      [username, mensagem || "", imagem]
    );

    res.json({
      sucesso: true,
      mensagem: "Mensagem enviada com sucesso!",
      dados: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar mensagem:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao enviar mensagem",
    });
  }
});

// Editar mensagem
router.put("/:id", verificarAutenticacao, upload.single("imagem"), async (req, res) => {
  try {
    const { id } = req.params;
    const { mensagem, remover_imagem } = req.body;
    const username = req.session.usuario.nome;

    // Verificar se a mensagem existe e pertence ao usuário
    const mensagemExistente = await pool.query(
      "SELECT username FROM drfintra.tab_mensagem WHERE id = $1",
      [id]
    );

    if (mensagemExistente.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Mensagem não encontrada",
      });
    }

    if (mensagemExistente.rows[0].username !== username) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Você não tem permissão para editar esta mensagem",
      });
    }

    let query;
    let params;

    if (req.file) {
      // Atualizar mensagem e imagem
      query = `UPDATE drfintra.tab_mensagem
               SET mensagem = $1, imagem = $2, dta_hota = NOW()
               WHERE id = $3
               RETURNING id, username, mensagem, imagem IS NOT NULL as tem_imagem, dta_hota as created_at, dta_hota as updated_at`;
      params = [mensagem || "", req.file.buffer, id];
    } else if (remover_imagem === "true") {
      // Remover imagem
      query = `UPDATE drfintra.tab_mensagem
               SET mensagem = $1, imagem = NULL, dta_hota = NOW()
               WHERE id = $2
               RETURNING id, username, mensagem, imagem IS NOT NULL as tem_imagem, dta_hota as created_at, dta_hota as updated_at`;
      params = [mensagem || "", id];
    } else {
      // Apenas atualizar texto
      query = `UPDATE drfintra.tab_mensagem
               SET mensagem = $1, dta_hota = NOW()
               WHERE id = $2
               RETURNING id, username, mensagem, imagem IS NOT NULL as tem_imagem, dta_hota as created_at, dta_hota as updated_at`;
      params = [mensagem || "", id];
    }

    const result = await pool.query(query, params);

    res.json({
      sucesso: true,
      mensagem: "Mensagem atualizada com sucesso!",
      dados: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao editar mensagem:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar mensagem",
    });
  }
});

// Deletar mensagem
router.delete("/:id", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.session.usuario.nome;
    const isAdmin = req.session.usuario.admin;

    // Verificar se a mensagem existe
    const mensagemExistente = await pool.query(
      "SELECT username FROM drfintra.tab_mensagem WHERE id = $1",
      [id]
    );

    if (mensagemExistente.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Mensagem não encontrada",
      });
    }

    // Verificar permissão: admin pode deletar qualquer uma, usuário só a sua
    const mensagemUsername = mensagemExistente.rows[0].username;
    if (!isAdmin && mensagemUsername !== username) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Você não tem permissão para excluir esta mensagem",
      });
    }

    await pool.query(
      "DELETE FROM drfintra.tab_mensagem WHERE id = $1",
      [id]
    );

    res.json({
      sucesso: true,
      mensagem: "Mensagem excluída com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao deletar mensagem:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir mensagem",
    });
  }
});

module.exports = router;
