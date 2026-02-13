import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

let modoEdicao = false;
let isAdmin = false;

// Carregar plantões ao iniciar
window.addEventListener("load", async function () {
  // Header e sidebar já estão no HTML
  await atualizarHeaderUsuario();
  configurarLogout();
  inicializarMenuLateral();

  // Verificar sessão
  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (!data.logado) {
      window.location.href = "index.html";
      return;
    }

    // Carregar plantões
    await carregarPlantoes();
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
});

// Abrir modal de novo plantão
document
  .getElementById("btnNovoPlantao")
  .addEventListener("click", async () => {
    modoEdicao = false;
    document.getElementById("modalTitle").textContent = "Novo Plantão";
    document.getElementById("plantaoId").value = "";
    document.getElementById("formPlantao").reset();
    document.getElementById("divFinalizado").style.display = "none";
    await carregarUsuarios();
    document.getElementById("modalPlantao").classList.add("show");
  });

// Fechar modal
document.querySelector(".modal-close").addEventListener("click", fecharModal);
document.getElementById("btnCancelar").addEventListener("click", fecharModal);

// Fechar modal ao clicar fora
document.getElementById("modalPlantao").addEventListener("click", (e) => {
  if (e.target.id === "modalPlantao") {
    fecharModal();
  }
});

// Submeter formulário
document.getElementById("formPlantao").addEventListener("submit", async (e) => {
  e.preventDefault();
  await salvarPlantao();
});

// Filtros
document.getElementById("btnFiltrar").addEventListener("click", async () => {
  await carregarPlantoes();
});

document
  .getElementById("btnLimparFiltro")
  .addEventListener("click", async () => {
    document.getElementById("filtroDataInicio").value = "";
    document.getElementById("filtroDataFim").value = "";
    document.getElementById("filtroFinalizados").checked = false;
    await carregarPlantoes();
  });

function fecharModal() {
  document.getElementById("modalPlantao").classList.remove("show");
}

async function carregarUsuarios() {
  try {
    const response = await fetch("/api/plantao/usuarios");
    const data = await response.json();

    if (!data.sucesso) {
      console.error("Erro ao carregar usuários:", data.mensagem);
      return;
    }

    const select = document.getElementById("analista");
    // Limpar opções existentes exceto a primeira
    select.innerHTML = '<option value="">Selecione um analista...</option>';

    // Adicionar usuários ao select
    data.usuarios.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.nom_usuario;
      option.textContent = user.nom_usuario;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
  }
}

async function carregarPlantoes() {
  try {
    const dataInicio = document.getElementById("filtroDataInicio").value;
    const dataFim = document.getElementById("filtroDataFim").value;
    const mostrarFinalizados =
      document.getElementById("filtroFinalizados").checked;

    let url = "/api/plantao?";
    const params = [];

    if (dataInicio) params.push(`dataInicio=${dataInicio}`);
    if (dataFim) params.push(`dataFim=${dataFim}`);
    if (mostrarFinalizados) params.push(`mostrarFinalizados=true`);

    url += params.join("&");

    const response = await fetch(url);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    isAdmin = data.admin;

    // Se for admin, mostrar botão de novo plantão
    if (isAdmin) {
      document.getElementById("btnNovoPlantao").style.display = "block";
    } else {
      // Se não for admin, ocultar coluna de ações
      document.getElementById("colAcoes").style.display = "none";
    }

    renderizarPlantoes(data.plantoes);
  } catch (error) {
    console.error("Erro ao carregar plantões:", error);
    mostrarMensagem("Erro ao carregar plantões", "erro");
  }
}

function renderizarPlantoes(plantoes) {
  const tbody = document.getElementById("plantaoTableBody");

  if (plantoes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="loading">Nenhum plantão encontrado</td></tr>';
    return;
  }

  tbody.innerHTML = plantoes
    .map((plantao) => {
      const finalizado = plantao.ind_finalizado === "S";

      return `
        <tr>
            <td>${formatarData(plantao.dtainicio)}</td>
            <td>${formatarData(plantao.dtafinal)}</td>
            <td><strong>${plantao.analista}</strong></td>
            <td>${plantao.dia_semana || "-"}</td>
            <td>${plantao.observacao || "-"}</td>
            <td>
                ${
                  finalizado
                    ? '<span class="badge finalizado">Finalizado</span>'
                    : '<span class="badge em-andamento">Em Andamento</span>'
                }
            </td>
            ${
              isAdmin
                ? `<td>
                <button class="btn-action edit" data-id="${plantao.id}">✏️ Editar</button>
                <button class="btn-action delete" data-id="${plantao.id}">🗑️ Excluir</button>
            </td>`
                : '<td style="display: none;"></td>'
            }
        </tr>
    `;
    })
    .join("");

  // Adicionar event listeners aos botões (apenas se for admin)
  if (isAdmin) {
    document.querySelectorAll(".btn-action.edit").forEach((btn) => {
      btn.addEventListener("click", function () {
        editarPlantao(this.dataset.id);
      });
    });

    document.querySelectorAll(".btn-action.delete").forEach((btn) => {
      btn.addEventListener("click", function () {
        excluirPlantao(this.dataset.id);
      });
    });
  }
}

async function editarPlantao(id) {
  try {
    const response = await fetch(`/api/plantao/${id}`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    const plantao = data.plantao;

    // Carregar usuários primeiro
    await carregarUsuarios();

    modoEdicao = true;
    document.getElementById("modalTitle").textContent = "Editar Plantão";
    document.getElementById("plantaoId").value = plantao.id;
    document.getElementById("dtainicio").value = formatarDataInput(
      plantao.dtainicio
    );
    document.getElementById("dtafinal").value = formatarDataInput(
      plantao.dtafinal
    );
    document.getElementById("analista").value = plantao.analista;
    document.getElementById("diaSemana").value = plantao.dia_semana || "";
    document.getElementById("observacao").value = plantao.observacao || "";

    // Mostrar e preencher checkbox finalizado
    document.getElementById("divFinalizado").style.display = "block";
    document.getElementById("indFinalizado").checked =
      plantao.ind_finalizado === "S";

    document.getElementById("modalPlantao").classList.add("show");
  } catch (error) {
    console.error("Erro ao buscar plantão:", error);
    mostrarMensagem("Erro ao buscar plantão", "erro");
  }
}

async function salvarPlantao() {
  const id = document.getElementById("plantaoId").value;
  const dtainicio = document.getElementById("dtainicio").value;
  const dtafinal = document.getElementById("dtafinal").value;
  const analista = document.getElementById("analista").value;
  const dia_semana = document.getElementById("diaSemana").value;
  const observacao = document.getElementById("observacao").value.trim();
  const ind_finalizado =
    modoEdicao && document.getElementById("indFinalizado").checked ? "S" : "N";

  if (!dtainicio || !dtafinal || !analista) {
    mostrarMensagem(
      "Data início, data final e analista são obrigatórios",
      "erro"
    );
    return;
  }

  const dados = {
    dtainicio,
    dtafinal,
    analista,
    dia_semana: dia_semana || null,
    observacao: observacao || null,
    ind_finalizado,
  };

  try {
    const url = modoEdicao ? `/api/plantao/${id}` : "/api/plantao";
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
      mostrarMensagem(data.mensagem, "sucesso");
      fecharModal();
      await carregarPlantoes();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao salvar plantão:", error);
    mostrarMensagem("Erro ao salvar plantão", "erro");
  }
}

async function excluirPlantao(id) {
  if (!confirm("Tem certeza que deseja excluir este plantão?")) {
    return;
  }

  try {
    const response = await fetch(`/api/plantao/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      await carregarPlantoes();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao excluir plantão:", error);
    mostrarMensagem("Erro ao excluir plantão", "erro");
  }
}

function mostrarMensagem(texto, tipo) {
  const mensagemDiv = document.getElementById("mensagem");
  mensagemDiv.textContent = texto;
  mensagemDiv.className = `mensagem ${tipo}`;

  setTimeout(() => {
    mensagemDiv.className = "mensagem";
  }, 5000);
}

function formatarData(dataStr) {
  if (!dataStr) return "-";

  // Se a data já vier no formato YYYY-MM-DD
  const partes = dataStr.split("T")[0].split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  return "-";
}

function formatarDataInput(dataStr) {
  if (!dataStr) return "";

  // Retorna apenas a parte YYYY-MM-DD para o input type="date"
  return dataStr.split("T")[0];
}
