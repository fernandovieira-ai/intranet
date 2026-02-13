import {
  inicializarMenuLateral,
  atualizarHeaderUsuario,
  configurarLogout,
} from "./sidebar.js";

let usuarioLogado = null;
let clienteParaExcluir = null;
let modoEdicao = false;
let clienteEdicaoId = null;
let todosClientes = [];

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

    // Mostrar botões de cadastro/importação apenas para admin
    if (data.usuario.admin) {
      document.getElementById("btnNovoCliente").style.display = "block";
      document.getElementById("btnImportar").style.display = "block";
    }

    // Carregar credenciais do usuário (disponível para todos)
    await carregarCredenciais();

    // Carregar clientes
    await carregarClientes();

    // Configurar pesquisa
    configurarPesquisa();
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
});

// Carregar credenciais do Tactical RMM
async function carregarCredenciais() {
  try {
    const response = await fetch("/api/trmm/credenciais-usuario");
    const data = await response.json();

    console.log("Credenciais do usuário:", data);

    if (data.sucesso && data.usuario_tac && data.senha_tac) {
      console.log("Exibindo card de credenciais");
      document.getElementById("credenciaisCard").style.display = "block";
      document.getElementById("credUsuario").textContent = data.usuario_tac;
      document.getElementById("credSenha").textContent = "********";
      document.getElementById("credSenha").dataset.senha = data.senha_tac;

      // Toggle de senha
      document
        .getElementById("btnToggleSenha")
        .addEventListener("click", () => {
          const senhaSpan = document.getElementById("credSenha");
          const btn = document.getElementById("btnToggleSenha");
          if (senhaSpan.textContent === "********") {
            senhaSpan.textContent = senhaSpan.dataset.senha;
            btn.textContent = "🙈";
          } else {
            senhaSpan.textContent = "********";
            btn.textContent = "👁️";
          }
        });

      // Copiar usuário
      document
        .getElementById("btnCopiarUsuario")
        .addEventListener("click", () => {
          const usuario = document.getElementById("credUsuario").textContent;
          navigator.clipboard
            .writeText(usuario)
            .then(() => {
              mostrarMensagemCredenciais("Usuário copiado!");
            })
            .catch((err) => {
              console.error("Erro ao copiar:", err);
              mostrarMensagemCredenciais("Erro ao copiar", true);
            });
        });

      // Copiar senha
      document
        .getElementById("btnCopiarSenha")
        .addEventListener("click", () => {
          const senha = document.getElementById("credSenha").dataset.senha;
          navigator.clipboard
            .writeText(senha)
            .then(() => {
              mostrarMensagemCredenciais("Senha copiada!");
            })
            .catch((err) => {
              console.error("Erro ao copiar:", err);
              mostrarMensagemCredenciais("Erro ao copiar", true);
            });
        });
    } else {
      console.log("Credenciais não encontradas ou incompletas");
    }
  } catch (error) {
    console.error("Erro ao carregar credenciais:", error);
  }
}

// Mostrar mensagem no card de credenciais
function mostrarMensagemCredenciais(texto, isErro = false) {
  const mensagem = document.getElementById("mensagemCredenciais");
  mensagem.textContent = texto;
  mensagem.className = isErro
    ? "mensagem-credenciais erro"
    : "mensagem-credenciais";
  mensagem.style.display = "block";

  setTimeout(() => {
    mensagem.style.display = "none";
  }, 2000);
}

// Carregar clientes
async function carregarClientes() {
  try {
    document.getElementById("loading").style.display = "block";
    document.getElementById("listaClientes").innerHTML = "";
    document.getElementById("mensagemVazia").style.display = "none";

    const response = await fetch("/api/trmm/clientes");
    const data = await response.json();

    document.getElementById("loading").style.display = "none";

    if (!data.sucesso) {
      mostrarMensagem("Erro ao carregar clientes", "erro");
      return;
    }

    const listaClientes = document.getElementById("listaClientes");

    if (data.clientes.length === 0) {
      document.getElementById("mensagemVazia").style.display = "block";
      return;
    }

    // Armazenar todos os clientes para pesquisa
    todosClientes = data.clientes;

    // Renderizar clientes
    renderizarClientes(todosClientes);
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    document.getElementById("loading").style.display = "none";
    mostrarMensagem("Erro ao carregar clientes", "erro");
  }
}

// Renderizar clientes
function renderizarClientes(clientes) {
  const listaClientes = document.getElementById("listaClientes");

  if (clientes.length === 0) {
    document.getElementById("mensagemVazia").style.display = "block";
    listaClientes.innerHTML = "";
    return;
  }

  document.getElementById("mensagemVazia").style.display = "none";

  listaClientes.innerHTML = clientes
    .map((cliente) => {
      const statusClass = cliente.ativo ? "status-ativo" : "status-inativo";
      const statusText = cliente.ativo ? "Ativo" : "Inativo";

      return `
        <div class="cliente-card ${
          !cliente.ativo ? "cliente-inativo" : ""
        }" data-id="${cliente.id}">
          <div class="cliente-header">
            <div>
              <h3>${cliente.cliente_nome}</h3>
              <span class="cliente-status ${statusClass}">${statusText}</span>
            </div>
            ${
              usuarioLogado.admin
                ? `
              <div class="cliente-acoes">
                <button class="btn-icon btn-testar" onclick="testarConexao(${cliente.id})" title="Testar Conexão">
                  🔌
                </button>
                <button class="btn-icon btn-editar" onclick="editarCliente(${cliente.id})" title="Editar">
                  ✏️
                </button>
                <button class="btn-icon btn-excluir" onclick="confirmarExclusao(${cliente.id}, '${cliente.cliente_nome}')" title="Excluir">
                  🗑️
                </button>
              </div>
            `
                : ""
            }
          </div>
          <div class="cliente-info">
            <div class="info-item">
              <label>URL da API:</label>
              <span class="url-truncate">${cliente.api_url}</span>
            </div>
            ${
              cliente.observacao
                ? `
              <div class="info-item">
                <label>Observação:</label>
                <span>${cliente.observacao}</span>
              </div>
            `
                : ""
            }
          </div>
          <div class="cliente-footer">
            <button class="btn-ver-agents" onclick="verAgents(${cliente.id}, '${
        cliente.cliente_nome
      }')">
              🖥️ Ver Agents
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// Configurar pesquisa
function configurarPesquisa() {
  const inputPesquisa = document.getElementById("inputPesquisa");
  const btnLimpar = document.getElementById("btnLimparPesquisa");

  inputPesquisa.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase().trim();

    if (termo) {
      btnLimpar.style.display = "block";
      const clientesFiltrados = todosClientes.filter((cliente) => {
        return cliente.cliente_nome.toLowerCase().includes(termo);
      });
      renderizarClientes(clientesFiltrados);
    } else {
      btnLimpar.style.display = "none";
      renderizarClientes(todosClientes);
    }
  });

  btnLimpar.addEventListener("click", () => {
    inputPesquisa.value = "";
    btnLimpar.style.display = "none";
    renderizarClientes(todosClientes);
  });
}

// Modal - Novo Cliente
document.getElementById("btnNovoCliente").addEventListener("click", () => {
  modoEdicao = false;
  clienteEdicaoId = null;
  document.getElementById("tituloModal").textContent = "Novo Cliente TRMM";
  document.getElementById("groupAtivo").style.display = "none";
  document.getElementById("formCliente").reset();
  document.getElementById("modalCliente").style.display = "flex";
});

// Modal - Fechar
document.getElementById("btnFecharModal").addEventListener("click", () => {
  document.getElementById("modalCliente").style.display = "none";
});

document.getElementById("btnCancelar").addEventListener("click", () => {
  document.getElementById("modalCliente").style.display = "none";
});

// Toggle API Key
document.getElementById("btnToggleApiKey").addEventListener("click", () => {
  const input = document.getElementById("inputApiKey");
  const btn = document.getElementById("btnToggleApiKey");

  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁️";
  }
});

// Salvar cliente (criar ou editar)
document.getElementById("formCliente").addEventListener("submit", async (e) => {
  e.preventDefault();

  const cliente_nome = document.getElementById("inputNome").value.trim();
  const api_url = document.getElementById("inputApiUrl").value.trim();
  const api_key = document.getElementById("inputApiKey").value.trim();
  const observacao = document.getElementById("inputObservacao").value.trim();
  const ativo = document.getElementById("inputAtivo").checked;

  if (!cliente_nome || !api_url || !api_key) {
    mostrarMensagem("Preencha todos os campos obrigatórios", "erro");
    return;
  }

  try {
    const url = modoEdicao
      ? `/api/trmm/clientes/${clienteEdicaoId}`
      : "/api/trmm/clientes";
    const method = modoEdicao ? "PUT" : "POST";

    const body = { cliente_nome, api_url, api_key, observacao };
    if (modoEdicao) {
      body.ativo = ativo;
    }

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(data.mensagem, "sucesso");
      document.getElementById("modalCliente").style.display = "none";
      await carregarClientes();
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao salvar cliente:", error);
    mostrarMensagem("Erro ao salvar cliente", "erro");
  }
});

// Editar cliente
window.editarCliente = async function (id) {
  try {
    const response = await fetch(`/api/trmm/clientes/${id}`);
    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem("Cliente não encontrado", "erro");
      return;
    }

    modoEdicao = true;
    clienteEdicaoId = id;

    document.getElementById("tituloModal").textContent = "Editar Cliente TRMM";
    document.getElementById("inputNome").value = data.cliente.cliente_nome;
    document.getElementById("inputApiUrl").value = data.cliente.api_url;
    document.getElementById("inputApiKey").value = data.cliente.api_key;
    document.getElementById("inputObservacao").value =
      data.cliente.observacao || "";
    document.getElementById("inputAtivo").checked = data.cliente.ativo;
    document.getElementById("groupAtivo").style.display = "block";

    document.getElementById("modalCliente").style.display = "flex";
  } catch (error) {
    console.error("Erro ao carregar cliente:", error);
    mostrarMensagem("Erro ao carregar cliente", "erro");
  }
};

// Confirmar exclusão
window.confirmarExclusao = function (id, nome) {
  clienteParaExcluir = id;
  document.getElementById("confirmacaoNome").textContent = nome;
  document.getElementById("modalConfirmacao").style.display = "flex";
};

document
  .getElementById("btnFecharConfirmacao")
  .addEventListener("click", () => {
    document.getElementById("modalConfirmacao").style.display = "none";
    clienteParaExcluir = null;
  });

document.getElementById("btnCancelarExclusao").addEventListener("click", () => {
  document.getElementById("modalConfirmacao").style.display = "none";
  clienteParaExcluir = null;
});

document
  .getElementById("btnConfirmarExclusao")
  .addEventListener("click", async () => {
    if (!clienteParaExcluir) return;

    try {
      const response = await fetch(`/api/trmm/clientes/${clienteParaExcluir}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.sucesso) {
        mostrarMensagem(data.mensagem, "sucesso");
        document.getElementById("modalConfirmacao").style.display = "none";
        clienteParaExcluir = null;
        await carregarClientes();
      } else {
        mostrarMensagem(data.mensagem, "erro");
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      mostrarMensagem("Erro ao excluir cliente", "erro");
    }
  });

// Testar conexão
window.testarConexao = async function (id) {
  try {
    mostrarMensagem("Testando conexão...", "info");

    const response = await fetch(`/api/trmm/testar/${id}`, {
      method: "POST",
    });

    const data = await response.json();

    if (data.sucesso) {
      mostrarMensagem(
        `${data.mensagem} - ${data.total_agents} agents encontrados`,
        "sucesso"
      );
    } else {
      mostrarMensagem(data.mensagem, "erro");
    }
  } catch (error) {
    console.error("Erro ao testar conexão:", error);
    mostrarMensagem("Erro ao conectar com API", "erro");
  }
};

// Acessar Tactical RMM com autenticação automática
window.acessarTRMM = async function () {
  try {
    const response = await fetch("/api/trmm/acessar-trmm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.sucesso) {
      mostrarMensagem(data.mensagem || "Erro ao acessar TRMM", "erro");
      return;
    }

    // Abrir em nova aba
    window.open(data.url, "_blank");
  } catch (error) {
    console.error("Erro ao acessar TRMM:", error);
    mostrarMensagem("Erro ao acessar Tactical RMM", "erro");
  }
};

// Ver agents
window.verAgents = async function (id, nomeCliente) {
  try {
    console.log(
      `🔍 Buscando agents do cliente ID: ${id}, Nome: ${nomeCliente}`
    );

    document.getElementById(
      "tituloModalAgents"
    ).textContent = `Agents - ${nomeCliente}`;
    document.getElementById("modalAgents").style.display = "flex";
    document.getElementById("agentsLoading").style.display = "block";
    document.getElementById("agentsContainer").innerHTML = "";

    const response = await fetch(`/api/trmm/clientes/${id}/agents`);

    console.log(`📡 Status da resposta: ${response.status}`);

    const data = await response.json();

    console.log(`📦 Dados recebidos:`, data);

    document.getElementById("agentsLoading").style.display = "none";

    if (!data.sucesso) {
      console.error(`❌ Erro na resposta:`, data.mensagem);
      document.getElementById("agentsContainer").innerHTML = `
        <div class="mensagem-erro">
          <p>❌ ${data.mensagem}</p>
        </div>
      `;
      return;
    }

    if (!data.agents || data.agents.length === 0) {
      console.warn(`⚠️ Nenhum agent encontrado para o cliente`);
      document.getElementById("agentsContainer").innerHTML = `
        <div class="mensagem-vazia">
          <p>📭 Nenhum agent encontrado para este cliente</p>
          <p style="font-size: 12px; color: #666;">Total de agents na API: ${
            data.total || 0
          }</p>
        </div>
      `;
      return;
    }

    console.log(`✅ ${data.agents.length} agents encontrados`);

    document.getElementById("agentsContainer").innerHTML = `
      <div class="agents-stats">
        <p>Total: <strong>${data.total}</strong> | 
        🟢 Online: <strong>${data.estatisticas.online}</strong> | 
        🔴 Offline: <strong>${data.estatisticas.offline}</strong> | 
        ⚠️ Com erro: <strong>${data.estatisticas.com_erro}</strong></p>
      </div>
      <div class="agents-grid">
        ${data.agents
          .map((agent) => {
            const statusClass =
              agent.status === "online" ? "online" : "offline";
            const statusIcon = agent.status === "online" ? "🟢" : "🔴";
            const erroClass = agent.tem_erro ? "agent-com-erro" : "";
            const erroIcon = agent.tem_erro ? "⚠️ " : "";

            return `
          <div class="agent-card ${erroClass}">
            <div class="agent-header">
              <h4>${erroIcon}${agent.hostname || "N/A"}</h4>
              <span class="agent-status ${statusClass}">${statusIcon} ${
              agent.status
            }</span>
            </div>
            <div class="agent-info">
              <div class="agent-info-item">
                <label>Site:</label>
                <span>${agent.site_name || "N/A"}</span>
              </div>
              <div class="agent-info-item">
                <label>Cliente:</label>
                <span>${agent.client_name || "N/A"}</span>
              </div>
              <div class="agent-info-item">
                <label>SO:</label>
                <span>${agent.operating_system || agent.plat || "N/A"}</span>
              </div>
              <div class="agent-info-item">
                <label>Versão:</label>
                <span>${agent.version || "N/A"}</span>
              </div>
              ${
                agent.discos_criticos > 0
                  ? `<div class="agent-warning">💾 ${agent.discos_criticos} disco(s) crítico(s)</div>`
                  : ""
              }
              ${
                agent.needs_reboot
                  ? '<div class="agent-warning">🔄 Requer reinicialização</div>'
                  : ""
              }
              ${
                agent.has_patches_pending
                  ? '<div class="agent-warning">📦 Patches pendentes</div>'
                  : ""
              }
              ${
                agent.maintenance_mode
                  ? '<div class="agent-warning">🔧 Modo manutenção</div>'
                  : ""
              }
              ${
                agent.disks && agent.disks.length > 0
                  ? `<div class="agent-disks">
                      <label style="font-weight: 600; margin-top: 10px; display: block;">💾 Discos:</label>
                      ${agent.disks
                        .map((disk) => {
                          const usedPercent = disk.used_percent || 0;
                          const barColor =
                            usedPercent > 85
                              ? "#e53e3e"
                              : usedPercent > 70
                              ? "#f39c12"
                              : "#48bb78";
                          return `
                          <div style="margin: 8px 0; padding: 8px; background: #f7fafc; border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                              <span style="font-weight: 600;">${
                                disk.drive_letter || "N/A"
                              }</span>
                              <span style="font-weight: 600; color: ${barColor};">${usedPercent}%</span>
                            </div>
                            <div style="font-size: 11px; color: #718096; margin-bottom: 4px;">
                              ${disk.free_space || "N/A"} livre de ${
                            disk.total_space || "N/A"
                          }
                            </div>
                            <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                              <div style="background: ${barColor}; height: 100%; width: ${usedPercent}%; transition: width 0.3s;"></div>
                            </div>
                          </div>
                        `;
                        })
                        .join("")}
                    </div>`
                  : ""
              }
              <div class="agent-info-item">
                <label>Plataforma:</label>
                <span>${agent.plat || "N/A"}</span>
              </div>
              <div class="agent-info-item">
                <label>Agent ID:</label>
                <span class="agent-id">${agent.agent_id}</span>
              </div>
            </div>
          </div>
        `;
          })
          .join("")}
      </div>
    `;
  } catch (error) {
    console.error("Erro ao carregar agents:", error);
    document.getElementById("agentsLoading").style.display = "none";
    document.getElementById("agentsContainer").innerHTML = `
      <div class="mensagem-erro">
        <p>❌ Erro ao carregar agents</p>
      </div>
    `;
  }
};

document.getElementById("btnFecharAgents").addEventListener("click", () => {
  document.getElementById("modalAgents").style.display = "none";
});

// Modal de importação
document.getElementById("btnImportar").addEventListener("click", () => {
  document.getElementById("modalImportar").style.display = "flex";
  // Pré-preencher campos
  document.getElementById("importarApiUrl").value =
    "https://api.digitalrf.com.br";
  document.getElementById("importarApiKey").value =
    "ZU6NYHAHKQXAXJFK3PQT89WQJLWKVPRL";
});

document.getElementById("btnFecharImportar").addEventListener("click", () => {
  document.getElementById("modalImportar").style.display = "none";
});

document.getElementById("btnCancelarImportar").addEventListener("click", () => {
  document.getElementById("modalImportar").style.display = "none";
});

// Toggle de senha na importação
document.getElementById("btnToggleImportKey").addEventListener("click", () => {
  const input = document.getElementById("importarApiKey");
  const btn = document.getElementById("btnToggleImportKey");

  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁️";
  }
});

// Importar clientes
document
  .getElementById("formImportar")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const apiUrl = document.getElementById("importarApiUrl").value.trim();
    const apiKey = document.getElementById("importarApiKey").value.trim();

    if (!apiUrl || !apiKey) {
      mostrarMensagem("Preencha todos os campos obrigatórios", "erro");
      return;
    }

    try {
      mostrarMensagem("⏳ Importando clientes...", "info");

      const response = await fetch("/api/trmm/importar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ api_url: apiUrl, api_key: apiKey }),
      });

      const data = await response.json();

      if (!data.sucesso) {
        mostrarMensagem(data.mensagem || "Erro ao importar clientes", "erro");
        return;
      }

      mostrarMensagem(
        `✅ Importação concluída! ${data.importados} clientes importados`,
        "sucesso"
      );

      document.getElementById("modalImportar").style.display = "none";
      await carregarClientes();
    } catch (error) {
      console.error("Erro ao importar clientes:", error);
      mostrarMensagem("Erro ao importar clientes", "erro");
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
