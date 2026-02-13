# Configuração de Variáveis de Ambiente para Railway

## Copie e cole estas variáveis no painel do Railway

### Variáveis Essenciais

```env
NODE_ENV=production
SESSION_SECRET=SUBSTITUIR_POR_SENHA_GERADA
USE_HTTPS=false
```

### Como gerar SESSION_SECRET seguro

Execute no terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e substitua `SUBSTITUIR_POR_SENHA_GERADA` acima.

### Variáveis do Banco de Dados

⚠️ **IMPORTANTE**: Se você adicionou PostgreSQL pelo Railway, ele já cria automaticamente a variável `DATABASE_URL`. Neste caso, você NÃO precisa adicionar as variáveis abaixo.

Se estiver usando um banco de dados externo, adicione:

```env
DB_HOST=seu-host-postgresql.com
DB_NAME=nome_do_banco
DB_USER=usuario
DB_PASS=senha
DB_PORT=5432
```

### Variáveis Opcionais

```env
DOMAIN=seu-app.railway.app
```

## 🎯 Após configurar

1. Salve as variáveis
2. O Railway fará redeploy automático
3. Verifique os logs para confirmar que está tudo OK
4. Acesse sua aplicação pela URL fornecida

## 📋 Ordem de Configuração

1. ✅ Primeiro: Criar projeto no Railway
2. ✅ Segundo: Adicionar PostgreSQL
3. ✅ Terceiro: Adicionar variáveis de ambiente acima
4. ✅ Quarto: Aguardar deploy finalizar
5. ✅ Quinto: Criar usuário admin

## 🔍 Verificar Configuração

No Railway, vá em:

- **Variables** → Verificar se todas estão presentes
- **Deployments** → Ver logs do último deploy
- **Settings** → Ver URL pública da aplicação

---

**Dica**: Mantenha um backup seguro dessas variáveis em um gerenciador de senhas.
