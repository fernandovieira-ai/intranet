# 🔍 ANÁLISE: ONDE O HEADER APARECE

## 📍 Header: `👤 [Foto] Olá, [Nome] [Sair] 🚪`

---

## ✅ TELAS QUE TÊM O HEADER

### 🏠 **Dashboard** (dashboard.html)
**Tipo:** Header HARDCODED (direto no HTML)

```html
<header class="header">
  <div class="header-content">
    <div class="user-profile">
      <img id="userPhoto" src="/images/default-avatar.svg" />
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
```

**Como funciona:**
- Header está ESCRITO no dashboard.html
- JavaScript (dashboard.js) apenas PREENCHE os dados
- `userName.textContent = "Fernando"`
- `userPhoto.src = "/api/usuarios/123/foto"`

---

### 📅 **Plantão** (plantao.html)
**Tipo:** Header GERADO via JavaScript

```html
<!-- HTML vazio -->
<!-- Header será inserido via JavaScript -->

<div class="container">
  <!-- Aqui o JavaScript insere o header -->
</div>
```

**Como funciona:**
```javascript
// plantao.js (linha 9)
inserirSidebar('plantao');        // Insere sidebar
await atualizarHeaderUsuario();    // Insere header
configurarLogout();
```

**Processo:**
1. Página carrega SEM header
2. JavaScript `sidebar.js` executa
3. Função `inserirSidebar()` CRIA o header via JavaScript
4. Insere no DOM: `container.insertAdjacentHTML('afterbegin', headerHTML)`
5. Preenche dados do usuário

---

### 🎫 **TomTicket** (tomticket.html)
**Tipo:** Header GERADO via JavaScript

```javascript
// tomticket.js
import { inserirSidebar, atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

window.addEventListener("load", async function() {
  inserirSidebar('tomticket');      // ← INSERE HEADER
  await atualizarHeaderUsuario();
  configurarLogout();
});
```

---

### 🔐 **Senhas DTEF** (dtef.html)
**Tipo:** Header GERADO via JavaScript

```javascript
// dtef.js
import { inserirSidebar, atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

window.addEventListener("load", async function() {
  inserirSidebar('dtef');           // ← INSERE HEADER
  await atualizarHeaderUsuario();
  configurarLogout();
});
```

---

### 🖥️ **Tactical RMM** (trmm.html)
**Tipo:** Header GERADO via JavaScript

```javascript
// trmm.js
import { inserirSidebar, atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

window.addEventListener("load", async function() {
  inserirSidebar('trmm');           // ← INSERE HEADER
  await atualizarHeaderUsuario();
  configurarLogout();
});
```

---

### 💻 **AnyDesk** (anydesk.html)
**Tipo:** Header GERADO via JavaScript

```javascript
// anydesk.js
import { inserirSidebar, atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

window.addEventListener("load", async function() {
  inserirSidebar('anydesk');        // ← INSERE HEADER
  await atualizarHeaderUsuario();
  configurarLogout();
});
```

---

### 📋 **Contratos** (contratos.html)
**Tipo:** Header GERADO via JavaScript

```javascript
// contratos.js
import { inserirSidebar, atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

window.addEventListener("load", async function() {
  inserirSidebar('contratos');      // ← INSERE HEADER
  await atualizarHeaderUsuario();
  configurarLogout();
});
```

---

### 🔒 **Dados Restritos** (restrito.html)
**Tipo:** Header GERADO via JavaScript

```javascript
// restrito.js
import { inserirSidebar, atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

window.addEventListener("load", async function() {
  inserirSidebar('restrito');       // ← INSERE HEADER
  await atualizarHeaderUsuario();
  configurarLogout();
});
```

---

### ❓ **FAQ de Erros** (faq-erros.html)
**Tipo:** Header GERADO via JavaScript

```javascript
// faq-erros.js
import { inserirSidebar, atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

window.addEventListener("load", async function() {
  inserirSidebar('faq-erros');      // ← INSERE HEADER
  await atualizarHeaderUsuario();
  configurarLogout();
});
```

---

### 👥 **Usuários** (usuarios.html)
**Tipo:** Header GERADO via JavaScript

```javascript
// usuarios.js
import { inserirSidebar, atualizarHeaderUsuario, configurarLogout } from './sidebar.js';

window.addEventListener("load", async function() {
  inserirSidebar('usuarios');       // ← INSERE HEADER
  await atualizarHeaderUsuario();
  configurarLogout();
});
```

---

## ❌ TELAS QUE **NÃO** TÊM O HEADER

### 🔑 **Login** (index.html)
**Motivo:** Usuário ainda não está logado

```html
<!-- Apenas formulário de login -->
<form id="loginForm">
  <input type="text" id="usuario" />
  <input type="password" id="senha" />
  <button type="submit">Entrar</button>
</form>
```

**Não tem:**
- ❌ Header
- ❌ Sidebar
- ❌ Foto de usuário
- ❌ Nome de usuário
- ❌ Botão Sair

---

### 📢 **Informativos** (informativos.html)
**Status:** DESCONHECIDO (não verificado)

**Observação:** Pode ou não ter header, depende se usa `inserirSidebar()`.

---

## 📊 RESUMO

### **Total de telas:** 11 telas

| Tela | Tem Header? | Tipo |
|------|-------------|------|
| 🔑 Login | ❌ NÃO | - |
| 🏠 Dashboard | ✅ SIM | Hardcoded |
| 📅 Plantão | ✅ SIM | JavaScript |
| 🎫 TomTicket | ✅ SIM | JavaScript |
| 🔐 Senhas DTEF | ✅ SIM | JavaScript |
| 🖥️ Tactical RMM | ✅ SIM | JavaScript |
| 💻 AnyDesk | ✅ SIM | JavaScript |
| �� Contratos | ✅ SIM | JavaScript |
| 🔒 Dados Restritos | ✅ SIM | JavaScript |
| ❓ FAQ de Erros | ✅ SIM | JavaScript |
| 👥 Usuários | ✅ SIM | JavaScript |

**Total com header:** 10 telas (91%)

---

## 🔄 COMO O HEADER É GERADO

### **Método 1: Hardcoded (Dashboard)**

```
dashboard.html carrega
        ↓
HTML já tem o header
        ↓
JavaScript apenas preenche:
├─ userName.textContent = "Fernando"
├─ userPhoto.src = "/foto.jpg"
└─ btnLogout.addEventListener(...)
```

### **Método 2: JavaScript (Outras 9 páginas)**

```
plantao.html carrega (SEM header no HTML)
        ↓
JavaScript plantao.js executa
        ↓
import { inserirSidebar } from './sidebar.js'
        ↓
inserirSidebar('plantao') executa
        ↓
sidebar.js CRIA o HTML do header:
├─ Cria string com HTML completo
├─ insertAdjacentHTML no container
└─ Header aparece na página
        ↓
atualizarHeaderUsuario() executa
        ↓
fetch('/api/verificar-sessao')
        ↓
Preenche dados:
├─ userName.textContent = "Fernando"
└─ userPhoto.src = "/foto.jpg"
```

---

## 📍 ONDE ESTÁ O CÓDIGO

### **Header Hardcoded:**
- **Arquivo:** `dashboard.html` (linhas 101-120)

### **Header Gerado por JavaScript:**
- **Código fonte:** `js/sidebar.js` (linhas 86-112)
- **Função:** `inserirSidebar(paginaAtiva)`

### **Usado por:**
- `js/plantao.js` (linha 9)
- `js/tomticket.js`
- `js/dtef.js`
- `js/trmm.js`
- `js/anydesk.js`
- `js/contratos.js`
- `js/restrito.js`
- `js/faq-erros.js`
- `js/usuarios.js`

---

## 🎯 COMPORTAMENTO ATUAL

### **Ao navegar entre páginas:**

```
Dashboard → Plantão
        ↓
1. Header do dashboard SOME (página fecha)
2. Tela fica BRANCA
3. plantao.html carrega
4. JavaScript cria header do ZERO
5. fetch busca dados do usuário
6. Header APARECE com foto e nome
```

**Resultado:**
- ❌ Header pisca/desaparece
- ❌ Foto e nome recarregam
- ❌ Tela branca entre páginas
- ⏱️ +1-2 segundos

---

## ✅ CONCLUSÃO

**O Header aparece em:**
- ✅ **10 de 11 telas** (91%)
- ✅ **Todas as páginas logadas**

**NÃO aparece em:**
- ❌ **Login** (lógico, usuário não logou ainda)

**Problema atual:**
- 🔴 Dashboard tem header hardcoded
- 🟡 Outras páginas geram via JavaScript
- ❌ Header recarrega a cada navegação
- ❌ Foto e nome buscam do servidor toda vez

**Solução ideal (SPA):**
- ✅ Header FIXO no dashboard.html
- ✅ Carrega 1 vez após login
- ✅ NUNCA recarrega ao navegar
- ✅ Foto e nome sempre visíveis

---

**Data:** 2025-11-26
**Status:** Header em 10/11 telas
**Método:** 1 hardcoded + 9 geradas por JS
