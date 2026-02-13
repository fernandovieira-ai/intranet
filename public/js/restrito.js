import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

// Variáveis globais
let projetos = [];
let modoEdicaoProjeto = false;
let modoEdicaoItem = false;
let isAdmin = false; // Controle de permissão de admin

// ==================== INICIALIZAÇÃO ====================

document.addEventListener("DOMContentLoaded", async () => {
  // Header e sidebar já estão no HTML
  await atualizarHeaderUsuario();
  configurarLogout();
  inicializarMenuLateral();

  await verificarSessao();
  configurarEventos();
  await carregarProjetos();
});

async function verificarSessao() {
  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (!data.logado) {
      window.location.href = "index.html";
      return;
    }

    // Armazenar se o usuário é admin
    isAdmin = data.usuario.admin === true;
    console.log("Usuário é admin?", isAdmin);

    // Esconder botão "Novo Projeto" se não for admin
    if (!isAdmin) {
      const btnNovo = document.getElementById("btnNovoProjeto");
      if (btnNovo) {
        btnNovo.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
}

function configurarEventos() {
  // Modal Projeto
  document
    .getElementById("btnNovoProjeto")
    .addEventListener("click", abrirModalNovoProjeto);
  document
    .getElementById("btnFecharModalProjeto")
    .addEventListener("click", fecharModalProjeto);
  document
    .getElementById("btnCancelarProjeto")
    .addEventListener("click", fecharModalProjeto);
  document
    .getElementById("btnSalvarProjeto")
    .addEventListener("click", salvarProjeto);

  // Modal Item
  document
    .getElementById("btnFecharModalItem")
    .addEventListener("click", fecharModalItem);
  document
    .getElementById("btnCancelarItem")
    .addEventListener("click", fecharModalItem);
  document
    .getElementById("btnSalvarItem")
    .addEventListener("click", salvarItem);

  // Fechar modal ao clicar fora
  document.getElementById("modalProjeto").addEventListener("click", (e) => {
    if (e.target.id === "modalProjeto") fecharModalProjeto();
  });
  document.getElementById("modalItem").addEventListener("click", (e) => {
    if (e.target.id === "modalItem") fecharModalItem();
  });
}

// ==================== PROJETOS ====================

async function carregarProjetos() {
  try {
    const response = await fetch("/api/restrito/projetos");
    const data = await response.json();

    if (data.sucesso) {
      projetos = data.projetos;
      renderizarProjetos();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao carregar projetos:", error);
    mostrarMensagem("Erro ao carregar projetos", "erro");
  }
}

function renderizarProjetos() {
  const container = document.getElementById("projetosContainer");

  if (projetos.length === 0) {
    container.innerHTML = `
      <div class="sem-itens">
        Nenhum projeto cadastrado. Clique em "Novo Projeto" para começar.
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  projetos.forEach((projeto) => {
    const card = document.createElement("div");
    card.className = "projeto-card";

    // Botões de ação do projeto (apenas para admin)
    const botoesProjetoHtml = isAdmin
      ? `<div class="projeto-header-actions">
          <button class="btn-icon" onclick="editarProjeto('${projeto}')" title="Editar projeto">
            ✏️
          </button>
          <button class="btn-icon" onclick="excluirProjeto('${projeto}')" title="Excluir projeto">
            🗑️
          </button>
        </div>`
      : "";

    // Botão adicionar item (apenas para admin)
    const btnAdicionarHtml = isAdmin
      ? `<button class="btn-adicionar-item" onclick="abrirModalNovoItem('${projeto}')">
          ➕ Adicionar Item
        </button>`
      : "";

    card.innerHTML = `
      <div class="projeto-header">
        <h3>📁 ${projeto}</h3>
        ${botoesProjetoHtml}
      </div>
      <div class="projeto-body">
        ${btnAdicionarHtml}
        <div class="itens-lista" id="itens-${projeto.replace(/\s+/g, "-")}">
          <div class="sem-itens">Carregando...</div>
        </div>
      </div>
    `;
    container.appendChild(card);

    // Carregar itens do projeto
    carregarItens(projeto);
  });
}

function abrirModalNovoProjeto() {
  modoEdicaoProjeto = false;
  document.getElementById("tituloModalProjeto").textContent = "Novo Projeto";
  document.getElementById("projetoNomeAntigo").value = "";
  document.getElementById("projetoNome").value = "";
  document.getElementById("modalProjeto").style.display = "flex";
}

function editarProjeto(nome) {
  if (!isAdmin) {
    mostrarMensagem("Você não tem permissão para editar projetos", "erro");
    return;
  }
  modoEdicaoProjeto = true;
  document.getElementById("tituloModalProjeto").textContent = "Editar Projeto";
  document.getElementById("projetoNomeAntigo").value = nome;
  document.getElementById("projetoNome").value = nome;
  document.getElementById("modalProjeto").style.display = "flex";
}

function fecharModalProjeto() {
  document.getElementById("modalProjeto").style.display = "none";
  document.getElementById("projetoNome").value = "";
  document.getElementById("projetoNomeAntigo").value = "";
}

async function salvarProjeto() {
  const nome = document.getElementById("projetoNome").value.trim();
  const nomeAntigo = document.getElementById("projetoNomeAntigo").value;

  if (!nome) {
    mostrarMensagem("Digite o nome do projeto", "erro");
    return;
  }

  try {
    let response;

    if (modoEdicaoProjeto) {
      // Editar
      response = await fetch(`/api/restrito/projetos/${nomeAntigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ des_projeto: nome }),
      });
    } else {
      // Criar
      response = await fetch("/api/restrito/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ des_projeto: nome }),
      });
    }

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      fecharModalProjeto();
      await carregarProjetos();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao salvar projeto:", error);
    mostrarMensagem("Erro ao salvar projeto", "erro");
  }
}

async function excluirProjeto(nome) {
  if (!isAdmin) {
    mostrarMensagem("Você não tem permissão para excluir projetos", "erro");
    return;
  }

  if (
    !confirm(
      `Tem certeza que deseja excluir o projeto "${nome}" e todos os seus itens?`
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/restrito/projetos/${nome}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      await carregarProjetos();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    mostrarMensagem("Erro ao excluir projeto", "erro");
  }
}

// ==================== ITENS ====================

async function carregarItens(projeto) {
  const containerId = `itens-${projeto.replace(/\s+/g, "-")}`;
  const container = document.getElementById(containerId);

  try {
    const response = await fetch(`/api/restrito/projetos/${projeto}/itens`);
    const data = await response.json();

    if (data.sucesso) {
      renderizarItens(container, data.itens);
    } else {
      container.innerHTML = `<div class="sem-itens">Erro ao carregar itens</div>`;
    }
  } catch (error) {
    console.error("Erro ao carregar itens:", error);
    container.innerHTML = `<div class="sem-itens">Erro ao carregar itens</div>`;
  }
}

function renderizarItens(container, itens) {
  if (itens.length === 0) {
    container.innerHTML = `<div class="sem-itens">Nenhum item cadastrado</div>`;
    return;
  }

  container.innerHTML = "";

  itens.forEach((item) => {
    const itemCard = document.createElement("div");
    itemCard.className = "item-card";

    const temLink = item.des_link && item.des_link.trim() !== "";
    const btnLink = temLink
      ? `<button class="btn-small btn-link" onclick="abrirLink('${item.des_link}')">🔗 Abrir</button>`
      : "";

    // Botões de edição e exclusão (apenas para admin)
    const botoesAdminHtml = isAdmin
      ? `<button class="btn-small btn-editar" onclick="editarItem(${
          item.id
        }, '${item.des_funcao}', '${item.des_complemento || ""}', '${
          item.des_link || ""
        }')">✏️</button>
         <button class="btn-small btn-excluir" onclick="excluirItem(${
           item.id
         })">🗑️</button>`
      : "";

    itemCard.innerHTML = `
      <div class="item-info">
        <div class="item-funcao">${item.des_funcao}</div>
        ${
          item.des_complemento
            ? `<div class="item-complemento">${item.des_complemento}</div>`
            : ""
        }
      </div>
      <div class="item-actions">
        ${btnLink}
        ${
          item.des_complemento
            ? `<button class="btn-small" onclick="copiarComplemento('${item.des_complemento}')">📋 Copiar</button>`
            : ""
        }
        ${botoesAdminHtml}
      </div>
    `;

    container.appendChild(itemCard);
  });
}

function abrirModalNovoItem(projeto) {
  if (!isAdmin) {
    mostrarMensagem("Você não tem permissão para adicionar itens", "erro");
    return;
  }
  modoEdicaoItem = false;
  document.getElementById("tituloModalItem").textContent = "Novo Item";
  document.getElementById("itemId").value = "";
  document.getElementById("itemProjeto").value = projeto;
  document.getElementById("itemFuncao").value = "";
  document.getElementById("itemComplemento").value = "";
  document.getElementById("itemLink").value = "";
  document.getElementById("modalItem").style.display = "flex";
}

function editarItem(id, funcao, complemento, link) {
  if (!isAdmin) {
    mostrarMensagem("Você não tem permissão para editar itens", "erro");
    return;
  }
  modoEdicaoItem = true;
  document.getElementById("tituloModalItem").textContent = "Editar Item";
  document.getElementById("itemId").value = id;
  document.getElementById("itemFuncao").value = funcao;
  document.getElementById("itemComplemento").value = complemento;
  document.getElementById("itemLink").value = link;
  document.getElementById("modalItem").style.display = "flex";
}

function fecharModalItem() {
  document.getElementById("modalItem").style.display = "none";
  document.getElementById("itemId").value = "";
  document.getElementById("itemProjeto").value = "";
  document.getElementById("itemFuncao").value = "";
  document.getElementById("itemComplemento").value = "";
  document.getElementById("itemLink").value = "";
}

async function salvarItem() {
  const id = document.getElementById("itemId").value;
  const projeto = document.getElementById("itemProjeto").value;
  const funcao = document.getElementById("itemFuncao").value.trim();
  const complemento = document.getElementById("itemComplemento").value.trim();
  const link = document.getElementById("itemLink").value.trim();

  if (!funcao) {
    mostrarMensagem("Digite a descrição/função", "erro");
    return;
  }

  try {
    let response;
    const body = {
      des_funcao: funcao,
      des_complemento: complemento,
      des_link: link,
    };

    if (modoEdicaoItem) {
      // Editar
      response = await fetch(`/api/restrito/itens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      // Criar
      response = await fetch(`/api/restrito/projetos/${projeto}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      fecharModalItem();
      await carregarProjetos(); // Recarrega tudo para atualizar os itens
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao salvar item:", error);
    mostrarMensagem("Erro ao salvar item", "erro");
  }
}

async function excluirItem(id) {
  if (!isAdmin) {
    mostrarMensagem("Você não tem permissão para excluir itens", "erro");
    return;
  }

  if (!confirm("Tem certeza que deseja excluir este item?")) {
    return;
  }

  try {
    const response = await fetch(`/api/restrito/itens/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      await carregarProjetos();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao excluir item:", error);
    mostrarMensagem("Erro ao excluir item", "erro");
  }
}

// ==================== UTILITÁRIOS ====================

function abrirLink(url) {
  if (!url) return;

  // Adiciona https:// se não tiver protocolo
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  window.open(url, "_blank");
}

function copiarComplemento(texto) {
  navigator.clipboard
    .writeText(texto)
    .then(() => {
      mostrarMensagem("✓ Copiado com sucesso!", "sucesso");
    })
    .catch((err) => {
      console.error("Erro ao copiar:", err);
      mostrarMensagem("Erro ao copiar", "erro");
    });
}

function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById("mensagem");
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
  mensagem.style.display = "block";

  setTimeout(() => {
    mensagem.style.display = "none";
  }, 3000);
}

// Expor funções globalmente para uso inline
window.abrirModalNovoItem = abrirModalNovoItem;
window.editarProjeto = editarProjeto;
window.excluirProjeto = excluirProjeto;
window.editarItem = editarItem;
window.excluirItem = excluirItem;
window.abrirLink = abrirLink;
window.copiarComplemento = copiarComplemento;
