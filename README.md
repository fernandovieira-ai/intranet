# Intranet - Sistema de Login

Sistema de intranet com autenticação de usuários usando PHP e PostgreSQL.

## Estrutura do Projeto

```
intranet/
├── index.html              # Página de login
├── dashboard.html          # Dashboard após login
├── css/
│   ├── style.css          # Estilos da página de login
│   └── dashboard.css      # Estilos do dashboard
├── js/
│   ├── login.js           # JavaScript da página de login
│   └── dashboard.js       # JavaScript do dashboard
├── api/
│   ├── config.php         # Configurações e conexão com BD
│   ├── login.php          # API de autenticação
│   ├── verificar_sessao.php # Verificar se usuário está logado
│   └── logout.php         # API de logout
└── README.md
```

## Banco de Dados

Tabela: `drfintra.tab_usuario`

- `id` - ID do usuário (serial)
- `nom_usuario` - Nome de usuário (varchar 20)
- `senha` - Senha hash (varchar 100)
- `email` - Email (varchar 100)
- `ind_bloqueado` - Indicador de bloqueio (char 1: S/N)
- `ind_ativo` - Indicador de ativo (char 1: S/N)
- `ind_adm` - Indicador de administrador (char 1: S/N)

## Configuração

### Conexão com Banco de Dados

Arquivo: `api/config.php`

- Host: cloud.digitalrf.com.br
- Database: drfweb
- User: drfweb
- Password: ASf5S6g7d6d0s

### Requisitos

- PHP 7.4 ou superior
- PostgreSQL
- Extensão PDO PostgreSQL habilitada
- Servidor web (Apache, Nginx, etc.)

## Como Usar

1. **Criar usuário no banco de dados:**

```sql
INSERT INTO drfintra.tab_usuario
(nom_usuario, senha, email, ind_bloqueado, ind_ativo, ind_adm)
VALUES
('admin', '$2y$10$hash_aqui', 'admin@empresa.com', 'N', 'S', 'S');
```

2. **Gerar hash de senha:** Use o script PHP abaixo para gerar o hash:

```php
<?php
echo password_hash('sua_senha', PASSWORD_DEFAULT);
?>
```

3. **Configurar servidor web:**

   - Coloque os arquivos na pasta do servidor web
   - Certifique-se de que o PHP está configurado corretamente
   - Teste a conexão com o banco de dados

4. **Acessar sistema:**
   - Abra `index.html` no navegador
   - Faça login com usuário e senha cadastrados

## Recursos

- ✅ Autenticação de usuários
- ✅ Verificação de conta bloqueada/inativa
- ✅ Hash de senhas (bcrypt)
- ✅ Controle de sessão
- ✅ Opção "Lembrar-me"
- ✅ Logout seguro
- ✅ Interface responsiva
- ✅ Proteção contra acesso não autorizado

## Segurança

- Senhas armazenadas com hash bcrypt
- Sessões PHP com cookies HttpOnly
- Validação de entrada de dados
- Proteção contra SQL Injection (prepared statements)
- Verificação de sessão em todas as páginas protegidas

## Próximos Passos

- [ ] Adicionar campo `ultimo_acesso` na tabela
- [ ] Implementar recuperação de senha
- [ ] Adicionar captcha após tentativas falhas
- [ ] Criar painel administrativo
- [ ] Implementar logs de acesso
- [ ] Adicionar autenticação de dois fatores (2FA)
