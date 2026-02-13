import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

// Variáveis globais
let todosGrupos = [];
let gruposFiltrados = [];
let isAdmin = false;
let hospedagemAtual = {
  codGrupo: null,
  hospedagens: [],
  modoEdicao: false,
  idEdicao: null,
};

// Carregar contratos ao iniciar
window.addEventListener("load", async () => {
  // Header e sidebar já estão no HTML
  await atualizarHeaderUsuario();
  configurarLogout();
  inicializarMenuLateral();

  await verificarSessao();
  await carregarContratos();
  await carregarTiposItem();
  configurarFiltros();
});

// Verificar sessão
async function verificarSessao() {
  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (!data.logado) {
      window.location.href = "index.html";
      return;
    }

    isAdmin = data.usuario.admin || false;
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
}

// Carregar contratos
async function carregarContratos() {
  const loading = document.getElementById("loading");
  const gruposContainer = document.getElementById("gruposContainer");

  try {
    const response = await fetch("/api/contratos");
    const data = await response.json();

    loading.style.display = "none";

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    if (data.grupos.length === 0) {
      gruposContainer.innerHTML =
        '<div class="sem-dados">Nenhum contrato encontrado</div>';
      return;
    }

    todosGrupos = data.grupos;
    gruposFiltrados = data.grupos;
    renderizarGrupos(gruposFiltrados);
  } catch (error) {
    console.error("Erro ao carregar contratos:", error);
    loading.style.display = "none";
    mostrarMensagem("Erro ao carregar contratos", "erro");
  }
}

// Carregar tipos de item
async function carregarTiposItem() {
  try {
    const response = await fetch("/api/contratos/tipos-item");
    const data = await response.json();

    if (!data.sucesso) {
      console.error("Erro ao carregar tipos de item:", data.mensagem);
      return;
    }

    const select = document.getElementById("selectTipoItem");
    data.tipos.forEach((tipo) => {
      const option = document.createElement("option");
      option.value = tipo;
      option.textContent = tipo;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar tipos de item:", error);
  }
}

// Renderizar grupos
function renderizarGrupos(grupos) {
  const gruposContainer = document.getElementById("gruposContainer");

  gruposContainer.innerHTML = grupos
    .map((grupo, index) => {
      // Verificar se o grupo tem hospedagem (cod_item = 2)
      const temHospedagem = grupo.empresas.some((empresa) =>
        empresa.servicos.some((servico) => servico.cod_item === 2)
      );

      return `
    <div class="grupo-card">
      <div class="grupo-header" onclick="toggleGrupo(${index})">
        <h3>
          <span class="grupo-icon" id="icon-${index}">▶</span>
          ${grupo.des_grupo}
        </h3>
        <div class="grupo-header-right">
          <span class="grupo-badge">${grupo.empresas.length} ${
        grupo.empresas.length === 1 ? "empresa" : "empresas"
      }</span>
          ${
            temHospedagem
              ? `<button class="btn-hospedagem" onclick="abrirHospedagem(${grupo.cod_grupo}, event)" title="Gerenciar Hospedagem">
              🌐 Hospedagem
            </button>`
              : ""
          }
        </div>
      </div>
      
      <div class="empresas-container" id="empresas-${index}" style="display: none;">
        ${grupo.empresas
          .map(
            (empresa) => `
          <div class="empresa-card">
            <div class="empresa-header">
              <div class="empresa-info">
                <h4>${empresa.nom_pessoa}</h4>
                <div class="empresa-detalhes">
                  <span class="empresa-cnpj">
                    <strong>CNPJ:</strong> ${formatarCNPJ(empresa.num_cnpj_cpf)}
                  </span>
                  ${
                    empresa.num_telefone_1
                      ? `
                    <span class="empresa-telefone">
                      <strong>Tel:</strong> ${formatarTelefone(
                        empresa.num_telefone_1
                      )}
                    </span>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
            
            <div class="servicos-container">
              <h5>Serviços Contratados:</h5>
              <div class="servicos-lista">
                ${empresa.servicos
                  .map(
                    (servico) => `
                  <div class="servico-item">
                    <span class="servico-icon">✓</span>
                    ${servico.des_item}
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
    })
    .join("");
}

// Toggle grupo (abrir/fechar)
window.toggleGrupo = function (index) {
  const empresasContainer = document.getElementById(`empresas-${index}`);
  const icon = document.getElementById(`icon-${index}`);

  if (empresasContainer.style.display === "none") {
    empresasContainer.style.display = "grid";
    icon.textContent = "▼";
  } else {
    empresasContainer.style.display = "none";
    icon.textContent = "▶";
  }
};

// Formatar CNPJ
function formatarCNPJ(cnpj) {
  if (!cnpj) return "-";
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length === 14) {
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  } else if (cnpj.length === 11) {
    // CPF
    return cnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  return cnpj;
}

// Formatar telefone
function formatarTelefone(telefone) {
  if (!telefone) return "-";
  telefone = telefone.replace(/\D/g, "");

  if (telefone.length === 11) {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (telefone.length === 10) {
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return telefone;
}

// Mostrar mensagem
function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById("mensagem");
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;

  setTimeout(() => {
    mensagem.className = "mensagem";
  }, 5000);
}

// Mostrar mensagem dentro do modal
function mostrarMensagemModal(texto, tipo) {
  const mensagem = document.getElementById("mensagemModal");
  mensagem.textContent = texto;
  mensagem.className = `mensagem-modal ${tipo}`;
  mensagem.style.display = "block";

  setTimeout(() => {
    mensagem.style.display = "none";
    mensagem.className = "mensagem-modal";
  }, 3000);
}

// Configurar filtros
function configurarFiltros() {
  const filtroTipo = document.getElementById("filtroTipo");
  const inputBusca = document.getElementById("inputBusca");
  const selectTipoItem = document.getElementById("selectTipoItem");
  const btnLimpar = document.getElementById("btnLimparFiltro");

  filtroTipo.addEventListener("change", () => {
    inputBusca.value = "";
    selectTipoItem.value = "";

    // Alternar entre input texto e select
    if (filtroTipo.value === "tipoItem") {
      inputBusca.style.display = "none";
      selectTipoItem.style.display = "block";
    } else {
      inputBusca.style.display = "block";
      selectTipoItem.style.display = "none";
    }

    aplicarFiltros();
  });

  inputBusca.addEventListener("input", () => {
    aplicarFiltros();
  });

  selectTipoItem.addEventListener("change", () => {
    aplicarFiltros();
  });

  btnLimpar.addEventListener("click", () => {
    filtroTipo.value = "todos";
    inputBusca.value = "";
    selectTipoItem.value = "";
    inputBusca.style.display = "block";
    selectTipoItem.style.display = "none";
    aplicarFiltros();
  });
} // Aplicar filtros
function aplicarFiltros() {
  const filtroTipo = document.getElementById("filtroTipo").value;
  const termoBusca = document
    .getElementById("inputBusca")
    .value.toLowerCase()
    .trim();
  const tipoItemSelecionado = document.getElementById("selectTipoItem").value;

  if (filtroTipo === "todos" && !termoBusca) {
    gruposFiltrados = todosGrupos;
    renderizarGrupos(gruposFiltrados);
    return;
  }

  gruposFiltrados = todosGrupos
    .map((grupo) => {
      // Filtrar empresas dentro do grupo
      const empresasFiltradas = grupo.empresas.filter((empresa) => {
        // Filtro por tipo de item
        if (filtroTipo === "tipoItem" && tipoItemSelecionado) {
          return empresa.servicos.some(
            (servico) => servico.des_item === tipoItemSelecionado
          );
        }

        if (!termoBusca) return true;

        switch (filtroTipo) {
          case "grupo":
            return grupo.des_grupo.toLowerCase().includes(termoBusca);

          case "cnpj":
            const cnpjLimpo = empresa.num_cnpj_cpf
              ? empresa.num_cnpj_cpf.replace(/\D/g, "")
              : "";
            return cnpjLimpo.includes(termoBusca.replace(/\D/g, ""));

          case "nome":
            return empresa.nom_pessoa.toLowerCase().includes(termoBusca);

          case "todos":
            const cnpjTodos = empresa.num_cnpj_cpf
              ? empresa.num_cnpj_cpf.replace(/\D/g, "")
              : "";
            return (
              grupo.des_grupo.toLowerCase().includes(termoBusca) ||
              empresa.nom_pessoa.toLowerCase().includes(termoBusca) ||
              cnpjTodos.includes(termoBusca.replace(/\D/g, ""))
            );

          default:
            return true;
        }
      });

      // Retornar grupo com empresas filtradas
      return {
        ...grupo,
        empresas: empresasFiltradas,
      };
    })
    .filter((grupo) => {
      // Se filtrar por grupo, só mostrar grupos que correspondem
      if (filtroTipo === "grupo" && termoBusca) {
        return grupo.des_grupo.toLowerCase().includes(termoBusca);
      }
      // Mostrar grupos que têm pelo menos uma empresa
      return grupo.empresas.length > 0;
    });

  if (gruposFiltrados.length === 0) {
    document.getElementById("gruposContainer").innerHTML =
      '<div class="sem-dados">Nenhum resultado encontrado</div>';
  } else {
    renderizarGrupos(gruposFiltrados);
  }
}

// ===== FUNÇÕES DE HOSPEDAGEM =====

// Abrir modal de hospedagem
window.abrirHospedagem = async function (codGrupo, event) {
  if (event) {
    event.stopPropagation();
  }

  hospedagemAtual.codGrupo = codGrupo;
  await carregarHospedagens(codGrupo);

  const modal = document.getElementById("modalHospedagem");
  modal.style.display = "flex";
};

// Fechar modal de hospedagem
window.fecharModalHospedagem = function () {
  const modal = document.getElementById("modalHospedagem");
  modal.style.display = "none";
  limparFormularioHospedagem();
};

// Carregar hospedagens do grupo
async function carregarHospedagens(codGrupo) {
  try {
    const response = await fetch(`/api/contratos/hospedagem/${codGrupo}`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    hospedagemAtual.hospedagens = data.hospedagens;
    renderizarHospedagens();
  } catch (error) {
    console.error("Erro ao carregar hospedagens:", error);
    mostrarMensagem("Erro ao carregar hospedagens", "erro");
  }
}

// Renderizar lista de hospedagens
function renderizarHospedagens() {
  const lista = document.getElementById("listaHospedagens");
  const btnAdicionar = document.getElementById("btnAdicionarHospedagem");

  // Mostrar/ocultar botão adicionar
  btnAdicionar.style.display = isAdmin ? "inline-block" : "none";

  if (hospedagemAtual.hospedagens.length === 0) {
    lista.innerHTML =
      '<div class="sem-dados">Nenhuma hospedagem cadastrada</div>';
    return;
  }

  lista.innerHTML = `
    <table class="hospedagem-table">
      <thead>
        <tr>
          <th>Base</th>
          <th>Host</th>
          <th>Usuário</th>
          <th>Senha</th>
          ${isAdmin ? "<th>Ações</th>" : ""}
        </tr>
      </thead>
      <tbody>
        ${hospedagemAtual.hospedagens
          .map(
            (hosp) => `
          <tr>
            <td>${hosp.base || "-"}</td>
            <td>${hosp.host || "-"}</td>
            <td>${hosp.usuario || "-"}</td>
            <td>
              ${
                hosp.tem_senha
                  ? `<div class="senha-actions">
                       <span class="senha-campo" id="senha-${hosp.id}">••••••••</span>
                       <button class="btn-icon" onclick="verSenha(${hosp.id})" title="Ver Senha">👁️</button>
                       <button class="btn-icon" onclick="copiarSenha(${hosp.id})" title="Copiar Senha">📋</button>
                     </div>`
                  : '<span class="senha-vazia">Sem senha</span>'
              }
            </td>
            ${
              isAdmin
                ? `<td>
              <button class="btn-icon" onclick="editarHospedagem(${hosp.id})" title="Editar">
                ✏️
              </button>
              <button class="btn-icon btn-excluir" onclick="excluirHospedagem(${hosp.id})" title="Excluir">
                🗑️
              </button>
            </td>`
                : ""
            }
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

// Ver senha descriptografada
window.verSenha = async function (id) {
  const campo = document.getElementById(`senha-${id}`);

  // Se já está mostrando a senha, ocultar
  if (campo.textContent !== "••••••••") {
    campo.textContent = "••••••••";
    campo.style.color = "";
    return;
  }

  try {
    const response = await fetch(`/api/contratos/hospedagem/${id}/senha`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    campo.textContent = data.senha || "-";
    campo.style.color = "#2d3748";

    // Ocultar após 10 segundos
    setTimeout(() => {
      if (campo.textContent !== "••••••••") {
        campo.textContent = "••••••••";
        campo.style.color = "";
      }
    }, 10000);
  } catch (error) {
    console.error("Erro ao buscar senha:", error);
    mostrarMensagem("Erro ao buscar senha", "erro");
  }
};

// Copiar senha para área de transferência
window.copiarSenha = async function (id) {
  try {
    const response = await fetch(`/api/contratos/hospedagem/${id}/senha`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagemModal(data.mensagem, "erro");
      return;
    }

    if (!data.senha) {
      mostrarMensagemModal("Senha vazia", "erro");
      return;
    }

    // Copiar para área de transferência
    await navigator.clipboard.writeText(data.senha);
    mostrarMensagemModal("✓ Senha copiada com sucesso!", "sucesso");
  } catch (error) {
    console.error("Erro ao copiar senha:", error);
    mostrarMensagemModal("Erro ao copiar senha", "erro");
  }
}; // Mostrar formulário de hospedagem
function mostrarFormularioHospedagem() {
  document.getElementById("listaHospedagens").style.display = "none";
  document.getElementById("formularioHospedagem").style.display = "block";
  document.getElementById("btnAdicionarHospedagem").style.display = "none";
}

// Ocultar formulário de hospedagem
window.ocultarFormularioHospedagem = function () {
  document.getElementById("listaHospedagens").style.display = "block";
  document.getElementById("formularioHospedagem").style.display = "none";
  document.getElementById("btnAdicionarHospedagem").style.display = isAdmin
    ? "inline-block"
    : "none";
  limparFormularioHospedagem();
};

// Adicionar nova hospedagem
window.adicionarHospedagem = function () {
  hospedagemAtual.modoEdicao = false;
  hospedagemAtual.idEdicao = null;
  document.getElementById("tituloFormHospedagem").textContent =
    "Nova Hospedagem";
  mostrarFormularioHospedagem();
};

// Editar hospedagem
window.editarHospedagem = function (id) {
  const hosp = hospedagemAtual.hospedagens.find((h) => h.id === id);
  if (!hosp) return;

  hospedagemAtual.modoEdicao = true;
  hospedagemAtual.idEdicao = id;

  document.getElementById("tituloFormHospedagem").textContent =
    "Editar Hospedagem";
  document.getElementById("hospBase").value = hosp.base || "";
  document.getElementById("hospHost").value = hosp.host || "";
  document.getElementById("hospUsuario").value = hosp.usuario || "";
  document.getElementById("hospSenha").value = ""; // Deixar vazio
  document.getElementById("hospSenha").placeholder = hosp.tem_senha
    ? "Deixe vazio para manter a senha atual"
    : "Digite a senha";

  mostrarFormularioHospedagem();
};

// Salvar hospedagem
window.salvarHospedagem = async function () {
  const base = document.getElementById("hospBase").value.trim();
  const host = document.getElementById("hospHost").value.trim();
  const usuario = document.getElementById("hospUsuario").value.trim();
  const senha = document.getElementById("hospSenha").value.trim();

  if (!base || !host) {
    mostrarMensagem("Base e Host são obrigatórios", "erro");
    return;
  }

  const dados = { base, host, usuario };

  // Adicionar senha apenas se foi preenchida
  if (senha) {
    dados.senha = senha;
  } else if (hospedagemAtual.modoEdicao) {
    // Em modo edição, se senha vazia, enviar undefined para manter a atual
    dados.senha = undefined;
  } else {
    // Em modo criação, se senha vazia, enviar vazio
    dados.senha = "";
  }

  try {
    let response;

    if (hospedagemAtual.modoEdicao) {
      // Atualizar
      response = await fetch(
        `/api/contratos/hospedagem/${hospedagemAtual.idEdicao}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        }
      );
    } else {
      // Criar
      dados.cod_grupo = hospedagemAtual.codGrupo;
      response = await fetch("/api/contratos/hospedagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
    }

    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    mostrarMensagem(data.mensagem, "sucesso");
    await carregarHospedagens(hospedagemAtual.codGrupo);
    ocultarFormularioHospedagem();
  } catch (error) {
    console.error("Erro ao salvar hospedagem:", error);
    mostrarMensagem("Erro ao salvar hospedagem", "erro");
  }
};

// Excluir hospedagem
window.excluirHospedagem = async function (id) {
  if (!confirm("Deseja realmente excluir esta hospedagem?")) {
    return;
  }

  try {
    const response = await fetch(`/api/contratos/hospedagem/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    mostrarMensagem(data.mensagem, "sucesso");
    await carregarHospedagens(hospedagemAtual.codGrupo);
  } catch (error) {
    console.error("Erro ao excluir hospedagem:", error);
    mostrarMensagem("Erro ao excluir hospedagem", "erro");
  }
};

// Limpar formulário de hospedagem
function limparFormularioHospedagem() {
  document.getElementById("hospBase").value = "";
  document.getElementById("hospHost").value = "";
  document.getElementById("hospUsuario").value = "";
  document.getElementById("hospSenha").value = "";
  hospedagemAtual.modoEdicao = false;
  hospedagemAtual.idEdicao = null;
}
