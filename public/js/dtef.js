import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

let usuarioLogado = null;
let senhaParaExcluir = null;
let modoEdicao = false;
let cnpjEdicao = null;

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

    // Mostrar botão de nova senha apenas para admin
    if (data.usuario.admin) {
      document.getElementById("btnNovaSenha").style.display = "block";
    }

    // Carregar senhas
    await carregarSenhas();
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
});

// Carregar senhas com filtro opcional
async function carregarSenhas(search = "") {
  try {
    document.getElementById("loading").style.display = "block";
    document.getElementById("listaSenhas").innerHTML = "";
    document.getElementById("mensagemVazia").style.display = "none";

    const url = search
      ? `/api/dtef/senhas?search=${encodeURIComponent(search)}`
      : "/api/dtef/senhas";

    const response = await fetch(url);
    const data = await response.json();

    document.getElementById("loading").style.display = "none";

    if (!data.sucesso) {
      mostrarMensagem("Erro ao carregar senhas", "erro");
      return;
    }

    const listaSenhas = document.getElementById("listaSenhas");

    if (data.senhas.length === 0) {
      document.getElementById("mensagemVazia").style.display = "block";
      return;
    }

    listaSenhas.innerHTML = data.senhas
      .map((senha) => {
        const cnpjFormatado = formatarCNPJ(senha.cnpj);
        const senhaOculta = "•".repeat(senha.pass.length);

        return `
        <div class="senha-card" data-cnpj="${senha.cnpj}">
          <div class="senha-header">
            <h3>${senha.loja || "Sem nome"}</h3>
            ${
              usuarioLogado.admin
                ? `
              <div class="senha-acoes">
                <button class="btn-icon btn-editar" onclick="editarSenha('${
                  senha.cnpj
                }')" title="Editar">
                  ✏️
                </button>
                <button class="btn-icon btn-excluir" onclick="confirmarExclusao('${
                  senha.cnpj
                }', '${senha.loja || "Sem nome"}')" title="Excluir">
                  🗑️
                </button>
              </div>
            `
                : ""
            }
          </div>
          <div class="senha-info">
            <div class="info-item">
              <label>CNPJ:</label>
              <span>${cnpjFormatado}</span>
            </div>
            <div class="info-item senha-valor-item">
              <label>Senha:</label>
              <div class="senha-valor-group">
                <span class="senha-valor" data-senha="${
                  senha.pass
                }">${senhaOculta}</span>
                <button class="btn-icon btn-ver-senha" onclick="toggleSenha(this)" title="Mostrar/Ocultar">
                  👁️
                </button>
                <button class="btn-icon btn-copiar" onclick="copiarSenha('${
                  senha.pass
                }')" title="Copiar">
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Erro ao carregar senhas:", error);
    document.getElementById("loading").style.display = "none";
    mostrarMensagem("Erro ao carregar senhas", "erro");
  }
}

// Formatar CNPJ
function formatarCNPJ(cnpj) {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

// Toggle visualização de senha na lista
window.toggleSenha = function (button) {
  const senhaSpan = button.previousElementSibling;
  const senhaReal = senhaSpan.dataset.senha;

  if (senhaSpan.textContent.includes("•")) {
    senhaSpan.textContent = senhaReal;
    button.textContent = "🙈";
  } else {
    senhaSpan.textContent = "•".repeat(senhaReal.length);
    button.textContent = "👁️";
  }
};

// Copiar senha
window.copiarSenha = function (senha) {
  // Tentar usar a API moderna do clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(senha)
      .then(() => {
        mostrarMensagem("Senha copiada!", "sucesso");
      })
      .catch((err) => {
        console.error("Erro ao copiar:", err);
        // Fallback para método antigo
        copiarSenhaFallback(senha);
      });
  } else {
    // Fallback para navegadores antigos
    copiarSenhaFallback(senha);
  }
};

// Método fallback para copiar senha
function copiarSenhaFallback(senha) {
  const textarea = document.createElement("textarea");
  textarea.value = senha;
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const sucesso = document.execCommand("copy");
    if (sucesso) {
      mostrarMensagem("Senha copiada!", "sucesso");
    } else {
      mostrarMensagem("Erro ao copiar senha", "erro");
    }
  } catch (err) {
    console.error("Erro ao copiar:", err);
    mostrarMensagem("Erro ao copiar senha", "erro");
  }

  document.body.removeChild(textarea);
}

// Pesquisa
document.getElementById("inputPesquisa").addEventListener("input", (e) => {
  const search = e.target.value.trim();
  carregarSenhas(search);

  const btnLimpar = document.getElementById("btnLimparPesquisa");
  btnLimpar.style.display = search ? "block" : "none";
});

document.getElementById("btnLimparPesquisa").addEventListener("click", () => {
  document.getElementById("inputPesquisa").value = "";
  document.getElementById("btnLimparPesquisa").style.display = "none";
  carregarSenhas();
});

// Modal - Nova Senha
document.getElementById("btnNovaSenha").addEventListener("click", () => {
  modoEdicao = false;
  cnpjEdicao = null;
  document.getElementById("tituloModal").textContent = "Nova Senha DTEF";
  document.getElementById("inputCnpj").disabled = false;
  document.getElementById("formSenha").reset();
  document.getElementById("modalSenha").style.display = "flex";
});

// Modal - Fechar
document.getElementById("btnFecharModal").addEventListener("click", () => {
  document.getElementById("modalSenha").style.display = "none";
});

document.getElementById("btnCancelar").addEventListener("click", () => {
  document.getElementById("modalSenha").style.display = "none";
});

// Toggle senha no modal
document.getElementById("btnToggleSenha").addEventListener("click", () => {
  const input = document.getElementById("inputSenha");
  const btn = document.getElementById("btnToggleSenha");

  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁️";
  }
});

// Validar CNPJ (apenas números)
document.getElementById("inputCnpj").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

// Salvar senha (criar ou editar)
document.getElementById("formSenha").addEventListener("submit", async (e) => {
  e.preventDefault();

  const cnpj = document.getElementById("inputCnpj").value.trim();
  const loja = document.getElementById("inputLoja").value.trim();
  const pass = document.getElementById("inputSenha").value.trim();

  if (cnpj.length !== 14) {
    mostrarMensagem("CNPJ deve ter 14 dígitos", "erro");
    return;
  }

  if (!pass) {
    mostrarMensagem("Senha é obrigatória", "erro");
    return;
  }

  try {
    const url = modoEdicao
      ? `/api/dtef/senhas/${cnpjEdicao}`
      : "/api/dtef/senhas";
    const method = modoEdicao ? "PUT" : "POST";

    const body = modoEdicao ? { loja, pass } : { cnpj, loja, pass };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      document.getElementById("modalSenha").style.display = "none";
      await carregarSenhas();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao salvar senha:", error);
    mostrarMensagem("Erro ao salvar senha", "erro");
  }
});

// Editar senha
window.editarSenha = async function (cnpj) {
  try {
    const response = await fetch(`/api/dtef/senhas/${cnpj}`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem("Senha não encontrada", "erro");
      return;
    }

    modoEdicao = true;
    cnpjEdicao = cnpj;

    document.getElementById("tituloModal").textContent = "Editar Senha DTEF";
    document.getElementById("inputCnpj").value = data.senha.cnpj;
    document.getElementById("inputCnpj").disabled = true;
    document.getElementById("inputLoja").value = data.senha.loja || "";
    document.getElementById("inputSenha").value = data.senha.pass;

    document.getElementById("modalSenha").style.display = "flex";
  } catch (error) {
    console.error("Erro ao carregar senha:", error);
    mostrarMensagem("Erro ao carregar senha", "erro");
  }
};

// Confirmar exclusão
window.confirmarExclusao = function (cnpj, loja) {
  senhaParaExcluir = cnpj;
  document.getElementById("confirmacaoLoja").textContent = loja;
  document.getElementById("confirmacaoCnpj").textContent = formatarCNPJ(cnpj);
  document.getElementById("modalConfirmacao").style.display = "flex";
};

document
  .getElementById("btnFecharConfirmacao")
  .addEventListener("click", () => {
    document.getElementById("modalConfirmacao").style.display = "none";
    senhaParaExcluir = null;
  });

document.getElementById("btnCancelarExclusao").addEventListener("click", () => {
  document.getElementById("modalConfirmacao").style.display = "none";
  senhaParaExcluir = null;
});

document
  .getElementById("btnConfirmarExclusao")
  .addEventListener("click", async () => {
    if (!senhaParaExcluir) return;

    try {
      const response = await fetch(`/api/dtef/senhas/${senhaParaExcluir}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.sucesso) {
        mostrarMensagem(data.mensagem, "sucesso");
        document.getElementById("modalConfirmacao").style.display = "none";
        senhaParaExcluir = null;
        await carregarSenhas();
      } else {
        mostrarMensagem(data.mensagem, "erro");
      }
    } catch (error) {
      console.error("Erro ao excluir senha:", error);
      mostrarMensagem("Erro ao excluir senha", "erro");
    }
  });

// Mensagem toast
function mostrarMensagem(texto, tipo = "info") {
  const mensagem = document.createElement("div");
  mensagem.className = `toast toast-${tipo}`;
  mensagem.textContent = texto;

  document.body.appendChild(mensagem);

  setTimeout(() => {
    mensagem.classList.add("show");
  }, 10);

  setTimeout(() => {
    mensagem.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(mensagem);
    }, 300);
  }, 3000);
}
