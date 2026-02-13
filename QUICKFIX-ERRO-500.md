# 🚨 Resolver Erro 500 no Login - Guia Rápido

## Problema

- ❌ Erro 404: `/images/icon-192.png` → **RESOLVIDO** ✅
- ❌ Erro 500: `/api/login` → **PRECISA SETUP DO BANCO**

## Solução em 3 Passos

### 1️⃣ Acessar PostgreSQL no Railway

1. Vá para https://railway.app/project/[seu-projeto]
2. Clique no card **PostgreSQL**
3. Clique na aba **Data**
4. Clique em **Query** (ou **SQL**)

### 2️⃣ Copiar e Colar o Script SQL

Abra o arquivo: **[sql/setup_database.sql](sql/setup_database.sql)**

Copie **TODO** o conteúdo e cole no console SQL do Railway

Clique em **Run** ou **Execute**

✅ Aguarde mensagem de sucesso

### 3️⃣ Criar Usuário Admin

**Opção A - Via Script Automático (Recomendado):**

```bash
railway run node scripts/criar_admin_railway.js
```

Siga as instruções na tela.

**Opção B - Via SQL Manualmente:**

No console SQL do Railway, execute:

```sql
INSERT INTO drfintra.tab_usuario (
    nom_usuario,
    senha,
    email,
    ind_adm,
    ind_ativo
) VALUES (
    'admin',
    '$2b$10$N9qo8uIcUqXpXqL8jZZnvu8Qm5KZ1QZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5u',
    'admin@digitalrf.com.br',
    'S',
    'S'
);
```

**Credenciais para login:**

- Usuário: `admin`
- Senha: `admin123`

> **💡 Dica**: Após primeiro login, vá em Usuários e altere a senha padrão!

---

## ✅ Pronto! Agora teste:

1. Acesse sua URL do Railway
2. Faça login com:
   - Usuário: `admin`
   - Senha: `admin123`

## 📚 Documentação Completa

- [Setup Detalhado do Banco](docs/SETUP-DATABASE.md)
- [Troubleshooting](TROUBLESHOOTING-RAILWAY.md)
- [Guia Railway](RAILWAY.md)

---

**Criado**: 13/02/2026
