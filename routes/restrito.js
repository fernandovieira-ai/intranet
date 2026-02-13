const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const crypto = require("crypto");

// Chave e algoritmo para criptografia
const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "12345678901234567890123456789012";
const IV_LENGTH = 16;

// Função para criptografar
function criptografar(texto) {
  if (!texto) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(texto, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Função para descriptografar
function descriptografar(textoEncriptado) {
  if (!textoEncriptado) return null;
  try {
    const parts = textoEncriptado.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Erro ao descriptografar:", error);
    return null;
  }
}

// ===================== PROJETOS =====================

// Listar todos os projetos únicos
router.get("/restrito/projetos", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT des_projeto 
       FROM drfintra.tab_restrito 
       WHERE des_projeto IS NOT NULL 
       ORDER BY des_projeto`
    );

    res.json({
      sucesso: true,
      projetos: result.rows.map((r) => r.des_projeto),
    });
  } catch (error) {
    console.error("Erro ao listar projetos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar projetos",
    });
  }
});

// Criar novo projeto (apenas cria o registro com des_projeto)
router.post("/restrito/projetos", async (req, res) => {
  const { des_projeto } = req.body;

  if (!des_projeto) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Nome do projeto é obrigatório",
    });
  }

  try {
    // Verifica se já existe
    const existe = await pool.query(
      "SELECT id FROM drfintra.tab_restrito WHERE des_projeto = $1 LIMIT 1",
      [des_projeto]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Projeto já existe",
      });
    }

    // Cria registro inicial
    await pool.query(
      "INSERT INTO drfintra.tab_restrito (des_projeto) VALUES ($1)",
      [des_projeto]
    );

    res.json({
      sucesso: true,
      mensagem: "Projeto criado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar projeto",
    });
  }
});

// Renomear projeto
router.put("/restrito/projetos/:nomeAntigo", async (req, res) => {
  const { nomeAntigo } = req.params;
  const { des_projeto } = req.body;

  if (!des_projeto) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Novo nome do projeto é obrigatório",
    });
  }

  try {
    // Atualiza todos os registros do projeto
    const result = await pool.query(
      "UPDATE drfintra.tab_restrito SET des_projeto = $1 WHERE des_projeto = $2",
      [des_projeto, nomeAntigo]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Projeto renomeado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao renomear projeto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao renomear projeto",
    });
  }
});

// Excluir projeto (e todos seus itens)
router.delete("/restrito/projetos/:nome", async (req, res) => {
  const { nome } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM drfintra.tab_restrito WHERE des_projeto = $1",
      [nome]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Projeto excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir projeto",
    });
  }
});

// ===================== ITENS DO PROJETO =====================

// Listar itens de um projeto
router.get("/restrito/projetos/:nome/itens", async (req, res) => {
  const { nome } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, des_funcao, des_complemento, des_link 
       FROM drfintra.tab_restrito 
       WHERE des_projeto = $1 AND des_funcao IS NOT NULL
       ORDER BY id`,
      [nome]
    );

    // Descriptografa os complementos antes de enviar
    const itens = result.rows.map((item) => ({
      ...item,
      des_complemento: descriptografar(item.des_complemento),
    }));

    res.json({
      sucesso: true,
      itens,
    });
  } catch (error) {
    console.error("Erro ao listar itens:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar itens",
    });
  }
});

// Criar item no projeto
router.post("/restrito/projetos/:nome/itens", async (req, res) => {
  const { nome } = req.params;
  const { des_funcao, des_complemento, des_link } = req.body;

  if (!des_funcao) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Descrição da função é obrigatória",
    });
  }

  try {
    // Criptografa o complemento (senha)
    const complementoCriptografado = des_complemento
      ? criptografar(des_complemento)
      : null;

    await pool.query(
      `INSERT INTO drfintra.tab_restrito 
       (des_projeto, des_funcao, des_complemento, des_link) 
       VALUES ($1, $2, $3, $4)`,
      [nome, des_funcao, complementoCriptografado, des_link || null]
    );

    res.json({
      sucesso: true,
      mensagem: "Item adicionado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar item",
    });
  }
});

// Editar item
router.put("/restrito/itens/:id", async (req, res) => {
  const { id } = req.params;
  const { des_funcao, des_complemento, des_link } = req.body;

  if (!des_funcao) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Descrição da função é obrigatória",
    });
  }

  try {
    // Criptografa o complemento (senha)
    const complementoCriptografado = des_complemento
      ? criptografar(des_complemento)
      : null;

    const result = await pool.query(
      `UPDATE drfintra.tab_restrito 
       SET des_funcao = $1, des_complemento = $2, des_link = $3 
       WHERE id = $4`,
      [des_funcao, complementoCriptografado, des_link || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Item não encontrado",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Item atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao editar item:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao editar item",
    });
  }
});

// Excluir item
router.delete("/restrito/itens/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM drfintra.tab_restrito WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Item não encontrado",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Item excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir item:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir item",
    });
  }
});

module.exports = router;
