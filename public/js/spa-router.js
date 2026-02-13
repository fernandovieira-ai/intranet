// ========== SPA ROUTER v2.0 - CONSOLIDAÇÃO DE HEADER ==========

import { atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

// ========== CONFIGURAÇÃO ==========
const PAGES = {
  home: {
    url: '/pages/home.html',
    title: 'Dashboard',
    hasModule: true
  },
  plantao: {
    url: 'plantao.html',
    title: 'Plantão',
    hasModule: false
  },
  tomticket: {
    url: 'tomticket.html',
    title: 'TomTicket',
    hasModule: false
  },
  dtef: {
    url: 'dtef.html',
    title: 'Senhas DTEF',
    hasModule: false
  },
  trmm: {
    url: 'trmm.html',
    title: 'Tactical RMM',
    hasModule: false
  },
  anydesk: {
    url: 'anydesk.html',
    title: 'AnyDesk',
    hasModule: false
  },
  contratos: {
    url: 'contratos.html',
    title: 'Contratos',
    hasModule: false
  },
  restrito: {
    url: 'restrito.html',
    title: 'Dados Restritos',
    hasModule: false
  },
  'faq-erros': {
    url: 'faq-erros.html',
    title: 'FAQ de Erros',
    hasModule: false
  },
  usuarios: {
    url: 'usuarios.html',
    title: 'Usuários',
    hasModule: false
  }
};

// Estado global
let currentPage = null;
let isLoading = false;

// Elementos DOM
const container = document.getElementById('conteudoDinamico');
const loader = document.getElementById('pageLoader');

// ========== FUNÇÕES AUXILIARES ==========

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoader() {
  if (loader) loader.classList.add('active');
}

function hideLoader() {
  if (loader) loader.classList.remove('active');
}

/**
 * Limpa HTML removendo elementos indesejados
 */
function cleanHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Remover tags estruturais
  const unwantedTags = ['html', 'head', 'body', 'title', 'meta', 'link'];
  unwantedTags.forEach(tag => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  // 2. Remover headers/navs duplicados
  const headers = doc.querySelectorAll('header, .header');
  headers.forEach(h => h.remove());

  const navs = doc.querySelectorAll('nav, .sidebar');
  navs.forEach(n => n.remove());

  // 3. Remover sidebars duplicadas
  const sidebars = doc.querySelectorAll('.sidebar, #sidebar');
  sidebars.forEach(s => s.remove());

  // 4. Remover overlays duplicados
  const overlays = doc.querySelectorAll('.sidebar-overlay, #sidebarOverlay');
  overlays.forEach(o => o.remove());

  // 5. Remover estilos conflitantes
  const styles = doc.querySelectorAll('style');
  styles.forEach(s => s.remove());

  // 6. PRESERVAR scripts - NÃO REMOVER! As páginas precisam deles

  // 7. Extrair conteúdo principal
  let mainContent = doc.querySelector('main.main-content, main, .main-content, .container');

  if (!mainContent) {
    mainContent = doc.body;
  }

  // 8. Limpar classes conflitantes
  if (mainContent) {
    mainContent.classList.remove('container', 'body', 'html', 'main-content');
  }

  // 9. Retornar HTML limpo (COM scripts preservados)
  return mainContent ? mainContent.innerHTML : '';
}

/**
 * Carrega e injeta scripts ES6 modules dinamicamente
 */
async function loadPageScripts(pageName) {
  const page = PAGES[pageName];

  if (!page.hasModule) return;

  try {
    // Remover script anterior se existir
    const oldScript = document.getElementById('dynamic-page-script');
    if (oldScript) {
      oldScript.remove();
    }

    // Criar novo script
    const script = document.createElement('script');
    script.id = 'dynamic-page-script';
    script.type = 'module';

    // Determinar caminho do módulo
    // home usa dashboard.js, outros usam seu próprio nome
    const nomeArquivo = pageName === 'home' ? 'dashboard' : pageName;
    const modulePath = `js/${nomeArquivo}.js`;
    script.src = `${modulePath}?t=${Date.now()}`; // Cache busting

    // Adicionar ao documento
    document.body.appendChild(script);

    console.log(`✅ Script carregado: ${modulePath}`);
  } catch (error) {
    console.warn(`⚠️ Módulo não encontrado para ${pageName}:`, error);
  }
}

// ========== FUNÇÕES DE NAVEGAÇÃO ==========

/**
 * Carrega uma página via AJAX/Fetch
 */
async function loadPage(pageName) {
  // Prevenir carregamentos simultâneos
  if (isLoading) {
    console.log('⏳ Carregamento em andamento, aguardando...');
    return;
  }

  const page = PAGES[pageName];
  if (!page) {
    console.error(`❌ Página não encontrada: ${pageName}`);
    showError(`Página "${pageName}" não encontrada`);
    return;
  }

  // Verificar se já estamos na página solicitada (evita reload desnecessário)
  if (currentPage === pageName && container.innerHTML.trim() !== '') {
    console.log(`✅ Já estamos na página: ${pageName}, pulando carregamento`);
    return;
  }

  try {
    isLoading = true;
    showLoader();

    console.log(`📄 Carregando página: ${pageName} (${page.url})`);

    // Buscar conteúdo da página
    const response = await fetch(page.url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const fullHTML = await response.text();

    // Limpar HTML indesejado
    const cleanedHTML = cleanHTML(fullHTML);

    console.log(`🧹 HTML limpo e pronto para inserção`);

    // Fade out do conteúdo atual
    container.classList.add('loading');
    await wait(200);

    // Inserir novo conteúdo limpo
    container.innerHTML = cleanedHTML;

    // Atualizar título da página
    document.title = `${page.title} - Intranet`;

    // Carregar scripts da página (se houver)
    await loadPageScripts(pageName);

    // Fade in do novo conteúdo
    await wait(50);
    container.classList.remove('loading');
    container.classList.add('loaded');

    // Atualizar estado atual
    currentPage = pageName;

    // Atualizar menu ativo
    updateActiveMenu(pageName);

    // Fechar menu mobile após navegação
    closeMobileSidebar();

    // Scroll para o topo suave
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log(`✅ Página carregada com sucesso: ${pageName}`);

  } catch (error) {
    console.error('❌ Erro ao carregar página:', error);
    showError(`Erro ao carregar ${page.title}: ${error.message}`);
  } finally {
    isLoading = false;
    hideLoader();
  }
}

/**
 * Mostra mensagem de erro
 */
function showError(message) {
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <h2>❌ Erro</h2>
        <p>${message}</p>
        <button onclick="window.SPARouter.loadPage('home')" class="btn-primary">
          Voltar para o Dashboard
        </button>
      </div>
    `;
  }
}

/**
 * Atualiza o menu ativo
 */
function updateActiveMenu(pageName) {
  // Remover classe active de todos
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.classList.remove('active');
  });

  // Adicionar classe active no link correspondente
  const activeLink = document.querySelector(`[data-page="${pageName}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

/**
 * Fecha o menu mobile
 */
function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');

  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  if (menuToggle) menuToggle.innerHTML = '☰ Menu';
}

// ========== SETUP DE EVENT LISTENERS ==========

/**
 * Configura event listeners nos links do menu
 */
function setupMenuListeners() {
  const menuLinks = document.querySelectorAll('[data-page]');
  let count = 0;

  menuLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const pageName = link.dataset.page;
      await loadPage(pageName);
    });
    count++;
  });

  console.log(`🔗 ${count} links de menu configurados`);
}

/**
 * Configura menu mobile
 */
function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!menuToggle || !sidebar || !overlay) {
    console.warn('⚠️ Elementos do menu mobile não encontrados');
    return;
  }

  // Toggle menu
  menuToggle.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    menuToggle.innerHTML = isOpen ? '✕ Fechar' : '☰ Menu';
  });

  // Fechar ao clicar no overlay
  overlay.addEventListener('click', closeMobileSidebar);

  console.log('📱 Menu mobile configurado');
}

/**
 * Verifica se menu de usuários deve aparecer
 */
async function verificarMenuAdmin() {
  try {
    const response = await fetch('/api/verificar-sessao');
    const data = await response.json();

    const menuUsuarios = document.getElementById('menuUsuarios');
    if (menuUsuarios) {
      menuUsuarios.style.display = data.usuario?.admin ? 'block' : 'none';
    }
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
  }
}

// ========== INICIALIZAÇÃO ==========

/**
 * Inicializa o SPA Router
 */
async function init() {
  console.log('🚀 Inicializando SPA Router v2.0...');

  try {
    // Atualizar header com dados do usuário
    await atualizarHeaderUsuario();
    console.log('✅ Header atualizado');

    // Configurar logout
    configurarLogout();
    console.log('✅ Logout configurado');

    // Verificar se é admin
    await verificarMenuAdmin();
    console.log('✅ Permissões verificadas');

    // Configurar event listeners
    setupMenuListeners();
    setupMobileMenu();

    // Carregar página inicial (home/dashboard)
    await loadPage('home');

    console.log('✅ SPA Router inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar SPA Router:', error);
    showError('Erro ao inicializar o sistema. Por favor, recarregue a página.');
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Exportar funções para uso global
window.SPARouter = {
  loadPage,
  currentPage: () => currentPage
};

// Função global para carregar página (compatibilidade com onclick)
window.carregarPagina = loadPage;

console.log('📦 SPA Router carregado');
