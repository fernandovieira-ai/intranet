const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/database");

// Rota de Login
router.post("/login", async (req, res) => {
  const { usuario, senha, lembrar } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Usuário e senha são obrigatórios",
    });
  }

  try {
    // Buscar usuário no banco
    const query = `
            SELECT id, nom_usuario, senha, email, ind_bloqueado, ind_ativo, ind_adm 
            FROM drfintra.tab_usuario 
            WHERE nom_usuario = $1
        `;

    const result = await pool.query(query, [usuario]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário ou senha inválidos",
      });
    }

    const user = result.rows[0];

    // Verificar se está bloqueado
    if (user.ind_bloqueado === "S") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Usuário bloqueado. Entre em contato com o administrador.",
      });
    }

    // Verificar se está ativo
    if (user.ind_ativo === "N") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Usuário inativo. Entre em contato com o administrador.",
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário ou senha inválidos",
      });
    }

    // Criar sessão
    req.session.usuario = {
      id: user.id,
      nome: user.nom_usuario,
      email: user.email,
      admin: user.ind_adm === "S",
    };

    // Se marcou "lembrar-me"
    if (lembrar) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
    }

    // Atualizar último acesso
    await pool.query(
      "UPDATE drfintra.tab_usuario SET ultimo_acesso = NOW() WHERE id = $1",
      [user.id]
    );

    res.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso",
      usuario: {
        nome: user.nom_usuario,
        email: user.email,
        admin: user.ind_adm === "S",
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao processar login",
    });
  }
});

// Rota para verificar sessão
router.get("/verificar-sessao", async (req, res) => {
  if (req.session.usuario) {
    try {
      // Buscar dados atualizados do usuário, incluindo foto_perfil
      const result = await pool.query(
        `SELECT id, nom_usuario, email, ind_adm,
         CASE WHEN foto_perfil IS NOT NULL THEN true ELSE false END as foto_perfil
         FROM drfintra.tab_usuario 
         WHERE id = $1`,
        [req.session.usuario.id]
      );

      if (result.rows.length > 0) {
        const usuario = result.rows[0];
        res.json({
          logado: true,
          usuario: {
            id: usuario.id,
            nome: usuario.nom_usuario,
            email: usuario.email,
            admin: usuario.ind_adm === "S",
            foto_perfil: usuario.foto_perfil,
          },
        });
      } else {
        res.json({
          logado: false,
          usuario: null,
        });
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      res.json({
        logado: true,
        usuario: req.session.usuario,
      });
    }
  } else {
    res.json({
      logado: false,
      usuario: null,
    });
  }
});

// Rota de Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao fazer logout",
      });
    }
    res.json({
      sucesso: true,
      mensagem: "Logout realizado com sucesso",
    });
  });
});

module.exports = router;
