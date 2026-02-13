const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const crypto = require("crypto");

// Chave e algoritmo para criptografia de senhas
const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "12345678901234567890123456789012"; // 32 caracteres
const IV_LENGTH = 16;

// Função para criptografar senha
function criptografarSenha(senha) {
  if (!senha) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(senha, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Função para descriptografar senha
function descriptografarSenha(senhaEncriptada) {
  if (!senhaEncriptada) return null;
  try {
    const parts = senhaEncriptada.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Erro ao descriptografar senha:", error);
    return null;
  }
}

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

// Buscar todos os contratos agrupados por grupo e empresa
router.get("/contratos", verificarAutenticacao, async (req, res) => {
  try {
    const query = `
      SELECT 
        cod_grupo,
        des_grupo,
        cod_pessoa,
        nom_pessoa,
        num_cnpj_cpf,
        cod_item,
        des_item,
        num_telefone_1
      FROM drfintra.tab_contrato
      ORDER BY des_grupo, nom_pessoa, des_item
    `;

    const result = await pool.query(query);

    // Agrupar dados por grupo e depois por pessoa
    const grupos = {};

    result.rows.forEach((row) => {
      const codGrupo = row.cod_grupo;

      // Criar grupo se não existir
      if (!grupos[codGrupo]) {
        grupos[codGrupo] = {
          cod_grupo: row.cod_grupo,
          des_grupo: row.des_grupo,
          empresas: {},
        };
      }

      const codPessoa = row.cod_pessoa;

      // Criar empresa se não existir no grupo
      if (!grupos[codGrupo].empresas[codPessoa]) {
        grupos[codGrupo].empresas[codPessoa] = {
          cod_pessoa: row.cod_pessoa,
          nom_pessoa: row.nom_pessoa,
          num_cnpj_cpf: row.num_cnpj_cpf,
          num_telefone_1: row.num_telefone_1,
          servicos: [],
        };
      }

      // Adicionar serviço à empresa
      grupos[codGrupo].empresas[codPessoa].servicos.push({
        cod_item: row.cod_item,
        des_item: row.des_item,
      });
    });

    // Converter objetos em arrays
    const gruposArray = Object.values(grupos).map((grupo) => ({
      ...grupo,
      empresas: Object.values(grupo.empresas),
    }));

    res.json({
      sucesso: true,
      grupos: gruposArray,
    });
  } catch (error) {
    console.error("Erro ao buscar contratos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar contratos",
    });
  }
});

// Buscar tipos de item distintos
router.get("/contratos/tipos-item", verificarAutenticacao, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT des_item
      FROM drfintra.tab_contrato
      WHERE des_item IS NOT NULL
      ORDER BY des_item
    `;

    const result = await pool.query(query);

    res.json({
      sucesso: true,
      tipos: result.rows.map((row) => row.des_item),
    });
  } catch (error) {
    console.error("Erro ao buscar tipos de item:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar tipos de item",
    });
  }
});

// Buscar contratos por grupo
router.get(
  "/contratos/grupo/:codGrupo",
  verificarAutenticacao,
  async (req, res) => {
    const { codGrupo } = req.params;

    try {
      const query = `
      SELECT 
        cod_grupo,
        des_grupo,
        cod_pessoa,
        nom_pessoa,
        num_cnpj_cpf,
        cod_item,
        des_item,
        num_telefone_1
      FROM drfintra.tab_contrato
      WHERE cod_grupo = $1
      ORDER BY nom_pessoa, des_item
    `;

      const result = await pool.query(query, [codGrupo]);

      res.json({
        sucesso: true,
        contratos: result.rows,
      });
    } catch (error) {
      console.error("Erro ao buscar contratos do grupo:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao buscar contratos do grupo",
      });
    }
  }
);

// Middleware para verificar se é administrador
const verificarAdmin = (req, res, next) => {
  if (!req.session.usuario || !req.session.usuario.admin) {
    return res.status(403).json({
      sucesso: false,
      mensagem:
        "Acesso negado. Apenas administradores podem gerenciar hospedagens.",
    });
  }
  next();
};

// ===== ROTAS DE HOSPEDAGEM =====

// Buscar hospedagens de um grupo
router.get(
  "/contratos/hospedagem/:codGrupo",
  verificarAutenticacao,
  async (req, res) => {
    const { codGrupo } = req.params;

    try {
      const query = `
      SELECT id, cod_grupo, base, host, usuario, 
             CASE WHEN senha IS NOT NULL AND senha != '' THEN true ELSE false END as tem_senha
      FROM drfintra.tab_dados
      WHERE cod_grupo = $1
      ORDER BY base
    `;

      const result = await pool.query(query, [codGrupo]);

      res.json({
        sucesso: true,
        hospedagens: result.rows,
        isAdmin: req.session.usuario.admin || false,
      });
    } catch (error) {
      console.error("Erro ao buscar hospedagens:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao buscar hospedagens",
      });
    }
  }
);

// Buscar senha descriptografada (todos os usuários autenticados)
router.get(
  "/contratos/hospedagem/:id/senha",
  verificarAutenticacao,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        "SELECT senha FROM drfintra.tab_dados WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          mensagem: "Hospedagem não encontrada",
        });
      }

      const senhaDescriptografada = descriptografarSenha(result.rows[0].senha);

      res.json({
        sucesso: true,
        senha: senhaDescriptografada || "",
      });
    } catch (error) {
      console.error("Erro ao buscar senha:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao buscar senha",
      });
    }
  }
);

// Criar nova hospedagem
router.post("/contratos/hospedagem", verificarAdmin, async (req, res) => {
  const { cod_grupo, base, host, usuario, senha } = req.body;

  if (!cod_grupo || !base || !host) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Grupo, base e host são obrigatórios",
    });
  }

  try {
    // Criptografar senha se fornecida
    let senhaCriptografada = null;
    if (senha && senha.trim() !== "") {
      senhaCriptografada = criptografarSenha(senha);
    }

    const query = `
      INSERT INTO drfintra.tab_dados (cod_grupo, base, host, usuario, senha)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, cod_grupo, base, host, usuario, 
                CASE WHEN senha IS NOT NULL AND senha != '' THEN true ELSE false END as tem_senha
    `;

    const result = await pool.query(query, [
      cod_grupo,
      base,
      host || null,
      usuario || null,
      senhaCriptografada,
    ]);

    res.status(201).json({
      sucesso: true,
      mensagem: "Hospedagem criada com sucesso",
      hospedagem: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar hospedagem:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar hospedagem",
    });
  }
});

// Atualizar hospedagem
router.put("/contratos/hospedagem/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { base, host, usuario, senha } = req.body;

  if (!base || !host) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Base e host são obrigatórios",
    });
  }

  try {
    // Buscar hospedagem atual para verificar se precisa atualizar senha
    const hospedagemAtual = await pool.query(
      "SELECT senha FROM drfintra.tab_dados WHERE id = $1",
      [id]
    );

    if (hospedagemAtual.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Hospedagem não encontrada",
      });
    }

    // Se senha foi fornecida e não é vazia, criptografar
    let senhaFinal = hospedagemAtual.rows[0].senha;
    if (senha !== undefined) {
      if (senha && senha.trim() !== "") {
        senhaFinal = criptografarSenha(senha);
      } else {
        senhaFinal = null;
      }
    }

    const query = `
      UPDATE drfintra.tab_dados
      SET base = $1, host = $2, usuario = $3, senha = $4
      WHERE id = $5
      RETURNING id, cod_grupo, base, host, usuario, 
                CASE WHEN senha IS NOT NULL AND senha != '' THEN true ELSE false END as tem_senha
    `;

    const result = await pool.query(query, [
      base,
      host,
      usuario || null,
      senhaFinal,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Hospedagem não encontrada",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Hospedagem atualizada com sucesso",
      hospedagem: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar hospedagem:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar hospedagem",
    });
  }
});

// Excluir hospedagem
router.delete("/contratos/hospedagem/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM drfintra.tab_dados WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Hospedagem não encontrada",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Hospedagem excluída com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir hospedagem:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir hospedagem",
    });
  }
});

module.exports = router;
