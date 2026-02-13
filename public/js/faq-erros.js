import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

// Variáveis globais
let sistemas = [];
let erros = [];
let modoEdicao = false;
let imagemSelecionada = null;
let erroEditandoId = null;

// Variáveis de paginação
let paginaAtual = 1;
let registrosPorPagina = 25;
let totalPaginas = 1;

// Função para calcular similaridade entre dois textos usando Levenshtein
function calcularSimilaridade(texto1, texto2) {
  // Normalizar textos: lowercase, remover acentos, espaços extras e pontuação
  const normalizar = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s]/g, "") // Remove pontuação
      .trim()
      .replace(/\s+/g, " "); // Remove espaços extras
  };

  const str1 = normalizar(texto1);
  const str2 = normalizar(texto2);

  // Se forem idênticos após normalização
  if (str1 === str2) return 100;

  // Se um contém o outro completamente
  if (str1.includes(str2) || str2.includes(str1)) {
    const minLen = Math.min(str1.length, str2.length);
    const maxLen = Math.max(str1.length, str2.length);
    return (minLen / maxLen) * 100;
  }

  // Calcular distância de Levenshtein
  const len1 = str1.length;
  const len2 = str2.length;

  // Otimização para textos muito longos
  if (len1 > 500 || len2 > 500) {
    // Para textos muito longos, usar apenas primeiras 500 caracteres
    return calcularSimilaridade(str1.substring(0, 500), str2.substring(0, 500));
  }

  // Matriz de distâncias
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deleção
        matrix[i][j - 1] + 1, // inserção
        matrix[i - 1][j - 1] + cost // substituição
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  const similaridade = ((maxLen - distance) / maxLen) * 100;

  return similaridade;
}

// Função para verificar similaridade de erro
function verificarSimilaridadeErro(novoErro, listaErros) {
  console.log(`\n=== Verificando similaridade ===`);
  console.log(`Novo Erro - Assunto: "${novoErro.des_assunto}"`);
  console.log(`Novo Erro - Mensagem: "${novoErro.des_erro}"`);
  console.log(`Comparando com ${listaErros.length} erros existentes\n`);

  let maiorSimilaridade = 0;
  let erroMaisSimilar = null;

  // Percorrer lista de erros existentes
  for (const erroExistente of listaErros) {
    // Ignorar se for o mesmo registro (no caso de edição)
    if (novoErro.id && erroExistente.id === novoErro.id) {
      continue;
    }

    // PRIORIDADE 1: Comparar des_erro (mensagem do erro) - mais importante
    const similaridadeErro = calcularSimilaridade(
      novoErro.des_erro,
      erroExistente.des_erro
    );

    // PRIORIDADE 2: Comparar des_assunto (título) - menos importante
    const similaridadeAssunto = calcularSimilaridade(
      novoErro.des_assunto,
      erroExistente.des_assunto
    );

    // Calcular similaridade ponderada (des_erro tem peso 70%, des_assunto tem peso 30%)
    const similaridadeTotal =
      similaridadeErro * 0.7 + similaridadeAssunto * 0.3;

    console.log(`  [ID ${erroExistente.id}] "${erroExistente.des_assunto}"`);
    console.log(`    → Similaridade Erro: ${Math.round(similaridadeErro)}%`);
    console.log(
      `    → Similaridade Assunto: ${Math.round(similaridadeAssunto)}%`
    );
    console.log(
      `    → Similaridade Total: ${Math.round(similaridadeTotal)}%\n`
    );

    // Guardar maior similaridade para log
    if (similaridadeTotal > maiorSimilaridade) {
      maiorSimilaridade = similaridadeTotal;
      erroMaisSimilar = erroExistente;
    }

    // Se similaridade total >= 75% OU se des_erro >= 85%, bloquear
    if (similaridadeTotal >= 75 || similaridadeErro >= 85) {
      console.log(`\n!!! BLOQUEADO: Similaridade encontrada !!!`);
      console.log(
        `Total: ${Math.round(similaridadeTotal)}% | Erro: ${Math.round(
          similaridadeErro
        )}%`
      );
      return {
        permitido: false,
        mensagem: `Erro muito parecido já existe (${Math.round(
          similaridadeTotal
        )}% similar):\n"${
          erroExistente.des_assunto
        }"\n\nMensagem do erro: ${Math.round(similaridadeErro)}% similar`,
        similaridade: Math.round(similaridadeTotal),
        similaridadeErro: Math.round(similaridadeErro),
        erroEncontrado: erroExistente,
      };
    }
  }

  console.log(
    `\n✅ PERMITIDO - Maior similaridade encontrada: ${Math.round(
      maiorSimilaridade
    )}%`
  );
  if (erroMaisSimilar) {
    console.log(`Erro mais similar: "${erroMaisSimilar.des_assunto}"`);
  }

  // Se não encontrou similar, permitir cadastro
  return {
    permitido: true,
    mensagem: "OK",
  };
}

// Carregar página
window.addEventListener("load", async () => {
  // Header e sidebar já estão no HTML
  await atualizarHeaderUsuario();
  configurarLogout();
  inicializarMenuLateral();

  await carregarSistemas();
  await carregarErros();
  configurarEventos();
});

// Configurar eventos
function configurarEventos() {
  // Botões principais
  document
    .getElementById("btnNovoErro")
    .addEventListener("click", abrirModalNovo);
  document
    .getElementById("btnPesquisar")
    .addEventListener("click", pesquisarErros);
  document
    .getElementById("btnLimparFiltros")
    .addEventListener("click", limparFiltros);

  // Modal
  document
    .getElementById("btnFecharModal")
    .addEventListener("click", fecharModal);
  document.getElementById("btnCancelar").addEventListener("click", fecharModal);
  document.getElementById("formErro").addEventListener("submit", salvarErro);

  // Modal de imagem
  document
    .getElementById("btnFecharModalImagem")
    .addEventListener("click", fecharModalImagem);

  // Modal de detalhes
  document
    .getElementById("btnFecharDetalhes")
    .addEventListener("click", fecharModalDetalhes);
  // Nota: O botão btnAmpliarDetalhes agora tem seu evento configurado dinamicamente na função abrirDetalhes()

  // Prevenir propagação de cliques dentro do modal-content
  document
    .querySelector("#modalErro .modal-content")
    .addEventListener("click", (e) => {
      e.stopPropagation();
    });

  document
    .querySelector("#modalDetalhes .modal-content")
    .addEventListener("click", (e) => {
      e.stopPropagation();
    });

  // Fechar modal ao clicar fora
  document.getElementById("modalErro").addEventListener("click", (e) => {
    if (e.target === e.currentTarget && e.target.id === "modalErro") {
      fecharModal();
    }
  });

  // Fechar modal de imagem ao clicar fora
  document.getElementById("modalImagem").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      fecharModalImagem();
    }
  });

  // Fechar modal de detalhes ao clicar fora
  document.getElementById("modalDetalhes").addEventListener("click", (e) => {
    if (e.target === e.currentTarget && e.target.id === "modalDetalhes") {
      fecharModalDetalhes();
    }
  });

  // Upload de imagem
  configurarUploadImagem();

  // Filtro de texto em tempo real
  document.getElementById("filtroTexto").addEventListener("input", () => {
    if (document.getElementById("filtroTexto").value === "") {
      pesquisarErros();
    }
  });

  // Paginação
  document
    .getElementById("registrosPorPagina")
    .addEventListener("change", (e) => {
      const valor = e.target.value;
      registrosPorPagina = valor === "all" ? 999999 : parseInt(valor);
      paginaAtual = 1;
      pesquisarErros();
    });

  document.getElementById("btnPrimeira").addEventListener("click", () => {
    paginaAtual = 1;
    renderizarPaginaAtual();
  });

  document.getElementById("btnAnterior").addEventListener("click", () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarPaginaAtual();
    }
  });

  document.getElementById("btnProxima").addEventListener("click", () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarPaginaAtual();
    }
  });

  document.getElementById("btnUltima").addEventListener("click", () => {
    paginaAtual = totalPaginas;
    renderizarPaginaAtual();
  });
}

// Carregar sistemas nos selects
async function carregarSistemas() {
  try {
    const response = await fetch("/api/faq/sistemas");
    const data = await response.json();

    if (data.sucesso) {
      sistemas = data.sistemas;

      const selectSistema = document.getElementById("nomSistema");
      const selectFiltro = document.getElementById("filtroSistema");

      // Limpar opções existentes
      selectSistema.innerHTML =
        '<option value="">Selecione um sistema</option>';
      selectFiltro.innerHTML = '<option value="">Todos os sistemas</option>';

      sistemas.forEach((sistema) => {
        const option1 = document.createElement("option");
        option1.value = sistema.nom_sistema;
        option1.textContent = sistema.nom_sistema;
        selectSistema.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = sistema.nom_sistema;
        option2.textContent = sistema.nom_sistema;
        selectFiltro.appendChild(option2);
      });
    } else {
      mostrarMensagem(data.mensagem || "Erro ao carregar sistemas", "erro");
    }
  } catch (error) {
    console.error("Erro ao carregar sistemas:", error);
    mostrarMensagem("Erro ao carregar sistemas", "erro");
  }
}

// Carregar erros na tabela
async function carregarErros(errosFiltrados = null) {
  const tbody = document.getElementById("errosTableBody");
  const totalBadge = document.getElementById("totalErros");

  try {
    let lista = errosFiltrados;

    if (errosFiltrados === null) {
      const response = await fetch("/api/faq/erros");
      const data = await response.json();

      if (data.sucesso) {
        erros = data.erros;
        lista = erros;
      } else {
        mostrarMensagem(data.mensagem || "Erro ao carregar erros", "erro");
        return;
      }
    }

    if (lista.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="loading">Nenhum erro encontrado</td></tr>';
      totalBadge.textContent = "0 erros";
      document.getElementById("paginacaoContainer").style.display = "none";
      return;
    }

    totalBadge.textContent = `${lista.length} erro${
      lista.length !== 1 ? "s" : ""
    }`;

    // Calcular paginação
    totalPaginas = Math.ceil(lista.length / registrosPorPagina);
    const inicio = (paginaAtual - 1) * registrosPorPagina;
    const fim = inicio + registrosPorPagina;
    const listaPaginada = lista.slice(inicio, fim);

    // Atualizar controles de paginação
    atualizarControlesPaginacao();

    tbody.innerHTML = listaPaginada
      .map(
        (erro) => `
          <tr data-erro-id="${erro.id}">
            <td>
              <span class="sistema-badge">${erro.nom_sistema}</span>
            </td>
            <td><strong>${erro.des_assunto}</strong></td>
            <td>
              <div class="descricao-cell" title="${erro.des_erro}">
                ${erro.des_erro}
              </div>
            </td>
            <td>
              <div class="descricao-cell" title="${erro.des_resolucao}">
                ${erro.des_resolucao}
              </div>
            </td>
            <td>
              ${
                erro.tem_arquivo
                  ? erro.tipo_arquivo === "pdf"
                    ? `<button class="btn-ver-imagem" onclick="window.verImagem(${erro.id})">
                        📄 Ver PDF
                      </button>`
                    : `<button class="btn-ver-imagem" onclick="window.verImagem(${erro.id})">
                        🖼️ Ver Imagem
                      </button>`
                  : '<span class="sem-imagem">Sem arquivo</span>'
              }
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-action edit" onclick="window.editarErro(${
                  erro.id
                })" title="Editar">
                  ✏️
                </button>
                <button class="btn-action delete" onclick="window.excluirErro(${
                  erro.id
                })" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");

    // Adicionar event listeners para abrir detalhes ao clicar na linha
    document
      .querySelectorAll("#errosTableBody tr[data-erro-id]")
      .forEach((row) => {
        row.addEventListener("click", (e) => {
          // Não abrir detalhes se clicou em um botão de ação
          if (
            e.target.closest(".btn-action") ||
            e.target.closest(".btn-ver-imagem") ||
            e.target.closest(".action-buttons")
          ) {
            return;
          }
          const erroId = parseInt(row.getAttribute("data-erro-id"));
          abrirDetalhes(erroId);
        });
      });
  } catch (error) {
    console.error("Erro ao carregar erros:", error);
    mostrarMensagem("Erro ao carregar erros", "erro");
  }
}

// Abrir modal para novo erro
function abrirModalNovo() {
  modoEdicao = false;
  erroEditandoId = null;
  document.getElementById("modalTitle").textContent =
    "Cadastro de Erro de Sistema";
  document.getElementById("formErro").reset();
  imagemSelecionada = null;
  document.getElementById("imagemNome").textContent =
    "Nenhuma imagem selecionada";
  document.getElementById("btnRemoverImagem").style.display = "none";
  document.getElementById("imagemPreviewContainer").style.display = "none";
  document.getElementById("modalErro").classList.add("show");
}

// Editar erro
window.editarErro = async function (id) {
  try {
    const response = await fetch(`/api/faq/erros/${id}`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem || "Erro ao carregar dados", "erro");
      return;
    }

    const erro = data.erro;

    modoEdicao = true;
    erroEditandoId = id;
    document.getElementById("modalTitle").textContent =
      "Editar Erro de Sistema";
    document.getElementById("nomSistema").value = erro.nom_sistema;
    document.getElementById("desAssunto").value = erro.des_assunto;
    document.getElementById("desErro").value = erro.des_erro;
    document.getElementById("desResolucao").value = erro.des_resolucao;

    if (erro.tem_arquivo) {
      const nomeArquivo =
        erro.tipo_arquivo === "pdf" ? "PDF carregado" : "Imagem carregada";
      document.getElementById("imagemNome").textContent = nomeArquivo;
      document.getElementById("btnRemoverImagem").style.display =
        "inline-block";

      // Preview apenas para imagens
      if (erro.tipo_arquivo !== "pdf") {
        document.getElementById("imagemPreviewContainer").style.display =
          "block";
        const timestamp = new Date().getTime();
        document.getElementById(
          "imagemPreview"
        ).src = `/api/faq/erros/${id}/arquivo?t=${timestamp}`;
      } else {
        document.getElementById("imagemPreviewContainer").style.display =
          "none";
      }

      imagemSelecionada = null; // Não alterar o arquivo existente a menos que o usuário selecione um novo
    } else {
      document.getElementById("imagemNome").textContent =
        "Nenhum arquivo selecionado";
      document.getElementById("btnRemoverImagem").style.display = "none";
      document.getElementById("imagemPreviewContainer").style.display = "none";
      imagemSelecionada = null;
    }

    document.getElementById("modalErro").classList.add("show");
  } catch (error) {
    console.error("Erro ao buscar erro:", error);
    mostrarMensagem("Erro ao buscar erro", "erro");
  }
};

// Excluir erro
window.excluirErro = async function (id) {
  const erro = erros.find((e) => e.id === id);
  if (!erro) return;

  if (!confirm(`Deseja realmente excluir o erro "${erro.des_assunto}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/faq/erros/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem("Erro excluído com sucesso!", "sucesso");
      await carregarErros();
    } else {
      mostrarMensagem(data.mensagem || "Erro ao excluir", "erro");
    }
  } catch (error) {
    console.error("Erro ao excluir erro:", error);
    mostrarMensagem("Erro ao excluir erro", "erro");
  }
};

// Salvar erro
async function salvarErro(e) {
  e.preventDefault();

  const nomSistema = document.getElementById("nomSistema").value;
  const desAssunto = document.getElementById("desAssunto").value.trim();
  const desErro = document.getElementById("desErro").value.trim();
  const desResolucao = document.getElementById("desResolucao").value.trim();

  if (!nomSistema || !desAssunto || !desErro || !desResolucao) {
    mostrarMensagem("Preencha todos os campos obrigatorios", "erro");
    return;
  }

  // Recarregar lista de erros antes de verificar duplicidade
  try {
    const responseErros = await fetch("/api/faq/erros");
    const dataErros = await responseErros.json();
    if (dataErros.sucesso) {
      erros = dataErros.erros;
      console.log(`Total de erros na base: ${erros.length}`);
    }
  } catch (error) {
    console.error("Erro ao carregar lista de erros:", error);
  }

  // Verificar similaridade com erros existentes (apenas para novos cadastros)
  if (!modoEdicao) {
    const novoErro = {
      id: null,
      nom_sistema: nomSistema,
      des_assunto: desAssunto,
      des_erro: desErro,
      des_resolucao: desResolucao,
    };

    console.log("Verificando similaridade para novo erro:");
    console.log("Assunto:", desAssunto);
    console.log("Erro:", desErro);

    const resultadoSimilaridade = verificarSimilaridadeErro(novoErro, erros);

    console.log("Resultado da verificacao:", resultadoSimilaridade);

    if (!resultadoSimilaridade.permitido) {
      // Mostrar alerta de erro duplicado
      alert(
        `⚠️ CADASTRO BLOQUEADO POR DUPLICIDADE!\n\n` +
          `${resultadoSimilaridade.mensagem}\n\n` +
          `═══════════════════════════════════\n` +
          `ERRO ENCONTRADO NA BASE:\n` +
          `═══════════════════════════════════\n` +
          `Sistema: ${resultadoSimilaridade.erroEncontrado.nom_sistema}\n` +
          `Assunto: ${resultadoSimilaridade.erroEncontrado.des_assunto}\n` +
          `ID: #${resultadoSimilaridade.erroEncontrado.id}\n\n` +
          `Similaridade da mensagem de erro: ${resultadoSimilaridade.similaridadeErro}%`
      );

      // Perguntar se deseja visualizar o erro encontrado
      const confirmar = confirm("Deseja visualizar o erro encontrado?");
      if (confirmar) {
        fecharModal();
        abrirDetalhes(resultadoSimilaridade.erroEncontrado.id);
      }
      // Se não confirmar, mantém o modal aberto para correção
      return;
    }
  }

  const dados = {
    nom_sistema: nomSistema,
    des_assunto: desAssunto,
    des_erro: desErro,
    des_resolucao: desResolucao,
  };

  try {
    let response;
    let novoId = null;

    if (modoEdicao) {
      response = await fetch(`/api/faq/erros/${erroEditandoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });
    } else {
      response = await fetch("/api/faq/erros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });
    }

    const data = await response.json();

    if (data.sucesso) {
      novoId = modoEdicao ? erroEditandoId : data.erro.id;

      // Upload da imagem se houver
      if (imagemSelecionada) {
        const uploadSucesso = await uploadImagem(novoId);
        if (uploadSucesso) {
          mostrarMensagem(
            modoEdicao
              ? "FAQ atualizado com sucesso!"
              : "FAQ cadastrado com sucesso!",
            "sucesso"
          );
        } else {
          mostrarMensagem(
            modoEdicao
              ? "FAQ atualizado, mas erro ao salvar imagem"
              : "FAQ cadastrado, mas erro ao salvar imagem",
            "aviso"
          );
        }
      } else {
        mostrarMensagem(
          modoEdicao
            ? "FAQ atualizado com sucesso!"
            : "FAQ cadastrado com sucesso!",
          "sucesso"
        );
      }

      fecharModal();
      await carregarErros();
    } else {
      mostrarMensagem(data.mensagem || "Erro ao salvar", "erro");
    }
  } catch (error) {
    console.error("Erro ao salvar erro:", error);
    mostrarMensagem("Erro ao salvar erro", "erro");
  }
}

// Fechar modal
function fecharModal() {
  document.getElementById("modalErro").classList.remove("show");
}

// Pesquisar erros
function pesquisarErros() {
  paginaAtual = 1; // Resetar para primeira página ao pesquisar
  const filtroSistema = document.getElementById("filtroSistema").value;
  const filtroTexto = document
    .getElementById("filtroTexto")
    .value.toLowerCase()
    .trim();

  let errosFiltrados = erros;

  if (filtroSistema) {
    errosFiltrados = errosFiltrados.filter(
      (e) => e.nom_sistema === filtroSistema
    );
  }

  if (filtroTexto) {
    errosFiltrados = errosFiltrados.filter(
      (e) =>
        e.des_assunto.toLowerCase().includes(filtroTexto) ||
        e.des_erro.toLowerCase().includes(filtroTexto)
    );
  }

  carregarErros(errosFiltrados);
}

// Limpar filtros
function limparFiltros() {
  document.getElementById("filtroSistema").value = "";
  document.getElementById("filtroTexto").value = "";
  paginaAtual = 1;
  carregarErros();
}

// Atualizar controles de paginação
function atualizarControlesPaginacao() {
  const paginacaoContainer = document.getElementById("paginacaoContainer");
  const infoPagina = document.getElementById("infoPagina");
  const btnPrimeira = document.getElementById("btnPrimeira");
  const btnAnterior = document.getElementById("btnAnterior");
  const btnProxima = document.getElementById("btnProxima");
  const btnUltima = document.getElementById("btnUltima");

  if (totalPaginas <= 1) {
    paginacaoContainer.style.display = "none";
    return;
  }

  paginacaoContainer.style.display = "flex";
  infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;

  btnPrimeira.disabled = paginaAtual === 1;
  btnAnterior.disabled = paginaAtual === 1;
  btnProxima.disabled = paginaAtual === totalPaginas;
  btnUltima.disabled = paginaAtual === totalPaginas;
}

// Renderizar página atual
function renderizarPaginaAtual() {
  const filtroSistema = document.getElementById("filtroSistema").value;
  const filtroTexto = document
    .getElementById("filtroTexto")
    .value.toLowerCase()
    .trim();

  let errosFiltrados = erros;

  if (filtroSistema) {
    errosFiltrados = errosFiltrados.filter(
      (e) => e.nom_sistema === filtroSistema
    );
  }

  if (filtroTexto) {
    errosFiltrados = errosFiltrados.filter(
      (e) =>
        e.des_assunto.toLowerCase().includes(filtroTexto) ||
        e.des_erro.toLowerCase().includes(filtroTexto)
    );
  }

  carregarErros(errosFiltrados);
}

// Configurar upload de arquivo
function configurarUploadImagem() {
  const arquivoInput = document.getElementById("imagemInput");
  const arquivoNome = document.getElementById("imagemNome");
  const btnRemover = document.getElementById("btnRemoverImagem");
  const previewContainer = document.getElementById("imagemPreviewContainer");
  const imagemPreview = document.getElementById("imagemPreview");

  arquivoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const tiposPermitidos = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (!tiposPermitidos.includes(file.type)) {
        mostrarMensagem(
          "Por favor, selecione uma imagem (JPG, PNG) ou PDF",
          "erro"
        );
        arquivoInput.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        mostrarMensagem("O arquivo deve ter no máximo 5MB", "erro");
        arquivoInput.value = "";
        return;
      }

      // Guardar arquivo selecionado
      imagemSelecionada = file;
      arquivoNome.textContent = file.name;
      btnRemover.style.display = "inline-block";

      // Preview apenas para imagens
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewContainer.style.display = "block";
          imagemPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // Para PDF, esconder preview
        previewContainer.style.display = "none";
      }
    }
  });

  btnRemover.addEventListener("click", async () => {
    // Se estiver editando e já tiver arquivo no servidor, confirmar remoção
    if (modoEdicao && erroEditandoId) {
      const confirmar = confirm("Deseja realmente remover o arquivo anexado?");
      if (!confirmar) return;

      try {
        const response = await fetch(
          `/api/faq/erros/${erroEditandoId}/arquivo`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (data.sucesso) {
          mostrarMensagem("Arquivo removido com sucesso!", "sucesso");
        } else {
          mostrarMensagem(data.mensagem || "Erro ao remover arquivo", "erro");
          return;
        }
      } catch (error) {
        console.error("Erro ao remover arquivo:", error);
        mostrarMensagem("Erro ao remover arquivo", "erro");
        return;
      }
    }

    // Limpar preview e seleção
    imagemSelecionada = null;
    arquivoInput.value = "";
    arquivoNome.textContent = "Nenhum arquivo selecionado";
    btnRemover.style.display = "none";
    previewContainer.style.display = "none";
  });
}

// Upload de arquivo (imagem ou PDF)
async function uploadImagem(erroId) {
  if (!imagemSelecionada) return true;

  try {
    const formData = new FormData();
    formData.append("arquivo", imagemSelecionada);

    const response = await fetch(`/api/faq/erros/${erroId}/upload-arquivo`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(
        data.mensagem || "Erro ao fazer upload do arquivo",
        "erro"
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error);
    mostrarMensagem("Erro ao fazer upload do arquivo", "erro");
    return false;
  }
}

// Ver arquivo (imagem ou PDF)
window.verImagem = async function (id) {
  try {
    // Buscar informações do erro para saber o tipo de arquivo
    const response = await fetch(`/api/faq/erros/${id}`);
    const data = await response.json();

    if (data.sucesso && data.erro.tipo_arquivo === "pdf") {
      // Para PDF, abrir em nova aba
      window.open(`/api/faq/erros/${id}/arquivo`, "_blank");
    } else {
      // Para imagem, mostrar modal
      const timestamp = new Date().getTime();
      document.getElementById(
        "imagemAmpliada"
      ).src = `/api/faq/erros/${id}/arquivo?t=${timestamp}`;
      document.getElementById("modalImagem").classList.add("show");
    }
  } catch (error) {
    console.error("Erro ao visualizar arquivo:", error);
    mostrarMensagem("Erro ao visualizar arquivo", "erro");
  }
};

// Fechar modal de imagem
function fecharModalImagem() {
  document.getElementById("modalImagem").classList.remove("show");
}

// Abrir modal de detalhes
async function abrirDetalhes(id) {
  try {
    const response = await fetch(`/api/faq/erros/${id}`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem || "Erro ao carregar detalhes", "erro");
      return;
    }

    const erro = data.erro;

    // Preencher dados no modal
    document.getElementById("detalhesSistema").textContent = erro.nom_sistema;
    document.getElementById("detalhesAssunto").textContent = erro.des_assunto;
    document.getElementById("detalhesErro").textContent = erro.des_erro;
    document.getElementById("detalhesResolucao").textContent =
      erro.des_resolucao;

    // Mostrar usuário que cadastrou
    const detalhesUsuario = document.getElementById("detalhesUsuario");
    if (erro.usuario_cadastro) {
      detalhesUsuario.textContent = `Cadastrado por: ${erro.usuario_cadastro}`;
    } else {
      detalhesUsuario.textContent = "";
    }

    // Mostrar/ocultar arquivo
    const arquivoContainer = document.getElementById("detalhesImagemContainer");
    if (erro.tem_arquivo) {
      if (erro.tipo_arquivo === "pdf") {
        // Para PDF, trocar imagem por botão
        const btnAmpliar = document.getElementById("btnAmpliarDetalhes");
        btnAmpliar.textContent = "📄 Abrir PDF";
        btnAmpliar.onclick = () => {
          window.open(`/api/faq/erros/${id}/arquivo`, "_blank");
        };
        document.getElementById("detalhesImagem").style.display = "none";
        arquivoContainer.style.display = "block";

        // Botão de download para PDF
        const btnDownload = document.getElementById("btnDownloadDetalhes");
        btnDownload.onclick = () => {
          const link = document.createElement("a");
          link.href = `/api/faq/erros/${id}/arquivo`;
          link.download = `${erro.des_assunto}.pdf`;
          link.click();
        };
      } else {
        // Para imagem, mostrar normalmente
        const timestamp = new Date().getTime();
        document.getElementById(
          "detalhesImagem"
        ).src = `/api/faq/erros/${id}/arquivo?t=${timestamp}`;
        document.getElementById("detalhesImagem").style.display = "block";
        const btnAmpliar = document.getElementById("btnAmpliarDetalhes");
        btnAmpliar.textContent = "🔍 Ampliar";
        btnAmpliar.onclick = () => {
          const imagemSrc = document.getElementById("detalhesImagem").src;
          document.getElementById("imagemAmpliada").src = imagemSrc;
          document.getElementById("modalImagem").classList.add("show");
        };
        arquivoContainer.style.display = "block";

        // Botão de download para imagem
        const btnDownload = document.getElementById("btnDownloadDetalhes");
        btnDownload.onclick = () => {
          const link = document.createElement("a");
          link.href = `/api/faq/erros/${id}/arquivo`;
          link.download = `${erro.des_assunto}.jpg`;
          link.click();
        };
      }
    } else {
      arquivoContainer.style.display = "none";
    }

    // Abrir modal
    document.getElementById("modalDetalhes").classList.add("show");
  } catch (error) {
    console.error("Erro ao buscar detalhes do erro:", error);
    mostrarMensagem("Erro ao buscar detalhes do erro", "erro");
  }
}

// Fechar modal de detalhes
function fecharModalDetalhes() {
  document.getElementById("modalDetalhes").classList.remove("show");
}

// Mostrar mensagem
function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById("mensagem");
  mensagem.textContent = texto;
  mensagem.className = `mensagem show ${tipo}`;

  setTimeout(() => {
    mensagem.classList.remove("show");
  }, 3000);
}
