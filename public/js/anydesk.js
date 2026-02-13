import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

let usuarioLogado = null;
let redesData = [];
let acessosFiltrados = [];
let isAdmin = false;
let acessoParaExcluir = null;
let modoEdicao = false;

// Verificar sessão ao carregar
window.addEventListener("load", async () => {
  // Header e sidebar já estão no HTML
  await atualizarHeaderUsuario();
  configurarLogout();
  inicializarMenuLateral();

  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (!data.logado) {
      window.location.href = "index.html";
      return;
    }

    usuarioLogado = data.usuario;
    isAdmin = data.usuario.admin;

    // Mostrar botão de novo acesso apenas para admin
    if (isAdmin) {
      document.getElementById("btnNovoAcesso").style.display = "block";
    }

    // Carregar acessos
    await carregarAcessos();

    // Configurar busca
    document
      .getElementById("inputBusca")
      .addEventListener("input", filtrarAcessos);

    // Configurar eventos de modais
    configurarEventos();
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
});

// Carregar acessos
async function carregarAcessos() {
  try {
    document.getElementById("loading").style.display = "block";
    document.getElementById("listaRedes").innerHTML = "";
    document.getElementById("mensagemVazia").style.display = "none";

    const response = await fetch("/api/anydesk/acessos");
    const data = await response.json();

    document.getElementById("loading").style.display = "none";

    if (!data.sucesso) {
      mostrarMensagem("Erro ao carregar acessos", "erro");
      return;
    }

    if (data.redes.length === 0) {
      document.getElementById("mensagemVazia").style.display = "block";
      return;
    }

    redesData = data.redes;
    acessosFiltrados = data.redes;
    renderizarRedes(redesData);
  } catch (error) {
    console.error("Erro ao carregar acessos:", error);
    document.getElementById("loading").style.display = "none";
    mostrarMensagem("Erro ao carregar acessos", "erro");
  }
}

// Renderizar redes
function renderizarRedes(redes) {
  const listaRedes = document.getElementById("listaRedes");

  if (redes.length === 0) {
    document.getElementById("mensagemVazia").style.display = "block";
    listaRedes.innerHTML = "";
    return;
  }

  document.getElementById("mensagemVazia").style.display = "none";

  listaRedes.innerHTML = redes
    .map((rede) => {
      return `
        <div class="rede-card" onclick="verAcessos('${rede.nome}')">
          <div class="rede-header">
            <h3>🌐 ${rede.nome}</h3>
            <span class="rede-contador">${rede.total} ${
        rede.total === 1 ? "acesso" : "acessos"
      }</span>
          </div>
          <div class="rede-info">
            <p>Clique para ver todos os acessos desta rede</p>
          </div>
        </div>
      `;
    })
    .join("");
}

// Filtrar acessos
function filtrarAcessos() {
  const busca = document
    .getElementById("inputBusca")
    .value.toLowerCase()
    .trim();

  if (!busca) {
    acessosFiltrados = redesData;
    renderizarRedes(redesData);
    return;
  }

  // Filtrar redes que contenham a busca no nome ou que tenham acessos com a busca
  acessosFiltrados = redesData.filter((rede) => {
    const nomeMatch = rede.nome.toLowerCase().includes(busca);
    const acessosMatch = rede.acessos.some(
      (acesso) =>
        acesso.unidade?.toLowerCase().includes(busca) ||
        acesso.host?.toLowerCase().includes(busca) ||
        acesso.end_anydesk?.toLowerCase().includes(busca)
    );
    return nomeMatch || acessosMatch;
  });

  renderizarRedes(acessosFiltrados);
}

// Ver acessos de uma rede
window.verAcessos = function (nomeRede) {
  const rede = redesData.find((r) => r.nome === nomeRede);

  if (!rede) {
    mostrarMensagem("Rede não encontrada", "erro");
    return;
  }

  document.getElementById(
    "tituloModalAcessos"
  ).textContent = `Acessos - ${nomeRede}`;
  document.getElementById("modalAcessos").style.display = "flex";

  const acessosContainer = document.getElementById("acessosContainer");

  acessosContainer.innerHTML = rede.acessos
    .map((acesso, index) => {
      const acessoId = `${rede.nome}|${acesso.host}|${acesso.end_anydesk}`;
      return `
        <div class="acesso-card">
          <div class="acesso-header">
            <span class="acesso-icon">🖥️</span>
            <h4>${acesso.host || "Sem nome"}</h4>
          </div>
          <div class="acesso-info">
            ${
              acesso.unidade
                ? `
              <div class="acesso-item">
                <label>Unidade</label>
                <span>${acesso.unidade}</span>
              </div>
            `
                : ""
            }
            <div class="acesso-item">
              <label>AnyDesk</label>
              <span class="acesso-anydesk">${acesso.end_anydesk || "N/A"}</span>
            </div>
            ${
              acesso.senhadesk
                ? `
              <div class="acesso-item">
                <label>Senha</label>
                <span>${acesso.senhadesk}</span>
              </div>
            `
                : ""
            }
          </div>
          ${
            isAdmin
              ? `
            <div class="acesso-actions">
              <button class="btn-action btn-edit" onclick="editarAcesso('${nomeRede}', ${index})">
                ✏️ Editar
              </button>
              <button class="btn-action btn-delete" onclick="confirmarExclusao('${nomeRede}', ${index})">
                🗑️ Excluir
              </button>
            </div>
          `
              : ""
          }
        </div>
      `;
    })
    .join("");
};

// Fechar modal
document
  .getElementById("btnFecharModalAcessos")
  .addEventListener("click", () => {
    document.getElementById("modalAcessos").style.display = "none";
  });

// Fechar modal ao clicar fora
document.getElementById("modalAcessos").addEventListener("click", (e) => {
  if (e.target.id === "modalAcessos") {
    document.getElementById("modalAcessos").style.display = "none";
  }
});

// Configurar eventos
function configurarEventos() {
  // Botão novo acesso
  document
    .getElementById("btnNovoAcesso")
    .addEventListener("click", abrirModalNovo);

  // Fechar modais
  document
    .getElementById("btnFecharModalForm")
    .addEventListener("click", fecharModalForm);
  document
    .getElementById("btnCancelarForm")
    .addEventListener("click", fecharModalForm);
  document
    .getElementById("btnFecharConfirmacao")
    .addEventListener("click", fecharModalConfirmacao);
  document
    .getElementById("btnCancelarExclusao")
    .addEventListener("click", fecharModalConfirmacao);

  // Formulário
  document
    .getElementById("formAcesso")
    .addEventListener("submit", salvarAcesso);

  // Confirmação de exclusão
  document
    .getElementById("btnConfirmarExclusao")
    .addEventListener("click", excluirAcesso);

  // Fechar modal ao clicar fora
  document.getElementById("modalFormAcesso").addEventListener("click", (e) => {
    if (e.target.id === "modalFormAcesso") fecharModalForm();
  });

  document.getElementById("modalConfirmacao").addEventListener("click", (e) => {
    if (e.target.id === "modalConfirmacao") fecharModalConfirmacao();
  });
}

// Abrir modal para novo acesso
function abrirModalNovo() {
  modoEdicao = false;
  document.getElementById("tituloModalForm").textContent = "Novo Acesso";
  document.getElementById("formAcesso").reset();
  document.getElementById("acessoId").value = "";
  document.getElementById("modalFormAcesso").style.display = "flex";
}

// Editar acesso
window.editarAcesso = function (nomeRede, index) {
  const rede = redesData.find((r) => r.nome === nomeRede);
  if (!rede || !rede.acessos[index]) return;

  const acesso = rede.acessos[index];
  modoEdicao = true;

  document.getElementById("tituloModalForm").textContent = "Editar Acesso";
  document.getElementById(
    "acessoId"
  ).value = `${nomeRede}|${acesso.host}|${acesso.end_anydesk}`;
  document.getElementById("inputRede").value = nomeRede;
  document.getElementById("inputUnidade").value = acesso.unidade || "";
  document.getElementById("inputHost").value = acesso.host || "";
  document.getElementById("inputAnydesk").value = acesso.end_anydesk || "";
  document.getElementById("inputSenha").value = acesso.senhadesk || "";

  document.getElementById("modalFormAcesso").style.display = "flex";
};

// Salvar acesso
async function salvarAcesso(e) {
  e.preventDefault();

  const dados = {
    rede: document.getElementById("inputRede").value.trim(),
    unidade: document.getElementById("inputUnidade").value.trim() || null,
    host: document.getElementById("inputHost").value.trim(),
    end_anydesk: document.getElementById("inputAnydesk").value.trim(),
    senhadesk: document.getElementById("inputSenha").value.trim() || null,
  };

  const acessoId = document.getElementById("acessoId").value;

  try {
    const url = modoEdicao
      ? `/api/anydesk/acessos/${encodeURIComponent(acessoId)}`
      : "/api/anydesk/acessos";
    const method = modoEdicao ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    const data = await response.json();

    if (data.sucesso) {
      alert(data.mensagem || "Acesso salvo com sucesso!");
      fecharModalForm();
      await carregarAcessos();
    } else {
      alert(data.mensagem || "Erro ao salvar acesso");
    }
  } catch (error) {
    console.error("Erro ao salvar acesso:", error);
    alert("Erro ao salvar acesso");
  }
}

// Confirmar exclusão
window.confirmarExclusao = function (nomeRede, index) {
  const rede = redesData.find((r) => r.nome === nomeRede);
  if (!rede || !rede.acessos[index]) return;

  const acesso = rede.acessos[index];
  acessoParaExcluir = `${nomeRede}|${acesso.host}|${acesso.end_anydesk}`;

  document.getElementById(
    "mensagemConfirmacao"
  ).textContent = `Tem certeza que deseja excluir o acesso "${acesso.host}" (${acesso.end_anydesk})?`;

  document.getElementById("modalConfirmacao").style.display = "flex";
};

// Excluir acesso
async function excluirAcesso() {
  if (!acessoParaExcluir) return;

  try {
    const response = await fetch(
      `/api/anydesk/acessos/${encodeURIComponent(acessoParaExcluir)}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (data.sucesso) {
      alert(data.mensagem || "Acesso excluído com sucesso!");
      fecharModalConfirmacao();
      document.getElementById("modalAcessos").style.display = "none";
      await carregarAcessos();
    } else {
      alert(data.mensagem || "Erro ao excluir acesso");
    }
  } catch (error) {
    console.error("Erro ao excluir acesso:", error);
    alert("Erro ao excluir acesso");
  }
}

// Fechar modais
function fecharModalForm() {
  document.getElementById("modalFormAcesso").style.display = "none";
}

function fecharModalConfirmacao() {
  document.getElementById("modalConfirmacao").style.display = "none";
  acessoParaExcluir = null;
}

// Função auxiliar para mostrar mensagens (se necessário)
function mostrarMensagem(mensagem, tipo) {
  console.log(`${tipo.toUpperCase()}: ${mensagem}`);
}
