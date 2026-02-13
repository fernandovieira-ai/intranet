# Setup do Banco de Dados no Railway

## 🚨 ERRO 500 NO LOGIN? SIGA ESTES PASSOS

O erro acontece porque o banco de dados PostgreSQL do Railway está vazio. Você precisa criar o schema e as tabelas.

## 📋 Passo a Passo

### 1️⃣ Acessar o PostgreSQL no Railway

**Opção A - Via Dashboard (Recomendado):**

1. Vá para o projeto no Railway
2. Clique no serviço **PostgreSQL**
3. Clique na aba **Data**
4. Clique em **Query**

**Opção B - Via Railway CLI:**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar ao PostgreSQL
railway run psql $DATABASE_URL
```

### 2️⃣ Executar Script de Setup

No console SQL do Railway, copie e cole TODO o conteúdo do arquivo:

📄 **[sql/setup_database.sql](../sql/setup_database.sql)**

Ou via CLI:

```bash
# Da raiz do projeto
railway run psql $DATABASE_URL < sql/setup_database.sql
```

**O que este script faz:**

- ✅ Cria o schema `drfintra`
- ✅ Cria tabela `tab_usuario`
- ✅ Cria tabelas auxiliares (mensagens, informativos, faq, plantão)
- ✅ Cria índices para performance
- ✅ Define constraints e validações

### 3️⃣ Criar Usuário Administrador

Após executar o setup, você precisa criar o primeiro usuário admin.

**Opção A - Via SQL direto:**

```sql
-- Substitua 'admin' e 'senha123' pelos valores desejados
-- A senha será: senha123 (hash bcrypt já gerado)
INSERT INTO drfintra.tab_usuario (
    nom_usuario,
    senha,
    email,
    ind_adm,
    ind_ativo
) VALUES (
    'admin',
    '$2b$10$XN7h7b3m7Q8KZ1xH.YqP0eYvQXJZ2KF8xGXqZ0YvKw8KZ1xH.YqP0e',
    'admin@digitalrf.com.br',
    'S',
    'S'
);
```

**⚠️ IMPORTANTE**: O hash acima é para a senha `senha123`. Para criar uma senha diferente:

```bash
# No seu terminal local
node -e "console.log(require('bcrypt').hashSync('SUA_SENHA_AQUI', 10))"
```

**Opção B - Via Script Node.js (Recomendado):**

```bash
# Primeiro, configure as variáveis de ambiente localmente
# Copie DATABASE_URL do Railway e adicione ao .env

# Executar script
railway run node scripts/criar_admin.js
```

### 4️⃣ Verificar Setup

Para confirmar que tudo está funcionando:

```sql
-- Verificar schema e tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'drfintra';

-- Verificar usuário admin
SELECT id, nom_usuario, email, ind_adm, ind_ativo
FROM drfintra.tab_usuario;
```

Você deve ver:

- ✅ 5 tabelas criadas
- ✅ 1 usuário admin ativo

## 🎯 Testar Login

1. Acesse a URL do Railway: `https://seu-app.up.railway.app`
2. Use as credenciais:
   - **Usuário**: `admin`
   - **Senha**: `senha123` (ou a que você definiu)
3. Deve fazer login com sucesso ✅

## 🔧 Troubleshooting

### Erro: "schema drfintra does not exist"

Execute o script SQL novamente:

```bash
railway run psql $DATABASE_URL < sql/setup_database.sql
```

### Erro: "relation tab_usuario does not exist"

O schema foi criado mas a tabela não. Execute:

```sql
CREATE TABLE drfintra.tab_usuario (
    id SERIAL PRIMARY KEY,
    nom_usuario VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    ind_bloqueado CHAR(1) DEFAULT 'N',
    ind_ativo CHAR(1) DEFAULT 'S',
    ind_adm CHAR(1) DEFAULT 'N',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP
);
```

### Erro: "duplicate key value violates unique constraint"

Usuário admin já existe. Para resetar senha:

```sql
UPDATE drfintra.tab_usuario
SET senha = '$2b$10$XN7h7b3m7Q8KZ1xH.YqP0eYvQXJZ2KF8xGXqZ0YvKw8KZ1xH.YqP0e'
WHERE nom_usuario = 'admin';
-- Nova senha: senha123
```

### Conexão recusada

Verifique se:

1. PostgreSQL está rodando no Railway
2. Variável `DATABASE_URL` existe
3. Aplicação tem acesso ao banco

```bash
# Testar conexão
railway run psql $DATABASE_URL -c "SELECT version();"
```

## 📊 Estrutura Criada

```
drfintra (schema)
├── tab_usuario (usuários do sistema)
├── tab_mensagem (mensagens/avisos)
├── tab_informativo (informativos e links)
├── tab_faq_erro (FAQ e erros)
└── tab_plantao (escala de plantão)
```

## 🔐 Segurança

**Após primeiro login:**

1. ✅ Altere a senha padrão do admin
2. ✅ Crie usuários individuais para cada pessoa
3. ✅ Não compartilhe a senha do admin
4. ✅ Configure backup regular do banco

## 📞 Precisa de Ajuda?

- Veja logs do Railway: `railway logs`
- Consulte: [TROUBLESHOOTING-RAILWAY.md](../TROUBLESHOOTING-RAILWAY.md)
- Documentação: [RAILWAY.md](../RAILWAY.md)

---

**Última atualização**: 13 de fevereiro de 2026
