# Deploy Rápido no Railway

## 🚀 Checklist de Deploy

### 1️⃣ Antes de Começar

- [ ] Código commitado no GitHub/GitLab
- [ ] Arquivo `.env.example` revisado
- [ ] Credenciais sensíveis removidas do código

### 2️⃣ No Railway

- [ ] Criar novo projeto
- [ ] Conectar repositório Git
- [ ] Adicionar PostgreSQL Database
- [ ] Configurar variáveis de ambiente:
  ```
  NODE_ENV=production
  SESSION_SECRET=[gerar senha forte]
  ```

### 3️⃣ Após Deploy

- [ ] Verificar logs sem erros
- [ ] Criar usuário admin (usar script `scripts/criar_admin.js`)
- [ ] Testar login
- [ ] Verificar conexão com banco de dados

### 4️⃣ Configurações Opcionais

- [ ] Domínio customizado
- [ ] Backup automático do banco
- [ ] Monitoramento de uptime

## 📝 Comandos Úteis

### Gerar SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Ver logs no Railway

```bash
railway logs
```

### Conectar ao banco via Railway CLI

```bash
railway run psql
```

### Criar admin via Railway CLI

```bash
railway run node scripts/criar_admin.js
```

## 🔗 Links Importantes

- [Dashboard Railway](https://railway.app/dashboard)
- [Documentação Completa](./RAILWAY.md)
- [Status Railway](https://status.railway.app/)

## ⚠️ Importante

- ✅ Railway fornece SSL/HTTPS automático
- ✅ `DATABASE_URL` é criada automaticamente
- ✅ `PORT` é injetada automaticamente
- ❌ Não commite o arquivo `.env`
- ❌ Não use certificados SSL manuais no Railway

## 💡 Dica

Para desenvolvimento local, copie `.env.example` para `.env` e configure suas variáveis locais.
