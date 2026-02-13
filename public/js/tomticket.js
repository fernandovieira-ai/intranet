import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

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

    console.log("✅ Usuário autenticado, carregando chamados");
    await carregarChamados();
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
});

// Variável global para armazenar todos os chamados
let todosOsChamados = [];
let paginaAtual = 1;
let totalChamados = 0;
const CHAMADOS_POR_PAGINA = 50;

// Armazenar campos personalizados ocultos (CNPJ, CPF, Totvs)
let camposPersonalizadosOcultos = [];

// Abrir modal novo chamado
document
  .getElementById("btnNovoChamado")
  .addEventListener("click", async () => {
    document.getElementById("formNovoChamado").reset();

    // Limpar campos de cliente
    document.getElementById("buscarCliente").value = "";
    document.getElementById("clienteSelecionadoId").value = "";
    document.getElementById("clienteSelecionadoType").value = "E";
    document.getElementById("resultadosClientes").style.display = "none";

    const infoCliente = document.getElementById("infoClienteChamado");
    if (infoCliente) {
      infoCliente.style.display = "none";
    }

    await carregarDepartamentosECategorias();
    document.getElementById("modalNovoChamado").classList.add("show");
  });

// Fechar modal
document.querySelector(".modal-close").addEventListener("click", fecharModal);
document.getElementById("btnCancelar").addEventListener("click", fecharModal);

// Fechar modal ao clicar fora
document.getElementById("modalNovoChamado").addEventListener("click", (e) => {
  if (e.target.id === "modalNovoChamado") {
    fecharModal();
  }
});

// Submeter formulário
document
  .getElementById("formNovoChamado")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    await criarChamado();
  });

// Atualizar lista
document.getElementById("btnAtualizarLista").addEventListener("click", () => {
  carregarChamados();
});

// Buscar cliente
document.getElementById("btnBuscarCliente").addEventListener("click", () => {
  buscarClientes();
});

document.getElementById("buscarCliente").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    buscarClientes();
  }
});

// Limpar resultados ao focar no campo de busca
document.getElementById("buscarCliente").addEventListener("focus", () => {
  const resultados = document.getElementById("resultadosClientes");
  if (resultados.children.length === 0) {
    resultados.style.display = "none";
  }
});

function fecharModal() {
  document.getElementById("modalNovoChamado").classList.remove("show");
}

async function carregarChamados(pagina = 1) {
  console.log("🔄 Iniciando carregamento de chamados, página:", pagina);

  const lista = document.getElementById("chamadosLista");
  if (!lista) {
    console.error("❌ Elemento chamadosLista não encontrado!");
    return;
  }

  lista.innerHTML =
    '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Carregando chamados...</p></div>';

  const startTime = performance.now();

  try {
    const response = await fetch("/api/tomticket/chamados?pagina=" + pagina);

    const endTime = performance.now();
    console.log(
      `⚡ Requisição concluída em ${(endTime - startTime).toFixed(0)}ms`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.sucesso) {
      lista.innerHTML =
        '<div class="error-box"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar chamados</p></div>';
      return;
    }

    todosOsChamados = data.chamados || [];
    totalChamados = data.total || todosOsChamados.length;
    paginaAtual = pagina;
    console.log(`✅ ${todosOsChamados.length} chamados carregados`);

    if (todosOsChamados.length === 0) {
      lista.innerHTML =
        '<div class="loading"><p>Nenhum chamado retornado pela API</p></div>';
      return;
    }

    console.log("📋 Primeiro chamado:", todosOsChamados[0]);
    renderizarPorAtendente(todosOsChamados);
  } catch (error) {
    console.error("❌ ERRO CAPTURADO:", error);
    alert("ERRO: " + error.message);
    lista.innerHTML =
      '<div class="loading"><p>Erro: ' + error.message + "</p></div>";
  }
}

function renderizarPorAtendente(chamados) {
  const lista = document.getElementById("chamadosLista");

  if (!lista || !chamados || chamados.length === 0) {
    lista.innerHTML =
      '<div class="loading"><p>Nenhum chamado encontrado</p></div>';
    return;
  }

  // Agrupar chamados por atendente
  const porAtendente = {};
  chamados.forEach((chamado) => {
    const atendente = chamado.atendente || "Não atribuído";
    if (!porAtendente[atendente]) {
      porAtendente[atendente] = [];
    }
    porAtendente[atendente].push(chamado);
  });

  // Ordenar atendentes por quantidade de chamados (decrescente)
  const atendentesOrdenados = Object.keys(porAtendente).sort((a, b) => {
    return porAtendente[b].length - porAtendente[a].length;
  });

  let html = '<div class="atendentes-lista">';

  atendentesOrdenados.forEach((atendente) => {
    const chamadosDoAtendente = porAtendente[atendente];
    const total = chamadosDoAtendente.length;
    const atendenteId = atendente.replace(/\s+/g, "-").toLowerCase();

    html += `
      <div class="atendente-card">
        <div class="atendente-header" onclick="toggleAtendente('${atendenteId}')">
          <div class="atendente-info">
            <i class="fas fa-user-tie"></i>
            <h3>${atendente}</h3>
          </div>
          <div class="atendente-contador">
            <span class="badge-count">${total} chamado${
      total !== 1 ? "s" : ""
    }</span>
            <i class="fas fa-chevron-down" id="icon-${atendenteId}"></i>
          </div>
        </div>
        <div class="atendente-chamados" id="chamados-${atendenteId}" style="display: none;">
    `;

    chamadosDoAtendente.forEach((c) => {
      let desc = (c.description || "").replace(/<[^>]*>/g, "");
      if (desc.length > 150) {
        desc = desc.substring(0, 150) + "...";
      }

      html += `
        <div class="chamado-item" onclick='verDetalhesChamado(${JSON.stringify(
          c
        ).replace(/'/g, "&apos;")})' style="cursor: pointer;">
          <div class="chamado-item-header">
            <span class="chamado-protocolo">#${c.id}</span>
            <span class="chamado-badge badge-${c.priority || "normal"}">
              ${getPrioridadeLabel(c.priority)}
            </span>
          </div>
          <h4 class="chamado-item-titulo">${c.subject}</h4>
          <p class="chamado-item-desc">${desc}</p>
          <div class="chamado-item-footer">
            <span><i class="fas fa-calendar"></i> ${c.created_at}</span>
            <span><i class="fas fa-tag"></i> ${c.status}</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += "</div>";
  lista.innerHTML = html;

  // Adicionar controles de paginação
  renderizarPaginacao();
}

window.toggleAtendente = function (atendenteId) {
  const chamadosDiv = document.getElementById(`chamados-${atendenteId}`);
  const icon = document.getElementById(`icon-${atendenteId}`);

  if (chamadosDiv.style.display === "none") {
    chamadosDiv.style.display = "block";
    icon.classList.remove("fa-chevron-down");
    icon.classList.add("fa-chevron-up");
  } else {
    chamadosDiv.style.display = "none";
    icon.classList.remove("fa-chevron-up");
    icon.classList.add("fa-chevron-down");
  }
};

function renderizarPaginacao() {
  const container = document.getElementById("paginacaoContainer");
  if (!container) return;

  const totalPaginas = Math.ceil(totalChamados / CHAMADOS_POR_PAGINA);

  if (totalPaginas <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = '<div class="pagination">';
  html += `<div class="pagination-info">Página ${paginaAtual} de ${totalPaginas} (${totalChamados} chamados)</div>`;
  html += '<div class="pagination-buttons">';

  // Botão Anterior
  if (paginaAtual > 1) {
    html += `<button class="btn-pagination" onclick="irParaPagina(${
      paginaAtual - 1
    })"><i class="fas fa-chevron-left"></i> Anterior</button>`;
  }

  // Números de página
  const maxBotoes = 5;
  let inicio = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
  let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);

  if (fim - inicio < maxBotoes - 1) {
    inicio = Math.max(1, fim - maxBotoes + 1);
  }

  if (inicio > 1) {
    html += `<button class="btn-pagination" onclick="irParaPagina(1)">1</button>`;
    if (inicio > 2) {
      html += `<span class="pagination-dots">...</span>`;
    }
  }

  for (let i = inicio; i <= fim; i++) {
    const active = i === paginaAtual ? "active" : "";
    html += `<button class="btn-pagination ${active}" onclick="irParaPagina(${i})">${i}</button>`;
  }

  if (fim < totalPaginas) {
    if (fim < totalPaginas - 1) {
      html += `<span class="pagination-dots">...</span>`;
    }
    html += `<button class="btn-pagination" onclick="irParaPagina(${totalPaginas})">${totalPaginas}</button>`;
  }

  // Botão Próximo
  if (paginaAtual < totalPaginas) {
    html += `<button class="btn-pagination" onclick="irParaPagina(${
      paginaAtual + 1
    })">Próximo <i class="fas fa-chevron-right"></i></button>`;
  }

  html += "</div></div>";
  container.innerHTML = html;
}

window.irParaPagina = function (pagina) {
  if (pagina < 1) return;
  paginaAtual = pagina;
  carregarChamados(pagina);
};

async function buscarClientes() {
  const termo = document.getElementById("buscarCliente").value.trim();
  const resultadosDiv = document.getElementById("resultadosClientes");

  if (!termo || termo.length < 3) {
    mostrarMensagem("Digite pelo menos 3 caracteres para buscar", "erro");
    resultadosDiv.style.display = "none";
    return;
  }

  try {
    resultadosDiv.innerHTML =
      '<div class="loading-mini"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
    resultadosDiv.style.display = "block";

    const response = await fetch(
      `/api/tomticket/clientes?search=${encodeURIComponent(termo)}`
    );
    const data = await response.json();

    if (data.sucesso && data.clientes && data.clientes.length > 0) {
      let html = '<div class="clientes-lista">';

      data.clientes.forEach((cliente, index) => {
        html += `
          <div class="cliente-item" data-cliente-index="${index}">
            <div class="cliente-avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="cliente-dados">
              <strong>${cliente.name}</strong>
              <span>${cliente.email}</span>
              ${
                cliente.organization
                  ? `<small><i class="fas fa-building"></i> ${cliente.organization.name}</small>`
                  : ""
              }
            </div>
            <i class="fas fa-chevron-right"></i>
          </div>
        `;
      });

      html += "</div>";
      resultadosDiv.innerHTML = html;

      // Adicionar event listeners aos clientes
      document.querySelectorAll(".cliente-item").forEach((item, index) => {
        item.addEventListener("click", () => {
          const cliente = data.clientes[index];
          selecionarCliente(
            cliente.id,
            cliente.name,
            cliente.email,
            cliente.organization ? cliente.organization.name : null
          );
        });
      });
    } else {
      resultadosDiv.innerHTML =
        '<div class="no-results"><i class="fas fa-user-slash"></i> Nenhum cliente encontrado</div>';
    }
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error);
    resultadosDiv.innerHTML =
      '<div class="error-results"><i class="fas fa-exclamation-triangle"></i> Erro ao buscar clientes</div>';
  }
}

function selecionarCliente(id, nome, email, organizacao) {
  console.log("✅ Cliente selecionado:", nome, "-", email, "Org:", organizacao);

  // Armazenar EMAIL do cliente (sempre)
  document.getElementById("clienteSelecionadoId").value = email;
  document.getElementById("clienteSelecionadoNome").value = nome;
  document.getElementById("clienteSelecionadoEmail").value = email;
  document.getElementById("clienteSelecionadoType").value = "E"; // Email

  console.log("📝 Armazenado para envio: Email =", email);

  // Atualizar campo de busca
  document.getElementById("buscarCliente").value = `${nome} (${email})`;

  // Ocultar resultados
  document.getElementById("resultadosClientes").style.display = "none";

  // Atualizar box de informações do cliente (já existe no HTML)
  const infoCliente = document.getElementById("infoClienteChamado");

  infoCliente.innerHTML = `
    <div class="cliente-info">
      <i class="fas fa-user-check"></i>
      <div>
        <strong>${nome}</strong>
        <span>${email}</span>
        ${
          organizacao && organizacao !== "null"
            ? `<small style="display: block; margin-top: 4px; color: #666;"><i class="fas fa-building"></i> ${organizacao}</small>`
            : ""
        }
      </div>
    </div>
  `;
  console.log("📋 HTML do infoCliente:", infoCliente.innerHTML);
  infoCliente.style.display = "block";
}

async function carregarInformacoesCliente() {
  // Função removida - agora o usuário deve buscar o cliente manualmente
  // ou o sistema usará o cliente da sessão automaticamente no backend
  console.log(
    "💡 Cliente será definido pela busca ou automaticamente no backend"
  );
}

async function carregarDepartamentosECategorias() {
  try {
    // NÃO carregar informações do cliente aqui para não deixar lento

    // Carregar departamentos
    const deptResponse = await fetch("/api/tomticket/departamentos");
    const deptData = await deptResponse.json();

    const selectDept = document.getElementById("departamento");
    selectDept.innerHTML =
      '<option value="">Selecione um departamento</option>';

    if (deptData.sucesso && deptData.departamentos) {
      deptData.departamentos.forEach((dept) => {
        const option = document.createElement("option");
        option.value = dept.id;
        option.textContent = dept.name || dept.nome || dept.description;
        selectDept.appendChild(option);
      });

      // Adicionar evento para recarregar categorias quando departamento mudar
      selectDept.addEventListener("change", async (e) => {
        const departamentoId = e.target.value;
        await carregarCategorias(departamentoId);
      });
    }

    // Limpar categorias inicialmente
    const selectCat = document.getElementById("categoria");
    selectCat.innerHTML =
      '<option value="">Primeiro selecione um departamento</option>';
  } catch (error) {
    console.error("Erro ao carregar departamentos:", error);
    mostrarMensagem("Erro ao carregar opções do formulário", "erro");
  }
}

async function carregarCategorias(departamentoId) {
  try {
    const selectCat = document.getElementById("categoria");

    if (!departamentoId) {
      selectCat.innerHTML =
        '<option value="">Primeiro selecione um departamento</option>';
      limparCamposPersonalizados();
      return;
    }

    selectCat.innerHTML = '<option value="">Carregando...</option>';

    const catResponse = await fetch(
      `/api/tomticket/categorias?department_id=${departamentoId}`
    );
    const catData = await catResponse.json();

    selectCat.innerHTML =
      '<option value="">Selecione uma categoria (opcional)</option>';

    if (
      catData.sucesso &&
      catData.categorias &&
      catData.categorias.length > 0
    ) {
      catData.categorias.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name || cat.nome || cat.description;
        selectCat.appendChild(option);
      });
    }

    // Renderizar campos personalizados
    renderizarCamposPersonalizados(catData.campos_personalizados || []);
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
    const selectCat = document.getElementById("categoria");
    selectCat.innerHTML =
      '<option value="">Erro ao carregar categorias</option>';
    limparCamposPersonalizados();
  }
}

function limparCamposPersonalizados() {
  const container = document.getElementById("camposPersonalizadosContainer");
  if (container) {
    container.innerHTML = "";
  }
}

function renderizarCamposPersonalizados(campos) {
  const container = document.getElementById("camposPersonalizadosContainer");
  if (!container) return;

  container.innerHTML = "";

  // Separar campos em visíveis e ocultos
  const camposVisiveis = [];
  camposPersonalizadosOcultos = [];

  console.log("🔍 Total de campos recebidos:", campos.length);

  campos.forEach((campo) => {
    if (!campo.operation?.open) {
      console.log(
        `  ⏭️ Campo "${campo.label}" (${campo.id}) - operation.open = false, ignorado`
      );
      return;
    }

    const labelLower = (campo.label || "").toLowerCase();
    const camposParaOcultar = [
      "cnpj",
      "cpf",
      "totvs",
      "código totvs",
      "codigo totvs",
      "nome do grupo",
      "organization",
      "organização",
      "grupo",
    ];
    const deveOcultar = camposParaOcultar.some((termo) =>
      labelLower.includes(termo)
    );

    console.log(
      `  📋 Campo "${campo.label}" (${campo.id}) - mandatory: ${campo.mandatory}, ocultar: ${deveOcultar}`
    );

    if (deveOcultar && campo.mandatory) {
      // Armazenar campo oculto para preencher automaticamente
      camposPersonalizadosOcultos.push(campo);
      console.log(
        `    🔒 OCULTO e obrigatório - será preenchido automaticamente`
      );
    } else if (campo.mandatory) {
      // Campo visível
      camposVisiveis.push(campo);
      console.log(`    👁️ VISÍVEL e obrigatório - usuário deve preencher`);
    } else {
      console.log(`    ℹ️ Opcional - não será renderizado`);
    }
  });

  console.log(`✅ Total de campos visíveis: ${camposVisiveis.length}`);
  console.log(
    `✅ Total de campos ocultos: ${camposPersonalizadosOcultos.length}`
  );

  if (camposVisiveis.length === 0) return;

  camposVisiveis.forEach((campo) => {
    const formGroup = document.createElement("div");
    formGroup.className = "form-group";

    const label = document.createElement("label");
    label.textContent = campo.label + (campo.mandatory ? " *" : "");
    label.setAttribute("for", `custom_${campo.id}`);
    formGroup.appendChild(label);

    let input;

    // Tipo 1: Campo de Texto
    if (campo.type === 1) {
      input = document.createElement("input");
      input.type = "text";
      input.id = `custom_${campo.id}`;
      input.name = `custom_field[${campo.id}]`;
      input.required = campo.mandatory;
    }
    // Tipo 2: Área de Texto
    else if (campo.type === 2) {
      input = document.createElement("textarea");
      input.id = `custom_${campo.id}`;
      input.name = `custom_field[${campo.id}]`;
      input.rows = 3;
      input.required = campo.mandatory;
    }
    // Tipo 3: Select/ComboBox
    else if (campo.type === 3) {
      input = document.createElement("select");
      input.id = `custom_${campo.id}`;
      input.name = `custom_field[${campo.id}]`;
      input.required = campo.mandatory;

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Selecione...";
      input.appendChild(defaultOption);

      if (campo.options && Array.isArray(campo.options)) {
        campo.options.forEach((opt) => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
      }
    }

    if (input) {
      formGroup.appendChild(input);
      container.appendChild(formGroup);
    }
  });
}

async function criarChamado() {
  const assunto = document.getElementById("assunto").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const prioridade = document.getElementById("prioridade").value;
  const departamento = document.getElementById("departamento").value;
  const categoria = document.getElementById("categoria").value;

  // Obter cliente selecionado (se houver)
  const clienteId = document.getElementById("clienteSelecionadoId")?.value;
  const clienteType =
    document.getElementById("clienteSelecionadoType")?.value || "E";

  if (!assunto || !descricao || !departamento) {
    mostrarMensagem("Preencha todos os campos obrigatórios", "erro");
    return;
  }

  // Coletar campos personalizados
  const camposPersonalizados = {};
  const customInputs = document.querySelectorAll('[name^="custom_field["]');

  for (let input of customInputs) {
    const match = input.name.match(/custom_field\[(.+)\]/);
    if (match) {
      const fieldId = match[1];
      const value = input.value.trim();

      if (input.required && !value) {
        mostrarMensagem(
          `Preencha o campo obrigatório: ${
            input.previousElementSibling?.textContent || "campo personalizado"
          }`,
          "erro"
        );
        return;
      }

      if (value) {
        camposPersonalizados[fieldId] = value;
      }
    }
  }

  // Preencher campos ocultos automaticamente com dados do cliente
  if (camposPersonalizadosOcultos.length > 0) {
    console.log(
      `📋 Processando ${camposPersonalizadosOcultos.length} campos ocultos obrigatórios...`
    );
    console.log(
      "📋 IDs dos campos ocultos:",
      camposPersonalizadosOcultos.map((c) => `${c.label} (${c.id})`)
    );

    if (clienteId) {
      // Buscar dados completos do cliente para preencher campos ocultos
      try {
        console.log(`🔎 Buscando cliente com email: "${clienteId}"`);
        const clienteResponse = await fetch(
          `/api/tomticket/clientes?email=${encodeURIComponent(clienteId)}`
        );
        const clienteData = await clienteResponse.json();

        console.log("🔍 Resposta da busca de cliente:", clienteData);

        if (
          clienteData.sucesso &&
          clienteData.clientes &&
          clienteData.clientes.length > 0
        ) {
          const cliente = clienteData.clientes[0];
          console.log("👤 Cliente encontrado:", {
            nome: cliente.name,
            email: cliente.email,
            organization: cliente.organization,
          });

          camposPersonalizadosOcultos.forEach((campo) => {
            const labelLower = (campo.label || "").toLowerCase();
            let valor = ""; // Deixar vazio inicialmente

            // Preencher baseado no tipo do campo
            if (labelLower.includes("cnpj")) {
              // Para CNPJ, tentar usar o nome da organização
              valor = cliente.organization?.name || "";
              console.log(`  🏢 CNPJ detectado, usando: "${valor}"`);
            } else if (labelLower.includes("cpf")) {
              // CPF deixar vazio (não temos essa informação)
              valor = "";
              console.log(`  🆔 CPF detectado, deixando vazio`);
            } else if (
              labelLower.includes("totvs") ||
              labelLower.includes("código")
            ) {
              // Código Totvs: usar ID da organização
              valor = cliente.organization?.id || "";
              console.log(`  🔢 Código Totvs detectado, usando: "${valor}"`);
            } else if (
              labelLower.includes("nome do grupo") ||
              labelLower.includes("organization") ||
              labelLower.includes("organização") ||
              labelLower.includes("grupo")
            ) {
              // Nome do grupo
              valor = cliente.organization?.name || "";
              console.log(`  🏢 Nome do grupo detectado, usando: "${valor}"`);
            }

            // SEMPRE adicionar o campo
            camposPersonalizados[campo.id] = valor;
            console.log(`✅ Campo "${campo.label}" (${campo.id}) = "${valor}"`);
          });
        } else {
          console.log("⚠️ Cliente não encontrado na busca");
          // Se não encontrou o cliente, deixar campos vazios
          camposPersonalizadosOcultos.forEach((campo) => {
            camposPersonalizados[campo.id] = "";
            console.log(`✅ Campo "${campo.label}" (${campo.id}) = "" (vazio)`);
          });
        }
      } catch (error) {
        console.error(
          "⚠️ Erro ao buscar dados do cliente para campos ocultos:",
          error
        );
        // Em caso de erro, deixar campos vazios
        camposPersonalizadosOcultos.forEach((campo) => {
          camposPersonalizados[campo.id] = "";
          console.log(
            `✅ Campo "${campo.label}" (${campo.id}) = "" (vazio por erro)`
          );
        });
      }
    } else {
      // Se não há cliente selecionado, deixar campos vazios
      console.log(
        "⚠️ Nenhum cliente selecionado, campos ocultos serão deixados vazios"
      );

      camposPersonalizadosOcultos.forEach((campo) => {
        camposPersonalizados[campo.id] = "";
        console.log(`✅ Campo "${campo.label}" (${campo.id}) = "" (vazio)`);
      });
    }
  }

  try {
    const payload = {
      subject: assunto,
      description: descricao,
      priority: prioridade,
      department_id: departamento,
      category_id: categoria || undefined,
      custom_fields: camposPersonalizados,
      // Incluir cliente selecionado se houver
      customer_id: clienteId || undefined,
      customer_id_type: clienteId ? clienteType : undefined,
    };

    console.log("📦 Enviando payload:");
    console.log("  - Subject:", assunto);
    console.log("  - Customer ID:", clienteId);
    console.log("  - Customer Type:", clienteType);
    console.log("  - Campos personalizados:", camposPersonalizados);
    console.log(
      "  - Campos ocultos processados:",
      camposPersonalizadosOcultos.length
    );

    const response = await fetch("/api/tomticket/chamados", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem("Chamado criado com sucesso!", "sucesso");
      fecharModal();
      await carregarChamados();
    } else {
      mostrarMensagem(data.mensagem || "Erro ao criar chamado", "erro");
    }
  } catch (error) {
    console.error("Erro ao criar chamado:", error);
    mostrarMensagem("Erro ao criar chamado", "erro");
  }
}

let chamadoAtual = null;

window.verDetalhesChamado = function (chamado) {
  chamadoAtual = chamado;

  // Preencher título
  document.getElementById(
    "detalhesTitulo"
  ).textContent = `Detalhes do Chamado: #${chamado.id} - ${chamado.subject}`;

  // Preencher dados
  document.getElementById("detalheProtocolo").textContent = `#${chamado.id}`;
  document.getElementById(
    "detalheStatus"
  ).innerHTML = `<span class="chamado-badge badge-${getStatusClass(
    chamado.status
  )}">${chamado.status}</span>`;
  document.getElementById(
    "detalhePrioridade"
  ).innerHTML = `<span class="chamado-badge badge-${
    chamado.priority || "normal"
  }">${getPrioridadeLabel(chamado.priority)}</span>`;
  document.getElementById("detalheData").textContent =
    chamado.created_at || "N/A";
  document.getElementById("detalheSolicitante").textContent =
    chamado.requester_name || "N/A";
  document.getElementById("detalheAtendente").textContent =
    chamado.atendente || "Não atribuído";
  document.getElementById("detalheDepartamento").textContent =
    chamado.departamento || "N/A";
  document.getElementById("detalheCategoria").textContent =
    chamado.categoria || "N/A";

  // Preencher descrição
  const descricaoCompleta = chamado.description || "Sem descrição disponível";
  document.getElementById("detalheDescricao").innerHTML = descricaoCompleta;

  // Abrir modal
  document.getElementById("modalDetalhesChamado").classList.add("show");
};

window.fecharDetalhes = function () {
  document.getElementById("modalDetalhesChamado").classList.remove("show");
  chamadoAtual = null;
};

window.abrirChamadoExterno = function () {
  if (chamadoAtual && chamadoAtual.idchamado) {
    window.open(
      `https://console.tomticket.com/ticket/view/${chamadoAtual.idchamado}`,
      "_blank"
    );
  }
};

// Fechar modal ao clicar fora
document
  .getElementById("modalDetalhesChamado")
  ?.addEventListener("click", (e) => {
    if (e.target.id === "modalDetalhesChamado") {
      fecharDetalhes();
    }
  });

function verChamado(idchamado) {
  window.open(`https://tomticket.tomticket.com/chamado/${idchamado}`, "_blank");
}

function limparHTML(texto) {
  const temp = document.createElement("div");
  temp.innerHTML = texto;
  return temp.textContent || temp.innerText || "";
}

function getPrioridadeLabel(priority) {
  const labels = {
    low: "Baixa",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente",
  };
  return labels[priority] || "Normal";
}

function getStatusLabel(status) {
  const labels = {
    new: "Novo",
    open: "Aberto",
    pending: "Pendente",
    solved: "Resolvido",
    closed: "Fechado",
  };
  return labels[status] || status || "Aberto";
}

function getStatusClass(status) {
  if (!status) return "aberto";
  const s = status.toLowerCase();
  if (
    s.includes("finalizado") ||
    s.includes("fechado") ||
    s.includes("resolvido")
  )
    return "fechado";
  if (s.includes("aguardando") || s.includes("pendente")) return "andamento";
  return "aberto";
}

function formatarData(data) {
  if (!data) return "Data desconhecida";
  const date = new Date(data);
  return (
    date.toLocaleDateString("pt-BR") +
    " " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function truncarTexto(texto, tamanho) {
  if (texto.length <= tamanho) return texto;
  return texto.substring(0, tamanho) + "...";
}

function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById("mensagem");
  mensagem.textContent = texto;
  mensagem.className = `mensagem show ${tipo}`;

  setTimeout(() => {
    mensagem.classList.remove("show");
  }, 3000);
}
