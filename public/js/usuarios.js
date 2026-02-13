import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

let modoEdicao = false;
let isAdmin = false;
let usuarioLogadoId = null;
let fotoSelecionada = null;
let usuarioEditandoId = null;

// Carregar usuários ao iniciar
window.addEventListener("load", async () => {
  // Header e sidebar já estão no HTML
  await atualizarHeaderUsuario();
  configurarLogout();
  inicializarMenuLateral();

  carregarUsuarios();
  configurarUploadFoto();
});

// Abrir modal de novo usuário
document.getElementById("btnNovoUsuario").addEventListener("click", () => {
  modoEdicao = false;
  document.getElementById("modalTitle").textContent = "Novo Usuário";
  document.getElementById("usuarioId").value = "";
  document.getElementById("formUsuario").reset();
  document.getElementById("indAtivo").checked = true;
  document.getElementById("senhaOpcional").style.display = "none";
  document.getElementById("senhaUsuario").required = true;
  document.getElementById("modalUsuario").classList.add("show");
});

// Fechar modal
document.querySelector(".modal-close").addEventListener("click", fecharModal);
document.getElementById("btnCancelar").addEventListener("click", fecharModal);

// Prevenir propagação de cliques dentro do modal-content
document
  .querySelector("#modalUsuario .modal-content")
  .addEventListener("click", (e) => {
    e.stopPropagation();
  });

// Fechar modal ao clicar fora - APENAS no backdrop, não em elementos internos
document.getElementById("modalUsuario").addEventListener("click", (e) => {
  // Verifica se o clique foi exatamente no backdrop (modalUsuario) e não em um filho
  if (e.target === e.currentTarget && e.target.id === "modalUsuario") {
    fecharModal();
  }
});

// Submeter formulário
document.getElementById("formUsuario").addEventListener("submit", async (e) => {
  e.preventDefault();
  await salvarUsuario();
});

function fecharModal() {
  document.getElementById("modalUsuario").classList.remove("show");
}

async function carregarUsuarios() {
  try {
    // Primeiro tenta carregar todos os usuários (só funciona se for admin)
    let response = await fetch("/api/usuarios");

    // Se não for admin (403), carrega apenas o próprio perfil
    if (response.status === 403) {
      console.log("Usuário não é admin, carregando perfil próprio...");
      response = await fetch("/api/usuarios/meu-perfil");
      const data = await response.json();

      if (data.sucesso) {
        isAdmin = false;
        usuarioLogadoId = data.usuario.id;
        renderizarUsuarios([data.usuario]);

        // Ocultar botão de novo usuário para não-admin
        const btnNovo = document.getElementById("btnNovoUsuario");
        if (btnNovo) btnNovo.style.display = "none";
        return;
      } else {
        mostrarMensagem(data.mensagem || "Erro ao carregar perfil", "erro");
        return;
      }
    }

    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      if (response.status === 401) {
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      }
      return;
    }

    isAdmin = data.isAdmin !== undefined ? data.isAdmin : true;
    renderizarUsuarios(data.usuarios);
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    mostrarMensagem("Erro ao carregar usuários", "erro");
  }
}

function renderizarUsuarios(usuarios) {
  const tbody = document.getElementById("usuariosTableBody");

  if (usuarios.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="loading">Nenhum usuário encontrado</td></tr>';
    return;
  }

  tbody.innerHTML = usuarios
    .map(
      (user) => `
        <tr>
            <td><strong>${user.nom_usuario}</strong></td>
            <td>${user.email || "-"}</td>
            <td>${user.fone || "-"}</td>
            <td>
                ${
                  user.ind_bloqueado === "S"
                    ? '<span class="badge bloqueado">Bloqueado</span>'
                    : ""
                }
                ${
                  user.ind_ativo === "S"
                    ? '<span class="badge ativo">Ativo</span>'
                    : '<span class="badge inativo">Inativo</span>'
                }
            </td>
            <td>
                ${
                  user.ind_adm === "S"
                    ? '<span class="badge admin">Admin</span>'
                    : "-"
                }
            </td>
            <td>
                <button class="btn-action edit" data-id="${
                  user.id
                }">✏️ Editar</button>
                ${
                  isAdmin
                    ? `<button class="btn-action delete" data-id="${user.id}" data-nome="${user.nom_usuario}">🗑️ Excluir</button>`
                    : ""
                }
            </td>
        </tr>
    `
    )
    .join("");

  // Adicionar event listeners aos botões
  tbody.querySelectorAll(".btn-action.edit").forEach((btn) => {
    btn.addEventListener("click", () => editarUsuario(btn.dataset.id));
  });

  tbody.querySelectorAll(".btn-action.delete").forEach((btn) => {
    btn.addEventListener("click", () =>
      excluirUsuario(btn.dataset.id, btn.dataset.nome)
    );
  });
}

async function editarUsuario(id) {
  try {
    const response = await fetch(`/api/usuarios/${id}`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem, "erro");
      return;
    }

    const user = data.usuario;

    modoEdicao = true;
    document.getElementById("modalTitle").textContent = "Editar Usuário";
    document.getElementById("usuarioId").value = user.id;
    document.getElementById("nomUsuario").value = user.nom_usuario;
    document.getElementById("senhaUsuario").value = "";
    document.getElementById("emailUsuario").value = user.email || "";
    document.getElementById("foneUsuario").value = user.fone || "";
    document.getElementById("chavePix").value = user.chave_pix || "";
    document.getElementById("usuarioTac").value = user.usuario_tac || "";
    document.getElementById("senhaTac").value = user.senha_tac || "";
    document.getElementById("indAtivo").checked = user.ind_ativo === "S";
    document.getElementById("indBloqueado").checked =
      user.ind_bloqueado === "S";
    document.getElementById("indAdm").checked = user.ind_adm === "S";

    // Carregar foto de perfil
    const fotoPreview = document.getElementById("fotoPreview");
    const btnRemover = document.getElementById("btnRemoverFoto");
    console.log(
      "Usuário carregado - ID:",
      user.id,
      "Tem foto:",
      user.foto_perfil
    );
    if (user.foto_perfil) {
      // Buscar foto do banco via API com timestamp para evitar cache
      const timestamp = new Date().getTime();
      const fotoUrl = `/api/usuarios/${user.id}/foto?t=${timestamp}`;
      console.log("Carregando foto da URL:", fotoUrl);

      // Adicionar listeners para debug
      fotoPreview.onload = () => console.log("Foto carregada com sucesso!");
      fotoPreview.onerror = (e) => console.error("Erro ao carregar foto:", e);

      fotoPreview.src = fotoUrl;
      btnRemover.style.display = "inline-block";
    } else {
      console.log("Usuário não tem foto, usando avatar padrão");
      fotoPreview.src = "/images/default-avatar.svg";
      btnRemover.style.display = "none";
    }

    fotoSelecionada = null;
    document.getElementById("fotoInput").value = ""; // Limpar input de arquivo
    usuarioEditandoId = user.id;

    // Desabilitar campos administrativos para não-admin
    if (!isAdmin) {
      document.getElementById("indAtivo").disabled = true;
      document.getElementById("indBloqueado").disabled = true;
      document.getElementById("indAdm").disabled = true;
    } else {
      document.getElementById("indAtivo").disabled = false;
      document.getElementById("indBloqueado").disabled = false;
      document.getElementById("indAdm").disabled = false;
    }

    document.getElementById("senhaOpcional").style.display = "inline";
    document.getElementById("senhaUsuario").required = false;
    document.getElementById("modalUsuario").classList.add("show");
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    mostrarMensagem("Erro ao buscar usuário", "erro");
  }
}

async function salvarUsuario() {
  const id = document.getElementById("usuarioId").value;
  const nomUsuario = document.getElementById("nomUsuario").value.trim();
  const senha = document.getElementById("senhaUsuario").value;
  const email = document.getElementById("emailUsuario").value.trim();
  const fone = document.getElementById("foneUsuario").value.trim();
  const chavePix = document.getElementById("chavePix").value.trim();
  const usuarioTac = document.getElementById("usuarioTac").value.trim();
  const senhaTac = document.getElementById("senhaTac").value.trim();
  const indAtivo = document.getElementById("indAtivo").checked ? "S" : "N";
  const indBloqueado = document.getElementById("indBloqueado").checked
    ? "S"
    : "N";
  const indAdm = document.getElementById("indAdm").checked ? "S" : "N";

  if (!nomUsuario) {
    mostrarMensagem("Nome de usuário é obrigatório", "erro");
    return;
  }

  if (!modoEdicao && !senha) {
    mostrarMensagem("Senha é obrigatória para novo usuário", "erro");
    return;
  }

  const dados = {
    nom_usuario: nomUsuario,
    email: email || null,
    fone: fone || null,
    chave_pix: chavePix || null,
    usuario_tac: usuarioTac || null,
    senha_tac: senhaTac || null,
    ind_ativo: indAtivo,
    ind_bloqueado: indBloqueado,
    ind_adm: indAdm,
  };

  if (senha) {
    dados.senha = senha;
  }

  try {
    const url = modoEdicao ? `/api/usuarios/${id}` : "/api/usuarios";
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
      // Upload da foto se houver
      const usuarioId = modoEdicao ? id : data.usuario.id;
      console.log(
        "Salvando usuário - ID:",
        usuarioId,
        "Foto selecionada:",
        !!fotoSelecionada
      );
      if (fotoSelecionada) {
        console.log("Fazendo upload da foto...");
        const uploadSucesso = await uploadFoto(usuarioId);
        console.log("Upload concluído:", uploadSucesso);
        if (uploadSucesso) {
          mostrarMensagem("Usuário e foto salvos com sucesso!", "sucesso");
        } else {
          mostrarMensagem(data.mensagem + " (Erro ao salvar foto)", "aviso");
        }
        // Aguardar um pouco para garantir que o banco de dados foi atualizado
        await new Promise((resolve) => setTimeout(resolve, 300));
      } else {
        mostrarMensagem(data.mensagem, "sucesso");
      }

      fecharModal();
      await carregarUsuarios();

      // Resetar foto
      fotoSelecionada = null;
      document.getElementById("fotoPreview").src = "/images/default-avatar.svg";
      document.getElementById("btnRemoverFoto").style.display = "none";
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    mostrarMensagem("Erro ao salvar usuário", "erro");
  }
}

async function excluirUsuario(id, nome) {
  if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      await carregarUsuarios();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    mostrarMensagem("Erro ao excluir usuário", "erro");
  }
}

function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById("mensagem");
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;

  setTimeout(() => {
    mensagem.className = "mensagem";
  }, 5000);
}

// Configurar upload de foto
function configurarUploadFoto() {
  const fotoInput = document.getElementById("fotoInput");
  const fotoPreview = document.getElementById("fotoPreview");
  const btnRemover = document.getElementById("btnRemoverFoto");

  fotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    console.log("Arquivo selecionado:", file ? file.name : "nenhum");
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        mostrarMensagem("Por favor, selecione uma imagem válida", "erro");
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        mostrarMensagem("A imagem deve ter no máximo 5MB", "erro");
        return;
      }

      console.log("Arquivo válido, tamanho:", file.size, "bytes");
      fotoSelecionada = file;

      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("Preview da foto carregado");
        fotoPreview.src = e.target.result;
        btnRemover.style.display = "inline-block";
      };
      reader.readAsDataURL(file);
    }
  });

  btnRemover.addEventListener("click", () => {
    console.log("Removendo foto selecionada");
    fotoPreview.src = "/images/default-avatar.svg";
    fotoInput.value = "";
    fotoSelecionada = null;
    btnRemover.style.display = "none";
  });
}

// Fazer upload da foto
async function uploadFoto(usuarioId) {
  if (!fotoSelecionada) return true;

  console.log("Iniciando upload da foto para usuário:", usuarioId);

  // Converter arquivo para base64
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.onload = async (e) => {
      const fotoBase64 = e.target.result;
      console.log("Foto convertida para base64, tamanho:", fotoBase64.length);

      try {
        const response = await fetch(`/api/usuarios/${usuarioId}/upload-foto`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fotoBase64 }),
        });

        const data = await response.json();
        console.log("Resposta do servidor:", data);

        if (!data.sucesso) {
          mostrarMensagem(
            data.mensagem || "Erro ao fazer upload da foto",
            "erro"
          );
          resolve(false);
        } else {
          mostrarMensagem("Foto salva com sucesso!", "sucesso");
          resolve(true);
        }
      } catch (error) {
        console.error("Erro ao fazer upload da foto:", error);
        mostrarMensagem("Erro ao fazer upload da foto", "erro");
        resolve(false);
      }
    };

    reader.onerror = (error) => {
      console.error("Erro ao ler arquivo:", error);
      resolve(false);
    };

    reader.readAsDataURL(fotoSelecionada);
  });
}
