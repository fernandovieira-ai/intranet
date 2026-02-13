let modoEdicao = false;

// Verificar sessão e carregar informativos ao iniciar
window.addEventListener("load", async () => {
  // Verificar se está logado e é admin
  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (!data.logado) {
      alert("Você precisa fazer login primeiro!");
      window.location.href = "index.html";
      return;
    }

    if (!data.usuario.admin) {
      alert(
        "Acesso negado. Apenas administradores podem gerenciar informativos."
      );
      window.location.href = "dashboard.html";
      return;
    }

    // Se passou nas verificações, carrega os informativos
    await carregarInformativos();
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
});

// Abrir modal de novo informativo
document.getElementById("btnNovoInformativo").addEventListener("click", () => {
  modoEdicao = false;
  document.getElementById("modalTitle").textContent = "Novo Informativo";
  document.getElementById("informativoId").value = "";
  document.getElementById("formInformativo").reset();
  document.getElementById("modalInformativo").classList.add("show");
});

// Fechar modal
document.querySelector(".modal-close").addEventListener("click", fecharModal);
document.getElementById("btnCancelar").addEventListener("click", fecharModal);

// Fechar modal ao clicar fora
document.getElementById("modalInformativo").addEventListener("click", (e) => {
  if (e.target.id === "modalInformativo") {
    fecharModal();
  }
});

// Submeter formulário
document
  .getElementById("formInformativo")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    await salvarInformativo();
  });

function fecharModal() {
  document.getElementById("modalInformativo").classList.remove("show");
}

async function carregarInformativos() {
  try {
    const response = await fetch("/api/informativos/todos");
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      if (response.status === 403 || response.status === 401) {
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 2000);
      }
      return;
    }

    renderizarInformativos(data.informativos);
  } catch (error) {
    console.error("Erro ao carregar informativos:", error);
    mostrarMensagem("Erro ao carregar informativos", "erro");
  }
}

function renderizarInformativos(informativos) {
  const tbody = document.getElementById("informativosTableBody");

  if (informativos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="loading">Nenhum informativo cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = informativos
    .map((inf) => {
      const dataValidade = inf.dta_validade
        ? new Date(inf.dta_validade + "T00:00:00")
        : null;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const isExpirado = dataValidade && dataValidade < hoje;
      const dataFormatada = dataValidade
        ? dataValidade.toLocaleDateString("pt-BR")
        : "Sem validade";

      const descricaoTruncada =
        inf.descricao.length > 80
          ? inf.descricao.substring(0, 80) + "..."
          : inf.descricao;

      return `
        <tr>
          <td><strong>${inf.titulo}</strong></td>
          <td>${descricaoTruncada}</td>
          <td>${dataFormatada}</td>
          <td>
            <span class="badge ${isExpirado ? "expirado" : "ativo"}">
              ${isExpirado ? "Expirado" : "Ativo"}
            </span>
          </td>
          <td>
            <button class="btn-action edit" data-id="${
              inf.id
            }">✏️ Editar</button>
            <button class="btn-action delete" data-id="${
              inf.id
            }" data-titulo="${inf.titulo}">🗑️ Excluir</button>
          </td>
        </tr>
      `;
    })
    .join("");

  // Adicionar event listeners aos botões
  tbody.querySelectorAll(".btn-action.edit").forEach((btn) => {
    btn.addEventListener("click", () => editarInformativo(btn.dataset.id));
  });

  tbody.querySelectorAll(".btn-action.delete").forEach((btn) => {
    btn.addEventListener("click", () =>
      excluirInformativo(btn.dataset.id, btn.dataset.titulo)
    );
  });
}

async function editarInformativo(id) {
  try {
    const response = await fetch(`/api/informativos/${id}`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    const inf = data.informativo;

    modoEdicao = true;
    document.getElementById("modalTitle").textContent = "Editar Informativo";
    document.getElementById("informativoId").value = inf.id;
    document.getElementById("titulo").value = inf.titulo;
    document.getElementById("descricao").value = inf.descricao;

    if (inf.dta_validade) {
      document.getElementById("dtaValidade").value = inf.dta_validade;
    } else {
      document.getElementById("dtaValidade").value = "";
    }

    document.getElementById("modalInformativo").classList.add("show");
  } catch (error) {
    console.error("Erro ao buscar informativo:", error);
    mostrarMensagem("Erro ao buscar informativo", "erro");
  }
}

async function salvarInformativo() {
  const id = document.getElementById("informativoId").value;
  const titulo = document.getElementById("titulo").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const dtaValidade = document.getElementById("dtaValidade").value;

  if (!titulo || !descricao) {
    mostrarMensagem("Título e descrição são obrigatórios", "erro");
    return;
  }

  const dados = {
    titulo,
    descricao,
    dta_validade: dtaValidade || null,
  };

  console.log("Enviando dados:", dados);

  try {
    const url = modoEdicao ? `/api/informativos/${id}` : "/api/informativos";
    const method = modoEdicao ? "PUT" : "POST";

    console.log("URL:", url, "Method:", method);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      fecharModal();
      await carregarInformativos();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao salvar informativo:", error);
    mostrarMensagem("Erro ao salvar informativo", "erro");
  }
}

async function excluirInformativo(id, titulo) {
  if (!confirm(`Tem certeza que deseja excluir o informativo "${titulo}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/informativos/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      await carregarInformativos();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao excluir informativo:", error);
    mostrarMensagem("Erro ao excluir informativo", "erro");
  }
}

function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById("mensagem");
  mensagem.textContent = texto;
  mensagem.className = `mensagem show ${tipo}`;

  setTimeout(() => {
    mensagem.classList.remove("show");
  }, 3000);
}
