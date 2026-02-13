// ========== SIDEBAR COMPARTILHADO ==========

// Variável global para controlar se é primeira carga
let primeiraCarga = true;
let paginaAtualCarregada = null;

// Função para inserir HTML do sidebar
export function inserirSidebar(paginaAtiva) {
  // Verifica se já existe um sidebar
  if (document.getElementById("sidebar")) {
    console.log("✅ Sidebar já existe, apenas atualizando página ativa");
    atualizarPaginaAtiva(paginaAtiva);
    return;
  }

  console.log("🔄 Criando sidebar pela primeira vez");

  const sidebarHTML = `
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-logo">Intranet</div>
      <ul class="sidebar-menu">
        <li>
          <a href="dashboard.html" class="${
            paginaAtiva === "dashboard" ? "active" : ""
          }">
            <span class="icon">🏠</span>
            <span class="text">Dashboard</span>
          </a>
        </li>
        <li>
          <a href="plantao.html" class="${
            paginaAtiva === "plantao" ? "active" : ""
          }">
            <span class="icon">📅</span>
            <span class="text">Plantão</span>
          </a>
        </li>
        <li>
          <a href="tomticket.html" class="${
            paginaAtiva === "tomticket" ? "active" : ""
          }">
            <span class="icon">🎫</span>
            <span class="text">TomTicket</span>
          </a>
        </li>
        <li>
          <a href="dtef.html" class="${paginaAtiva === "dtef" ? "active" : ""}">
            <span class="icon">🔐</span>
            <span class="text">Senhas DTEF</span>
          </a>
        </li>
        <li>
          <a href="trmm.html" class="${paginaAtiva === "trmm" ? "active" : ""}">
            <span class="icon">🖥️</span>
            <span class="text">Tactical RMM</span>
          </a>
        </li>
        <li>
          <a href="anydesk.html" class="${
            paginaAtiva === "anydesk" ? "active" : ""
          }">
            <span class="icon">💻</span>
            <span class="text">AnyDesk</span>
          </a>
        </li>
        <li>
          <a href="contratos.html" class="${
            paginaAtiva === "contratos" ? "active" : ""
          }">
            <span class="icon">📋</span>
            <span class="text">Contratos</span>
          </a>
        </li>
        <li>
          <a href="restrito.html" class="${
            paginaAtiva === "restrito" ? "active" : ""
          }">
            <span class="icon">🔒</span>
            <span class="text">Dados Restritos</span>
          </a>
        </li>
        <li>
          <a href="faq-erros.html" class="${
            paginaAtiva === "faq-erros" ? "active" : ""
          }">
            <span class="icon">❓</span>
            <span class="text">FAQ de Erros</span>
          </a>
        </li>
        <li id="menuUsuarios" style="display: none">
          <a href="usuarios.html" class="${
            paginaAtiva === "usuarios" ? "active" : ""
          }">
            <span class="icon">👥</span>
            <span class="text">Usuários</span>
          </a>
        </li>
      </ul>
    </div>

    <!-- Overlay para fechar sidebar no mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
  `;

  // Insere sidebar e overlay no início do body
  document.body.insertAdjacentHTML("afterbegin", sidebarHTML);

  // Insere o header padronizado se não existir
  const container = document.querySelector(".container");
  if (container && !container.querySelector(".header")) {
    console.log("🔄 Criando header pela primeira vez");
    const headerHTML = `
      <header class="header">
        <div class="header-content">
          <div class="user-profile">
            <img
              id="userPhoto"
              src="/images/default-avatar.svg"
              alt="Foto de perfil"
              class="user-photo-large"
            />
            <div class="user-details">
              <span class="user-greeting">Olá,</span>
              <span id="userName" class="user-name">Usuário</span>
            </div>
          </div>
          <button id="btnLogout" class="btn-logout">
            <span class="logout-icon">🚪</span>
            <span class="logout-text">Sair</span>
          </button>
        </div>
      </header>
    `;
    container.insertAdjacentHTML("afterbegin", headerHTML);
  } else {
    console.log("✅ Header já existe");
  }

  // Insere o botão toggle após o header
  const header = container ? container.querySelector(".header") : null;
  if (header && !document.getElementById("menuToggle")) {
    const menuToggleHTML = `
      <button class="menu-toggle" id="menuToggle" aria-label="Abrir menu">
        ☰ Menu
      </button>
    `;
    header.insertAdjacentHTML("afterend", menuToggleHTML);
  }
}

// Função para atualizar apenas a classe 'active' no menu
function atualizarPaginaAtiva(paginaAtiva) {
  const menuLinks = document.querySelectorAll(".sidebar-menu a");
  menuLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      const pageName = href.replace(".html", "");
      if (pageName === paginaAtiva) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    }
  });
}

// Função para atualizar informações do usuário no header
export async function atualizarHeaderUsuario() {
  try {
    // Se o header já foi carregado e já temos os dados, não recarrega
    const userName = document.getElementById("userName");
    if (userName && userName.textContent !== "Usuário" && !primeiraCarga) {
      console.log("✅ Header já carregado com dados do usuário");
      return;
    }

    console.log("🔄 Carregando dados do usuário");
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (data.logado) {
      const userPhoto = document.getElementById("userPhoto");

      if (userName) {
        userName.textContent = data.usuario.nome;
      }

      if (userPhoto && data.usuario.foto_perfil) {
        const timestamp = new Date().getTime();
        const fotoUrl = `/api/usuarios/${data.usuario.id}/foto?t=${timestamp}`;
        userPhoto.src = fotoUrl;
      }

      primeiraCarga = false;
      console.log("✅ Dados do usuário carregados");
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar header do usuário:", error);
  }
}

// Função para configurar o botão de logout
export function configurarLogout() {
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async function () {
      try {
        const response = await fetch("/api/logout", { method: "POST" });
        const data = await response.json();

        if (data.sucesso) {
          window.location.href = "index.html";
        }
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        window.location.href = "index.html";
      }
    });
  }
}

// Função para inicializar o menu lateral
export function inicializarMenuLateral() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (!menuToggle || !sidebar || !sidebarOverlay) {
    console.error("Elementos do sidebar não encontrados");
    return;
  }

  // Toggle do menu ao clicar no botão
  menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("active");

    // Atualizar texto do botão
    if (isOpen) {
      menuToggle.innerHTML = "✕ Fechar";
    } else {
      menuToggle.innerHTML = "☰ Menu";
    }
  });

  // Fechar menu ao clicar no overlay
  sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
    menuToggle.innerHTML = "☰ Menu";
  });

  // Fechar menu ao clicar em um link (APENAS em mobile, não em desktop/tablet)
  const menuLinks = sidebar.querySelectorAll(".sidebar-menu a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      // Só fecha o menu se estiver em mobile (600px ou menos)
      if (window.innerWidth <= 600 && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
        menuToggle.innerHTML = "☰ Menu";
      }
      // Em desktop e tablet (> 600px), o menu permanece aberto
    });
  });

  // Verificar se é admin e mostrar menu de usuários
  verificarMenuAdmin();
}

async function verificarMenuAdmin() {
  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (data.logado && data.usuario.admin) {
      const menuUsuarios = document.getElementById("menuUsuarios");
      if (menuUsuarios) {
        menuUsuarios.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Erro ao verificar admin:", error);
  }
}
