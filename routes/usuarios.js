const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
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
  console.log("🔍 Verificando permissão de admin...");
  console.log("Sessão:", req.session);
  console.log("Usuário:", req.session.usuario);

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
        "Acesso negado. Apenas administradores podem gerenciar usuários.",
    });
  }

  console.log("✅ Usuário é admin, liberando acesso");
  next();
};

// Buscar perfil do usuário logado
router.get("/usuarios/meu-perfil", verificarAutenticacao, async (req, res) => {
  try {
    const query = `
            SELECT id, nom_usuario, email, fone, chave_pix, usuario_tac, senha_tac, 
                   CASE WHEN foto_perfil IS NOT NULL THEN true ELSE false END as foto_perfil,
                   ind_bloqueado, ind_ativo, ind_adm
            FROM drfintra.tab_usuario
            WHERE id = $1
        `;

    const result = await pool.query(query, [req.session.usuario.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado",
      });
    }

    res.json({
      sucesso: true,
      usuario: result.rows[0],
      isAdmin: req.session.usuario.admin,
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar perfil",
    });
  }
});

// Listar todos os usuários (apenas admin)
router.get("/usuarios", verificarAdmin, async (req, res) => {
  try {
    const query = `
            SELECT id, nom_usuario, email, fone, chave_pix, usuario_tac, senha_tac, 
                   CASE WHEN foto_perfil IS NOT NULL THEN true ELSE false END as foto_perfil,
                   ind_bloqueado, ind_ativo, ind_adm, ultimo_acesso
            FROM drfintra.tab_usuario
            ORDER BY nom_usuario
        `;

    const result = await pool.query(query);

    res.json({
      sucesso: true,
      usuarios: result.rows,
      isAdmin: true,
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar usuários",
    });
  }
});

// Buscar um usuário específico
router.get("/usuarios/:id", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.session.usuario.admin;
    const isSelf = parseInt(id) === req.session.usuario.id;

    // Usuários não-admin só podem ver seu próprio perfil
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Você só pode visualizar seu próprio perfil",
      });
    }

    const query = `
            SELECT id, nom_usuario, email, fone, chave_pix, usuario_tac, senha_tac, 
                   CASE WHEN foto_perfil IS NOT NULL THEN true ELSE false END as foto_perfil,
                   ind_bloqueado, ind_ativo, ind_adm
            FROM drfintra.tab_usuario
            WHERE id = $1
        `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado",
      });
    }

    res.json({
      sucesso: true,
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar usuário",
    });
  }
});

// Criar novo usuário
router.post("/usuarios", verificarAdmin, async (req, res) => {
  const {
    nom_usuario,
    senha,
    email,
    fone,
    chave_pix,
    usuario_tac,
    senha_tac,
    ind_bloqueado,
    ind_ativo,
    ind_adm,
  } = req.body;

  // Validações
  if (!nom_usuario || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Usuário e senha são obrigatórios",
    });
  }

  if (nom_usuario.length > 20) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Nome de usuário deve ter no máximo 20 caracteres",
    });
  }

  try {
    // Verificar se usuário já existe
    const checkUser = await pool.query(
      "SELECT id FROM drfintra.tab_usuario WHERE nom_usuario = $1",
      [nom_usuario]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nome de usuário já existe",
      });
    }

    // Gerar hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir usuário
    const query = `
            INSERT INTO drfintra.tab_usuario 
            (nom_usuario, senha, email, fone, chave_pix, usuario_tac, senha_tac, foto_perfil, ind_bloqueado, ind_ativo, ind_adm)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, nom_usuario, email, fone, chave_pix, usuario_tac, senha_tac, foto_perfil, ind_bloqueado, ind_ativo, ind_adm
        `;

    const values = [
      nom_usuario,
      senhaHash,
      email || null,
      fone || null,
      chave_pix || null,
      usuario_tac || null,
      senha_tac || null,
      null, // foto_perfil
      ind_bloqueado || "N",
      ind_ativo || "S",
      ind_adm || "N",
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      sucesso: true,
      mensagem: "Usuário criado com sucesso",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar usuário",
    });
  }
});

// Atualizar usuário
router.put("/usuarios/:id", verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  const {
    nom_usuario,
    senha,
    email,
    fone,
    chave_pix,
    usuario_tac,
    senha_tac,
    foto_perfil,
    ind_bloqueado,
    ind_ativo,
    ind_adm,
  } = req.body;

  const isAdmin = req.session.usuario.admin;
  const isSelf = parseInt(id) === req.session.usuario.id;

  // Usuários não-admin só podem editar seu próprio perfil
  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Você só pode editar seu próprio perfil",
    });
  }

  try {
    // Verificar se usuário existe
    const checkUser = await pool.query(
      "SELECT id FROM drfintra.tab_usuario WHERE id = $1",
      [id]
    );

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado",
      });
    }

    // Verificar se o nome de usuário já existe em outro registro
    if (nom_usuario) {
      const checkNome = await pool.query(
        "SELECT id FROM drfintra.tab_usuario WHERE nom_usuario = $1 AND id != $2",
        [nom_usuario, id]
      );

      if (checkNome.rows.length > 0) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Nome de usuário já existe",
        });
      }
    }

    // Construir query de update dinamicamente
    let updates = [];
    let values = [];
    let paramCount = 1;

    if (nom_usuario) {
      updates.push(`nom_usuario = $${paramCount++}`);
      values.push(nom_usuario);
    }

    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      updates.push(`senha = $${paramCount++}`);
      values.push(senhaHash);
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (fone !== undefined) {
      updates.push(`fone = $${paramCount++}`);
      values.push(fone);
    }

    if (chave_pix !== undefined) {
      updates.push(`chave_pix = $${paramCount++}`);
      values.push(chave_pix);
    }

    if (usuario_tac !== undefined) {
      updates.push(`usuario_tac = $${paramCount++}`);
      values.push(usuario_tac);
    }

    if (senha_tac !== undefined) {
      updates.push(`senha_tac = $${paramCount++}`);
      values.push(senha_tac);
    }

    if (foto_perfil !== undefined) {
      updates.push(`foto_perfil = $${paramCount++}`);
      values.push(foto_perfil);
    }

    // Apenas admin pode alterar campos administrativos
    if (isAdmin) {
      if (ind_bloqueado) {
        updates.push(`ind_bloqueado = $${paramCount++}`);
        values.push(ind_bloqueado);
      }

      if (ind_ativo) {
        updates.push(`ind_ativo = $${paramCount++}`);
        values.push(ind_ativo);
      }

      if (ind_adm) {
        updates.push(`ind_adm = $${paramCount++}`);
        values.push(ind_adm);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nenhum campo para atualizar",
      });
    }

    values.push(id);

    const query = `
            UPDATE drfintra.tab_usuario 
            SET ${updates.join(", ")}
            WHERE id = $${paramCount}
            RETURNING id, nom_usuario, email, ind_bloqueado, ind_ativo, ind_adm
        `;

    const result = await pool.query(query, values);

    res.json({
      sucesso: true,
      mensagem: "Usuário atualizado com sucesso",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar usuário",
    });
  }
});

// Excluir usuário
router.delete("/usuarios/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Não permitir excluir o próprio usuário
    if (parseInt(id) === req.session.usuario.id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Você não pode excluir seu próprio usuário",
      });
    }

    // Verificar se usuário existe
    const checkUser = await pool.query(
      "SELECT id FROM drfintra.tab_usuario WHERE id = $1",
      [id]
    );

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado",
      });
    }

    // Excluir usuário
    await pool.query("DELETE FROM drfintra.tab_usuario WHERE id = $1", [id]);

    res.json({
      sucesso: true,
      mensagem: "Usuário excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir usuário",
    });
  }
});

// Upload de foto de perfil (base64)
router.post(
  "/usuarios/:id/upload-foto",
  verificarAutenticacao,
  async (req, res) => {
    const { id } = req.params;
    const { fotoBase64 } = req.body;
    const isAdmin = req.session.usuario.admin;
    const isSelf = parseInt(id) === req.session.usuario.id;

    console.log(
      "Upload de foto - ID:",
      id,
      "Admin:",
      isAdmin,
      "isSelf:",
      isSelf
    );

    // Verificar permissão
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Você só pode alterar sua própria foto",
      });
    }

    if (!fotoBase64) {
      console.log("Erro: Nenhuma foto foi enviada");
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nenhuma foto foi enviada",
      });
    }

    try {
      // Converter base64 para buffer
      const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      console.log(
        "Foto convertida para buffer, tamanho:",
        buffer.length,
        "bytes"
      );

      // Validar tamanho (5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "A imagem deve ter no máximo 5MB",
        });
      }

      // Atualizar foto no banco
      const result = await pool.query(
        "UPDATE drfintra.tab_usuario SET foto_perfil = $1 WHERE id = $2 RETURNING id",
        [buffer, id]
      );

      console.log(
        "Foto atualizada no banco, linhas afetadas:",
        result.rowCount
      );

      res.json({
        sucesso: true,
        mensagem: "Foto atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao fazer upload da foto: " + error.message,
      });
    }
  }
);

// Obter foto de perfil
router.get("/usuarios/:id/foto", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT foto_perfil FROM drfintra.tab_usuario WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].foto_perfil) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Foto não encontrada",
      });
    }

    const fotoBuffer = result.rows[0].foto_perfil;

    // Retornar imagem sem cache para evitar problemas ao atualizar foto
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.send(fotoBuffer);
  } catch (error) {
    console.error("Erro ao buscar foto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar foto",
    });
  }
});

module.exports = router;
