# Troubleshooting Railway - Guia de Resolução de Problemas

## ❌ Erro: "Failed to build an image"

### Problema Resolvido ✅

O erro inicial foi causado pela tentativa de usar PHP e Node.js simultaneamente no Railway.

### Solução Aplicada

Simplificamos a configuração para focar apenas em Node.js:

**railway.toml**

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node server.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**nixpacks.toml**

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[start]
cmd = "node server.js"
```

### ⚠️ Sobre os Arquivos PHP

Os arquivos PHP em `/api/` são mantidos para compatibilidade, mas **não são essenciais** para a aplicação funcionar no Railway. As rotas principais estão implementadas em Node.js em `/routes/`.

Se você precisar de funcionalidade PHP:

1. Use um serviço separado para PHP
2. Ou recrie as rotas em Node.js (recomendado)

## 🔍 Outros Erros Comuns

### "Error: Cannot find module"

**Causa**: Dependências faltando ou `node_modules` corrompido

**Solução**:

```bash
# Localmente
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: Regenerar package-lock.json"
git push
```

### "ECONNREFUSED" ou "Connection timeout"

**Causa**: Banco de dados não configurado ou variáveis de ambiente faltando

**Solução**:

1. Verifique se PostgreSQL foi adicionado ao projeto Railway
2. Confirme que `DATABASE_URL` está presente nas variáveis
3. Verifique logs: `railway logs`

### "Port already in use"

**Causa**: Railway não está lendo a variável `PORT`

**Solução**: Railway injeta automaticamente a variável `PORT`. O `server.js` já está configurado para usar `process.env.PORT`.

### "Session store disconnected"

**Causa**: Sessões em memória não funcionam com múltiplas instâncias

**Solução**: Para produção com escalabilidade, considere usar Redis:

```bash
# No Railway
railway add redis

# No código, instalar connect-redis
npm install connect-redis redis
```

## 📊 Verificar Build Logs

No Railway:

1. Vá em **Deployments**
2. Clique no deploy que falhou
3. Veja a tab **Build Logs**
4. Procure por linhas com `ERROR` ou `FAILED`

Via CLI:

```bash
railway logs --deployment
```

## 🔄 Forçar Rebuild

Se as mudanças não são detectadas:

```bash
# Fazer commit vazio para forçar redeploy
git commit --allow-empty -m "chore: Forçar rebuild Railway"
git push
```

Ou no Railway Dashboard:
**Settings** → **Redeploy**

## 🧪 Testar Build Localmente

Para simular o build do Railway localmente:

```bash
# Instalar nixpacks
npm install -g @railway/nixpacks

# Testar build
nixpacks build . --name intranet-test

# Rodar container
docker run -p 3000:3000 intranet-test
```

## 📝 Checklist Antes de Deploy

- [ ] `package.json` tem `"start": "node server.js"`
- [ ] `package.json` especifica engine Node.js >= 18
- [ ] `.gitignore` não bloqueia arquivos essenciais
- [ ] `node_modules/` está no `.gitignore`
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] PostgreSQL adicionado ao projeto
- [ ] `DATABASE_URL` aparece nas variáveis (automático)
- [ ] Código commitado e pushed para GitHub

## 🆘 Ainda com Problemas?

### Compartilhe os Logs

Copie os logs do build:

```bash
railway logs --deployment > build-logs.txt
```

### Variáveis de Ambiente

Verifique se todas estão corretas:

```bash
railway variables
```

### Testar Localmente

```bash
# Usar variáveis do Railway localmente
railway run npm start
```

### Status do Railway

Verifique se não há problemas na plataforma: https://status.railway.app/

## 💡 Dicas de Performance

1. **Use `npm ci`** em vez de `npm install` (mais rápido e determinístico)
2. **Especifique versão do Node.js** em `package.json` engines
3. **Minimize dependências** - remova pacotes não usados
4. **Use `.railwayignore`** para excluir arquivos desnecessários do build

## 📚 Recursos

- [Documentação Railway](https://docs.railway.app/)
- [Nixpacks Docs](https://nixpacks.com/docs)
- [Railway Discord](https://discord.gg/railway)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Última atualização**: 13 de fevereiro de 2026
