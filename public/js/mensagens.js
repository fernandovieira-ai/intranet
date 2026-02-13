// Gerenciamento de mensagens do mural
let usuarioAtual = null;
let mensagens = [];

// Inicializar sistema de mensagens
export async function inicializarMensagens(usuario) {
  usuarioAtual = usuario;
  await carregarMensagens();
  configurarEventos();
}

// Configurar event listeners
function configurarEventos() {
  console.log("Configurando eventos de mensagens...");

  // Botão nova mensagem
  const btnNovaMensagem = document.getElementById("btnNovaMensagem");
  if (btnNovaMensagem) {
    console.log("Botão nova mensagem encontrado");
    btnNovaMensagem.addEventListener("click", abrirModalNovaMensagem);
  } else {
    console.error("Botão btnNovaMensagem não encontrado!");
  }

  // Fechar modal
  const btnFechar = document.getElementById("btnFecharModalMensagem");
  if (btnFechar) {
    btnFechar.addEventListener("click", fecharModalMensagem);
  }

  const btnCancelar = document.getElementById("btnCancelarMensagem");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", fecharModalMensagem);
  }

  // Preview de imagem
  const inputImagem = document.getElementById("inputMensagemImagem");
  if (inputImagem) {
    inputImagem.addEventListener("change", mostrarPreviewImagem);
  }

  const btnRemoverPreview = document.getElementById("btnRemoverImagemPreview");
  if (btnRemoverPreview) {
    btnRemoverPreview.addEventListener("click", removerPreviewImagem);
  }

  // Submit formulário
  const formMensagem = document.getElementById("formMensagem");
  if (formMensagem) {
    formMensagem.addEventListener("submit", salvarMensagem);
  }

  // Fechar modal ao clicar fora
  const modalMensagem = document.getElementById("modalMensagem");
  if (modalMensagem) {
    modalMensagem.addEventListener("click", (e) => {
      if (e.target.id === "modalMensagem") {
        fecharModalMensagem();
      }
    });
  }
}

// Carregar mensagens
async function carregarMensagens() {
  try {
    const response = await fetch("/api/mensagens");
    const data = await response.json();

    if (!data.sucesso) {
      mostrarErro("Erro ao carregar mensagens");
      return;
    }

    mensagens = data.mensagens;
    renderizarMensagens();
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
    mostrarErro("Erro ao carregar mensagens");
  }
}

// Renderizar mensagens
function renderizarMensagens() {
  const lista = document.getElementById("mensagensList");

  if (mensagens.length === 0) {
    lista.innerHTML = `
      <div class="mensagem-vazia">
        <div class="mensagem-vazia-icon">💬</div>
        <p>Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = mensagens
    .map((msg) => {
      const podeEditar = msg.username === usuarioAtual.nome;
      const podeExcluir = usuarioAtual.admin || msg.username === usuarioAtual.nome;
      const iniciais = msg.username.substring(0, 2).toUpperCase();
      const dataFormatada = formatarData(msg.created_at);
      const foiEditada = msg.updated_at !== msg.created_at;

      // Determinar se usa foto ou iniciais
      const avatarHtml = msg.foto_perfil && msg.usuario_id
        ? `<img src="/api/usuarios/${msg.usuario_id}/foto?t=${Date.now()}"
                alt="${msg.username}"
                class="mensagem-usuario-foto"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="mensagem-usuario-avatar" style="display:none;">${iniciais}</div>`
        : `<div class="mensagem-usuario-avatar">${iniciais}</div>`;

      return `
        <div class="mensagem-card">
          <div class="mensagem-header-info">
            <div class="mensagem-usuario">
              ${avatarHtml}
              <div class="mensagem-usuario-info">
                <div class="mensagem-usuario-nome">${msg.username}</div>
                <div class="mensagem-data">
                  ${dataFormatada}${foiEditada ? " (editada)" : ""}
                </div>
              </div>
            </div>

            ${
              podeEditar || podeExcluir
                ? `
              <div class="mensagem-acoes">
                ${
                  podeEditar
                    ? `<button class="btn-acao-mensagem btn-editar-mensagem" onclick="window.editarMensagem(${msg.id})" title="Editar">
                      ✏️
                    </button>`
                    : ""
                }
                ${
                  podeExcluir
                    ? `<button class="btn-acao-mensagem btn-excluir-mensagem" onclick="window.excluirMensagem(${msg.id})" title="Excluir">
                      🗑️
                    </button>`
                    : ""
                }
              </div>
            `
                : ""
            }
          </div>

          ${msg.mensagem ? `<div class="mensagem-texto">${msg.mensagem}</div>` : ""}

          ${
            msg.tem_imagem
              ? `
            <div class="mensagem-imagem">
              <img src="/api/mensagens/${msg.id}/imagem" alt="Imagem da mensagem" onclick="window.abrirImagemGrande('/api/mensagens/${msg.id}/imagem')"/>
            </div>
          `
              : ""
          }
        </div>
      `;
    })
    .join("");
}

// Abrir modal para nova mensagem
function abrirModalNovaMensagem() {
  console.log("Abrindo modal de nova mensagem...");

  const modal = document.getElementById("modalMensagem");
  console.log("Modal encontrado:", modal);

  if (!modal) {
    console.error("Modal não encontrado!");
    return;
  }

  document.getElementById("tituloModalMensagem").textContent = "Nova Mensagem";
  document.getElementById("formMensagem").reset();
  document.getElementById("mensagemEditarId").value = "";
  document.getElementById("removerImagemFlag").value = "false";

  const previewContainer = document.getElementById("previewImagemContainer");
  if (previewContainer) {
    previewContainer.style.display = "none";
  }

  modal.style.display = "flex";
  console.log("Modal display definido para flex");
}

// Editar mensagem
window.editarMensagem = async function (id) {
  const mensagem = mensagens.find((m) => m.id === id);
  if (!mensagem) return;

  // Verificar permissão
  if (mensagem.username !== usuarioAtual.nome) {
    alert("Você não tem permissão para editar esta mensagem");
    return;
  }

  document.getElementById("tituloModalMensagem").textContent = "Editar Mensagem";
  document.getElementById("inputMensagemTexto").value = mensagem.mensagem || "";
  document.getElementById("mensagemEditarId").value = id;
  document.getElementById("removerImagemFlag").value = "false";

  // Mostrar preview da imagem existente
  if (mensagem.tem_imagem) {
    document.getElementById("previewImagem").src = `/api/mensagens/${id}/imagem`;
    document.getElementById("previewImagemContainer").style.display = "block";
  } else {
    document.getElementById("previewImagemContainer").style.display = "none";
  }

  document.getElementById("modalMensagem").style.display = "flex";
};

// Excluir mensagem
window.excluirMensagem = async function (id) {
  const mensagem = mensagens.find((m) => m.id === id);
  if (!mensagem) return;

  // Verificar permissão
  if (!usuarioAtual.admin && mensagem.username !== usuarioAtual.nome) {
    alert("Você não tem permissão para excluir esta mensagem");
    return;
  }

  if (!confirm(`Tem certeza que deseja excluir esta mensagem?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/mensagens/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarSucesso("Mensagem excluída com sucesso!");
      await carregarMensagens();
    } else {
      mostrarErro(data.mensagem || "Erro ao excluir mensagem");
    }
  } catch (error) {
    console.error("Erro ao excluir mensagem:", error);
    mostrarErro("Erro ao excluir mensagem");
  }
};

// Fechar modal
function fecharModalMensagem() {
  const modal = document.getElementById("modalMensagem");
  if (modal) {
    modal.style.display = "none";
  }
}

// Preview de imagem
function mostrarPreviewImagem(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Arquivo muito grande. Máximo 5MB");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    document.getElementById("previewImagem").src = event.target.result;
    document.getElementById("previewImagemContainer").style.display = "block";
    document.getElementById("removerImagemFlag").value = "false";
  };
  reader.readAsDataURL(file);
}

// Remover preview de imagem
function removerPreviewImagem() {
  document.getElementById("inputMensagemImagem").value = "";
  document.getElementById("previewImagem").src = "";
  document.getElementById("previewImagemContainer").style.display = "none";
  document.getElementById("removerImagemFlag").value = "true";
}

// Salvar mensagem
async function salvarMensagem(e) {
  e.preventDefault();

  const mensagemId = document.getElementById("mensagemEditarId").value;
  const mensagemTexto = document.getElementById("inputMensagemTexto").value.trim();
  const imagemInput = document.getElementById("inputMensagemImagem");
  const removerImagem = document.getElementById("removerImagemFlag").value === "true";

  // Validar que tem pelo menos mensagem ou imagem
  if (!mensagemTexto && !imagemInput.files[0] && (!mensagemId || removerImagem)) {
    alert("Digite uma mensagem ou selecione uma imagem");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("mensagem", mensagemTexto);

    if (imagemInput.files[0]) {
      formData.append("imagem", imagemInput.files[0]);
    }

    if (removerImagem) {
      formData.append("remover_imagem", "true");
    }

    let response;
    if (mensagemId) {
      // Editar
      response = await fetch(`/api/mensagens/${mensagemId}`, {
        method: "PUT",
        body: formData,
      });
    } else {
      // Criar
      response = await fetch("/api/mensagens", {
        method: "POST",
        body: formData,
      });
    }

    const data = await response.json();

    if (data.sucesso) {
      mostrarSucesso(data.mensagem);
      fecharModalMensagem();
      await carregarMensagens();
    } else {
      mostrarErro(data.mensagem || "Erro ao salvar mensagem");
    }
  } catch (error) {
    console.error("Erro ao salvar mensagem:", error);
    mostrarErro("Erro ao salvar mensagem");
  }
}

// Abrir imagem em tamanho grande
window.abrirImagemGrande = function (url) {
  window.open(url, "_blank");
};

// Formatar data
function formatarData(dataString) {
  const data = new Date(dataString);
  const agora = new Date();
  const diff = agora - data;

  const segundos = Math.floor(diff / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 60) {
    return "Agora mesmo";
  } else if (minutos < 60) {
    return `Há ${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  } else if (horas < 24) {
    return `Há ${horas} hora${horas !== 1 ? "s" : ""}`;
  } else if (dias < 7) {
    return `Há ${dias} dia${dias !== 1 ? "s" : ""}`;
  } else {
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

// Mostrar mensagem de sucesso
function mostrarSucesso(texto) {
  // Você pode integrar com um sistema de notificações existente
  alert(texto);
}

// Mostrar mensagem de erro
function mostrarErro(texto) {
  // Você pode integrar com um sistema de notificações existente
  alert(texto);
}
