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

// Buscar todos os acessos agrupados por rede
router.get("/acessos", verificarAutenticacao, async (req, res) => {
  try {
    console.log("🔍 Buscando acessos AnyDesk...");

    const query = `
      SELECT rede, unidade, host, end_anydesk, senhadesk
      FROM drfintra.anydesk_acessos
      ORDER BY rede, unidade, host
    `;

    const result = await pool.query(query);

    console.log(`✅ ${result.rows.length} acessos encontrados`);

    // Agrupar por rede
    const redesMap = new Map();

    result.rows.forEach((acesso) => {
      const rede = acesso.rede || "Sem Rede";

      if (!redesMap.has(rede)) {
        redesMap.set(rede, {
          nome: rede,
          acessos: [],
          total: 0,
        });
      }

      redesMap.get(rede).acessos.push({
        unidade: acesso.unidade,
        host: acesso.host,
        end_anydesk: acesso.end_anydesk,
        senhadesk: acesso.senhadesk,
      });

      redesMap.get(rede).total++;
    });

    // Converter Map para Array
    const redes = Array.from(redesMap.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );

    res.json({
      sucesso: true,
      redes: redes,
      total_redes: redes.length,
      total_acessos: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar acessos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar acessos",
      erro: error.message,
    });
  }
});

// Buscar acessos de uma rede específica
router.get("/acessos/:rede", verificarAutenticacao, async (req, res) => {
  try {
    const { rede } = req.params;

    console.log(`🔍 Buscando acessos da rede: ${rede}`);

    const query = `
      SELECT unidade, host, end_anydesk, senhadesk
      FROM drfintra.anydesk_acessos
      WHERE rede = $1
      ORDER BY unidade, host
    `;

    const result = await pool.query(query, [rede]);

    console.log(`✅ ${result.rows.length} acessos encontrados para ${rede}`);

    res.json({
      sucesso: true,
      rede: rede,
      acessos: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar acessos da rede:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar acessos da rede",
      erro: error.message,
    });
  }
});

// Criar novo acesso
router.post("/acessos", verificarAutenticacao, async (req, res) => {
  try {
    // Verificar se é admin
    if (!req.session.usuario.admin) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Apenas administradores podem criar acessos",
      });
    }

    const { rede, unidade, host, end_anydesk, senhadesk } = req.body;

    // Validações
    if (!rede || !host || !end_anydesk) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Rede, host e endereço AnyDesk são obrigatórios",
      });
    }

    console.log(`📝 Criando novo acesso: ${host} (${end_anydesk})`);

    const query = `
      INSERT INTO drfintra.anydesk_acessos (rede, unidade, host, end_anydesk, senhadesk)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(query, [rede, unidade, host, end_anydesk, senhadesk]);

    console.log(`✅ Acesso criado com sucesso`);

    res.status(201).json({
      sucesso: true,
      mensagem: "Acesso criado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao criar acesso:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar acesso",
      erro: error.message,
    });
  }
});

// Atualizar acesso
router.put("/acessos/:id", verificarAutenticacao, async (req, res) => {
  try {
    // Verificar se é admin
    if (!req.session.usuario.admin) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Apenas administradores podem editar acessos",
      });
    }

    const { id } = req.params;
    const [redeAntiga, hostAntigo, anydeskAntigo] = id.split("|");

    const { rede, unidade, host, end_anydesk, senhadesk } = req.body;

    // Validações
    if (!rede || !host || !end_anydesk) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Rede, host e endereço AnyDesk são obrigatórios",
      });
    }

    console.log(`📝 Atualizando acesso: ${hostAntigo} -> ${host}`);

    const query = `
      UPDATE drfintra.anydesk_acessos
      SET rede = $1, unidade = $2, host = $3, end_anydesk = $4, senhadesk = $5
      WHERE rede = $6 AND host = $7 AND end_anydesk = $8
    `;

    const result = await pool.query(query, [
      rede,
      unidade,
      host,
      end_anydesk,
      senhadesk,
      redeAntiga,
      hostAntigo,
      anydeskAntigo,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Acesso não encontrado",
      });
    }

    console.log(`✅ Acesso atualizado com sucesso`);

    res.json({
      sucesso: true,
      mensagem: "Acesso atualizado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar acesso:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar acesso",
      erro: error.message,
    });
  }
});

// Excluir acesso
router.delete("/acessos/:id", verificarAutenticacao, async (req, res) => {
  try {
    // Verificar se é admin
    if (!req.session.usuario.admin) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Apenas administradores podem excluir acessos",
      });
    }

    const { id } = req.params;
    const [rede, host, end_anydesk] = id.split("|");

    console.log(`🗑️ Excluindo acesso: ${host} (${end_anydesk})`);

    const query = `
      DELETE FROM drfintra.anydesk_acessos
      WHERE rede = $1 AND host = $2 AND end_anydesk = $3
    `;

    const result = await pool.query(query, [rede, host, end_anydesk]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Acesso não encontrado",
      });
    }

    console.log(`✅ Acesso excluído com sucesso`);

    res.json({
      sucesso: true,
      mensagem: "Acesso excluído com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao excluir acesso:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir acesso",
      erro: error.message,
    });
  }
});

module.exports = router;
