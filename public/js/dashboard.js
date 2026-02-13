// Importar funções de senha diária
import {
  gerarSenhaDiaria,
  gerarSenhasProximosDias,
  formatarDataSenha,
} from "./senha-diaria.js";

// Importar funções de mensagens
import { inicializarMensagens } from "./mensagens.js";

// Função para carregar/atualizar foto do usuário
async function atualizarFotoUsuario() {
  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (data.logado && data.usuario.foto_perfil) {
      const userPhoto = document.getElementById("userPhoto");
      if (userPhoto) {
        const timestamp = new Date().getTime();
        const fotoUrl = `/api/usuarios/${data.usuario.id}/foto?t=${timestamp}`;
        console.log("Atualizando foto do usuário:", fotoUrl);
        userPhoto.src = fotoUrl;
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar foto:", error);
  }
}

// ========== SIDEBAR MENU TOGGLE ==========
function inicializarMenuLateral() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  // Toggle do menu ao clicar no botão
  menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("active");

    // Atualizar texto do botão
    if (isOpen) {
      menuToggle.innerHTML = '✕ Fechar';
    } else {
      menuToggle.innerHTML = '☰ Menu';
    }
  });

  // Fechar menu ao clicar no overlay
  sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
    menuToggle.innerHTML = '☰ Menu';
  });

  // Fechar menu ao clicar em um link (APENAS em mobile, não em desktop/tablet)
  const menuLinks = sidebar.querySelectorAll(".sidebar-menu a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      // Só fecha o menu se estiver em mobile (600px ou menos)
      if (window.innerWidth <= 600 && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
        menuToggle.innerHTML = '☰ Menu';
      }
      // Em desktop e tablet (> 600px), o menu permanece aberto
    });
  });

  // Menu de usuários agora é visível para todos
}

// Verificar se está logado ao carregar a página
window.addEventListener("load", async function () {
  // Inicializar menu lateral
  inicializarMenuLateral();
  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (!data.logado) {
      window.location.href = "index.html";
      return;
    }

    // Exibir nome do usuário
    document.getElementById("userName").textContent = data.usuario.nome;

    // Exibir foto de perfil
    const userPhoto = document.getElementById("userPhoto");
    console.log(
      "Dashboard - Usuário ID:",
      data.usuario.id,
      "Tem foto:",
      data.usuario.foto_perfil
    );
    if (userPhoto && data.usuario.foto_perfil) {
      const timestamp = new Date().getTime();
      const fotoUrl = `/api/usuarios/${data.usuario.id}/foto?t=${timestamp}`;
      console.log("Dashboard - Carregando foto da URL:", fotoUrl);
      userPhoto.src = fotoUrl;
      userPhoto.onload = () =>
        console.log("Dashboard - Foto carregada com sucesso!");
      userPhoto.onerror = (e) => {
        console.error("Dashboard - Erro ao carregar foto:", e);
        userPhoto.src = "/images/default-avatar.svg";
      };
    } else {
      console.log("Dashboard - Usuário não tem foto, usando avatar padrão");
    }

    console.log("👤 Usuário logado:", data.usuario);
    console.log("🔐 É admin?", data.usuario.admin);

    // Inicializar senha diária
    inicializarSenhaDiaria();

    // Carregar informativos
    await carregarInformativos();

    // Mostrar botão de gerenciar informativos apenas para admin
    if (data.usuario.admin) {
      const btnGerenciar = document.getElementById("btnGerenciarInformativos");
      if (btnGerenciar) {
        btnGerenciar.style.display = "block";
        btnGerenciar.querySelector("button").addEventListener("click", () => {
          window.location.href = "informativos.html";
        });
      }
    }

    // Inicializar sistema de mensagens
    await inicializarMensagens(data.usuario);
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "index.html";
  }
});

async function carregarInformativos() {
  try {
    const response = await fetch("/api/informativos");
    const data = await response.json();

    if (!data.sucesso) {
      return;
    }

    const container = document.getElementById("informativosContainer");

    if (data.informativos.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = data.informativos
      .map((inf) => {
        const dataValidade = inf.dta_validade
          ? new Date(inf.dta_validade + "T00:00:00").toLocaleDateString("pt-BR")
          : null;

        return `
          <div class="informativo-card">
            <div class="informativo-header">
              <h3 class="informativo-titulo">${inf.titulo}</h3>
              ${
                dataValidade
                  ? `<span class="informativo-validade">📅 Válido até ${dataValidade}</span>`
                  : ""
              }
            </div>
            <p class="informativo-descricao">${inf.descricao}</p>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Erro ao carregar informativos:", error);
  }
}

// Logout
document
  .getElementById("btnLogout")
  .addEventListener("click", async function () {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (data.sucesso) {
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      window.location.href = "index.html";
    }
  });

// ========== SENHA DIÁRIA LZT ==========

function inicializarSenhaDiaria() {
  // Exibir senha de hoje
  const senhaHoje = gerarSenhaDiaria();
  const hoje = new Date();

  document.getElementById("senhaHoje").textContent = senhaHoje;
  document.getElementById("dataHoje").textContent = formatarDataSenha(hoje);

  // Botão para copiar senha
  document
    .getElementById("btnCopiarSenha")
    .addEventListener("click", () => copiarSenha(senhaHoje));

  // Botão para ver próximas senhas
  document
    .getElementById("btnVerProximasSenhas")
    .addEventListener("click", mostrarProximasSenhas);

  // Botão para fechar modal
  document
    .getElementById("btnFecharModalSenhas")
    .addEventListener("click", fecharModalSenhas);

  // Fechar modal ao clicar fora
  document.getElementById("modalSenhas").addEventListener("click", (e) => {
    if (e.target.id === "modalSenhas") {
      fecharModalSenhas();
    }
  });
}

function copiarSenha(senha) {
  navigator.clipboard
    .writeText(senha)
    .then(() => {
      const btn = document.getElementById("btnCopiarSenha");
      const mensagem = document.getElementById("mensagemSenhaLZT");
      const textoOriginal = btn.textContent;

      // Alterar botão
      btn.textContent = "✓";
      btn.style.background = "rgba(76, 175, 80, 0.3)";

      // Mostrar mensagem
      mensagem.textContent = "✓ Senha copiada com sucesso!";
      mensagem.className = "mensagem-senha-lzt sucesso";
      mensagem.style.display = "block";

      setTimeout(() => {
        btn.textContent = textoOriginal;
        btn.style.background = "rgba(255, 255, 255, 0.2)";
        mensagem.style.display = "none";
        mensagem.className = "mensagem-senha-lzt";
      }, 2000);
    })
    .catch((err) => {
      console.error("Erro ao copiar:", err);
      const mensagem = document.getElementById("mensagemSenhaLZT");
      mensagem.textContent = "Erro ao copiar senha";
      mensagem.className = "mensagem-senha-lzt erro";
      mensagem.style.display = "block";

      setTimeout(() => {
        mensagem.style.display = "none";
        mensagem.className = "mensagem-senha-lzt";
      }, 2000);
    });
}

function mostrarProximasSenhas() {
  const senhas = gerarSenhasProximosDias(7);
  const listaSenhas = document.getElementById("listaSenhas");

  let html = '<div class="senhas-grid">';

  senhas.forEach((item) => {
    html += `
      <div class="senha-item ${item.ehHoje ? "senha-item-hoje" : ""}">
        <div class="senha-item-header">
          <strong>${item.diaSemana}</strong>
          <span>${item.data}</span>
        </div>
        <div class="senha-item-valor">${item.senha}</div>
        ${item.ehHoje ? '<span class="badge-hoje">HOJE</span>' : ""}
      </div>
    `;
  });

  html += "</div>";
  listaSenhas.innerHTML = html;

  document.getElementById("modalSenhas").style.display = "flex";
}

function fecharModalSenhas() {
  document.getElementById("modalSenhas").style.display = "none";
}

// Atualizar foto quando a página ganhar visibilidade (quando voltar de outra página)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    console.log("Página visível novamente, atualizando foto...");
    atualizarFotoUsuario();
  }
});
