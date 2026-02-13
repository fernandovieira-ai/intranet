const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

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

// Configurar pasta de uploads
const UPLOAD_FOLDER = path.join(__dirname, "../public/uploads/faq");
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_FOLDER);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `${uuidv4()}${ext}`;
    cb(null, nomeArquivo);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Tipo de arquivo não permitido. Apenas JPG, PNG e PDF."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Listar todos os sistemas
router.get("/sistemas", verificarAutenticacao, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nom_sistema FROM drfintra.tab_sistema ORDER BY nom_sistema"
    );

    res.json({
      sucesso: true,
      sistemas: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar sistemas:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar sistemas",
    });
  }
});

// Listar todos os erros (FAQ)
router.get("/erros", verificarAutenticacao, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        nom_sistema,
        des_assunto,
        des_erro,
        des_resolucao,
        tipo_arquivo,
        caminho_arquivo,
        CASE
          WHEN caminho_arquivo IS NOT NULL AND caminho_arquivo != '' THEN true
          WHEN imagem IS NOT NULL THEN true
          ELSE false
        END as tem_arquivo
      FROM drfintra.tab_faq
      ORDER BY id DESC`
    );

    res.json({
      sucesso: true,
      erros: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar erros:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar erros",
    });
  }
});

// Buscar um erro específico
router.get("/erros/:id", verificarAutenticacao, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        id,
        nom_sistema,
        des_assunto,
        des_erro,
        des_resolucao,
        tipo_arquivo,
        caminho_arquivo,
        usuario_cadastro,
        CASE
          WHEN caminho_arquivo IS NOT NULL AND caminho_arquivo != '' THEN true
          WHEN imagem IS NOT NULL THEN true
          ELSE false
        END as tem_arquivo
      FROM drfintra.tab_faq
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Erro não encontrado",
      });
    }

    res.json({
      sucesso: true,
      erro: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar erro:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar erro",
    });
  }
});

// Criar novo erro
router.post("/erros", verificarAutenticacao, async (req, res) => {
  const { nom_sistema, des_assunto, des_erro, des_resolucao } = req.body;

  if (!nom_sistema || !des_assunto || !des_erro || !des_resolucao) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Todos os campos são obrigatórios",
    });
  }

  try {
    // Obter nome do usuário logado da sessão
    const usuarioCadastro =
      req.session.usuario_nome || req.session.usuario?.nome || null;

    const result = await pool.query(
      `INSERT INTO drfintra.tab_faq
        (nom_sistema, des_assunto, des_erro, des_resolucao, usuario_cadastro)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nom_sistema, des_assunto, des_erro, des_resolucao, usuario_cadastro`,
      [nom_sistema, des_assunto, des_erro, des_resolucao, usuarioCadastro]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: "Erro cadastrado com sucesso",
      erro: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar erro:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar erro",
    });
  }
});

// Atualizar erro
router.put("/erros/:id", verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  const { nom_sistema, des_assunto, des_erro, des_resolucao } = req.body;

  if (!nom_sistema || !des_assunto || !des_erro || !des_resolucao) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Todos os campos são obrigatórios",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE drfintra.tab_faq
      SET nom_sistema = $1, des_assunto = $2, des_erro = $3, des_resolucao = $4
      WHERE id = $5
      RETURNING id, nom_sistema, des_assunto, des_erro, des_resolucao`,
      [nom_sistema, des_assunto, des_erro, des_resolucao, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Erro não encontrado",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Erro atualizado com sucesso",
      erro: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar erro:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar erro",
    });
  }
});

// Excluir erro
router.delete("/erros/:id", verificarAutenticacao, async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar caminho do arquivo antes de excluir
    const faqResult = await pool.query(
      "SELECT caminho_arquivo FROM drfintra.tab_faq WHERE id = $1",
      [id]
    );

    if (faqResult.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Erro não encontrado",
      });
    }

    // Excluir arquivo físico se existir
    const caminhoArquivo = faqResult.rows[0].caminho_arquivo;
    if (caminhoArquivo) {
      const arquivoCompleto = path.join(__dirname, "../public", caminhoArquivo);
      if (fs.existsSync(arquivoCompleto)) {
        fs.unlinkSync(arquivoCompleto);
      }
    }

    // Excluir registro do banco
    await pool.query("DELETE FROM drfintra.tab_faq WHERE id = $1", [id]);

    res.json({
      sucesso: true,
      mensagem: "Erro excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir erro:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir erro",
    });
  }
});

// Upload de arquivo (imagem ou PDF)
router.post(
  "/erros/:id/upload-arquivo",
  verificarAutenticacao,
  upload.single("arquivo"),
  async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nenhum arquivo foi enviado",
      });
    }

    try {
      // Verificar se o FAQ existe
      const faqCheck = await pool.query(
        "SELECT id, caminho_arquivo FROM drfintra.tab_faq WHERE id = $1",
        [id]
      );

      if (faqCheck.rows.length === 0) {
        // Remover arquivo que foi feito upload
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          sucesso: false,
          mensagem: "FAQ não encontrado",
        });
      }

      // Remover arquivo antigo se existir
      const arquivoAntigo = faqCheck.rows[0].caminho_arquivo;
      if (arquivoAntigo) {
        const caminhoCompleto = path.join(
          __dirname,
          "../public",
          arquivoAntigo
        );
        if (fs.existsSync(caminhoCompleto)) {
          fs.unlinkSync(caminhoCompleto);
        }
      }

      // Caminho relativo para salvar no banco
      const caminhoRelativo = `uploads/faq/${req.file.filename}`;

      // Determinar tipo de arquivo
      let tipoArquivo = "imagem";
      if (req.file.mimetype === "application/pdf") {
        tipoArquivo = "pdf";
      }

      // Atualizar banco de dados
      await pool.query(
        `UPDATE drfintra.tab_faq
         SET caminho_arquivo = $1, tipo_arquivo = $2, imagem = NULL
         WHERE id = $3`,
        [caminhoRelativo, tipoArquivo, id]
      );

      res.json({
        sucesso: true,
        mensagem: "Arquivo enviado com sucesso",
        caminho: caminhoRelativo,
        tipo: tipoArquivo,
      });
    } catch (error) {
      // Remover arquivo em caso de erro
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Erro ao fazer upload do arquivo:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao fazer upload do arquivo: " + error.message,
      });
    }
  }
);

// Remover arquivo de um FAQ
router.delete("/erros/:id/arquivo", verificarAutenticacao, async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar caminho do arquivo
    const result = await pool.query(
      "SELECT caminho_arquivo FROM drfintra.tab_faq WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "FAQ não encontrado",
      });
    }

    const caminhoArquivo = result.rows[0].caminho_arquivo;

    // Excluir arquivo físico se existir
    if (caminhoArquivo) {
      const arquivoCompleto = path.join(__dirname, "../public", caminhoArquivo);
      if (fs.existsSync(arquivoCompleto)) {
        fs.unlinkSync(arquivoCompleto);
      }
    }

    // Limpar campos no banco
    await pool.query(
      "UPDATE drfintra.tab_faq SET caminho_arquivo = NULL, tipo_arquivo = NULL, imagem = NULL WHERE id = $1",
      [id]
    );

    res.json({
      sucesso: true,
      mensagem: "Arquivo removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover arquivo:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao remover arquivo",
    });
  }
});

// Obter arquivo (imagem ou PDF)
router.get("/erros/:id/arquivo", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT caminho_arquivo, tipo_arquivo, imagem FROM drfintra.tab_faq WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "FAQ não encontrado",
      });
    }

    const { caminho_arquivo, tipo_arquivo, imagem } = result.rows[0];

    // Se tiver arquivo no servidor
    if (caminho_arquivo) {
      const arquivoCompleto = path.join(
        __dirname,
        "../public",
        caminho_arquivo
      );

      if (!fs.existsSync(arquivoCompleto)) {
        return res.status(404).json({
          sucesso: false,
          mensagem: "Arquivo não encontrado no servidor",
        });
      }

      // Definir Content-Type correto
      if (tipo_arquivo === "pdf") {
        res.set("Content-Type", "application/pdf");
      } else {
        res.set("Content-Type", "image/jpeg");
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      return res.sendFile(arquivoCompleto);
    }

    // Fallback para imagem antiga no banco (bytea) - compatibilidade
    if (imagem) {
      res.set("Content-Type", "image/jpeg");
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      return res.send(imagem);
    }

    return res.status(404).json({
      sucesso: false,
      mensagem: "Nenhum arquivo encontrado",
    });
  } catch (error) {
    console.error("Erro ao buscar arquivo:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar arquivo",
    });
  }
});

module.exports = router;
