# Copilot Instructions for AI Agents

## Visão Geral

Este projeto é uma intranet corporativa com autenticação de usuários, construída principalmente em PHP (backend/API) e HTML/JS/CSS (frontend). O banco de dados utilizado é PostgreSQL. O fluxo principal é autenticação, controle de sessão e acesso a páginas protegidas.

## Estrutura Principal

- `api/`: Endpoints PHP para autenticação, sessão e logout. Use `config.php` para conexão com o banco.
- `public/`: Páginas HTML, CSS e JS para interface do usuário. Scripts JS interagem com a API via AJAX.
- `config/`, `routes/`, `scripts/`, `utils/`: Scripts auxiliares, rotas JS, utilitários e configurações adicionais.

## Fluxo de Autenticação

1. Usuário acessa `index.html`.
2. JS (`login.js`) envia credenciais para `api/login.php`.
3. API valida credenciais usando hash bcrypt e retorna status.
4. Sessão é criada e validada em cada página protegida via `api/verificar_sessao.php`.
5. Logout via `api/logout.php`.

## Banco de Dados

- Tabela principal: `drfintra.tab_usuario`.
- Campos: `id`, `nom_usuario`, `senha` (bcrypt), `email`, `ind_bloqueado`, `ind_ativo`, `ind_adm`.
- Scripts SQL em `sql/` e scripts de manutenção em `scripts/`.

## Convenções Específicas

- Senhas sempre via `password_hash` (PHP).
- Sessões PHP configuradas para HttpOnly.
- Uso de prepared statements para evitar SQL Injection.
- Scripts de manutenção e testes em `scripts/` (ex: `criar_admin.js`, `testar_rota_usuarios.js`).
- Rotas JS em `routes/` para modularização do frontend.

## Workflows Importantes

- **Configuração:** Edite `api/config.php` para credenciais do banco.
- **Testes:** Scripts de teste em `scripts/` podem ser executados via Node.js.
- **Build/Deploy:** Não há build automatizado; basta copiar arquivos para o servidor web.
- **Debug:** Use logs PHP e console JS. Scripts de teste auxiliam na validação de rotas e tabelas.

## Integrações e Dependências

- PHP >= 7.4, PostgreSQL, Extensão PDO PostgreSQL.
- Node.js para scripts auxiliares.
- Servidor web (Apache/Nginx).

## Exemplos de Padrões

- Autenticação: `api/login.php` + `public/js/login.js`
- Sessão: `api/verificar_sessao.php` + validação JS nas páginas protegidas
- Scripts de manutenção: `scripts/criar_admin.js`, `scripts/testar_rota_usuarios.js`

## Recomendações para Agentes

- Sempre valide sessão antes de acessar páginas protegidas.
- Use prepared statements em qualquer acesso ao banco.
- Siga a estrutura de rotas JS para novas páginas.
- Consulte scripts de teste para exemplos de uso das APIs.

---

Atualize este documento conforme novas convenções surgirem. Consulte o README.md para detalhes adicionais.
