# Deploy no Railway - Guia Completo

Este guia explica como fazer deploy da Intranet DigitalRF no Railway.

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app/)
2. Repositório Git com o código (GitHub, GitLab ou Bitbucket)
3. Conhecimento básico de variáveis de ambiente

## 🚀 Passo a Passo

### 1. Preparar o Projeto

Os arquivos necessários já foram criados:

- ✅ `Procfile` - Define o comando de inicialização
- ✅ `railway.toml` - Configuração do Railway
- ✅ `.env.example` - Template de variáveis de ambiente
- ✅ Ajustes em `config/database.js` para SSL
- ✅ Ajustes em `api/config.php` para variáveis de ambiente

### 2. Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app/)
2. Faça login com sua conta
3. Clique em **"New Project"**
4. Escolha **"Deploy from GitHub repo"**
5. Selecione o repositório da intranet
6. O Railway detectará automaticamente que é um projeto Node.js

### 3. Adicionar Banco de Dados PostgreSQL

1. No dashboard do projeto, clique em **"New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. O Railway criará automaticamente um banco PostgreSQL
4. A variável `DATABASE_URL` será criada automaticamente

### 4. Configurar Variáveis de Ambiente

No painel do seu serviço web, vá em **"Variables"** e adicione:

#### Variáveis Obrigatórias:

```env
NODE_ENV=production
SESSION_SECRET=seu-secret-aleatorio-muito-seguro-aqui
USE_HTTPS=false
```

#### Se NÃO estiver usando DATABASE_URL automática:

```env
DB_HOST=seu-host.railway.internal
DB_NAME=railway
DB_USER=postgres
DB_PASS=sua-senha-do-railway
DB_PORT=5432
```

> **Importante**: Se o Railway criou o PostgreSQL automaticamente, a variável `DATABASE_URL` já estará configurada e você NÃO precisa adicionar as variáveis DB\_\* individuais.

### 5. Configurar Variáveis PHP (se necessário)

O Railway pode precisar das mesmas variáveis de ambiente para o PHP. Adicione também:

```env
DB_HOST=seu-host.railway.internal
DB_NAME=railway
DB_USER=postgres
DB_PASS=sua-senha-do-railway
```

### 6. Deploy

1. Após configurar as variáveis, o Railway fará deploy automaticamente
2. Aguarde o build terminar (pode levar alguns minutos)
3. Quando finalizar, você verá uma URL pública como: `https://seu-app.up.railway.app`

### 7. Criar Usuário Administrador

Após o primeiro deploy, você precisa criar um usuário admin:

1. No Railway, vá em **"PostgreSQL"** → **"Data"** → **"Query"**
2. Execute o script SQL para criar o admin (ou use o script `scripts/criar_admin.js` localmente apontando para o banco do Railway)

Ou via terminal Railway:

```bash
# Conecte ao seu serviço
railway run node scripts/criar_admin.js
```

## 🔒 Segurança

### Gerar SESSION_SECRET seguro:

No seu terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use o resultado como valor de `SESSION_SECRET`.

## 📁 Estrutura de Pastas no Railway

O Railway manterá a mesma estrutura:

```
/app
├── api/
├── config/
├── public/
├── routes/
├── scripts/
├── sql/
├── server.js
└── package.json
```

## ⚙️ Configurações Avançadas

### Domain Customizado

1. No Railway, vá em **"Settings"** → **"Domains"**
2. Clique em **"Custom Domain"**
3. Adicione seu domínio e configure o DNS conforme instruções

### Logs

Para ver logs em tempo real:

```bash
railway logs
```

Ou diretamente no dashboard do Railway em **"Deployments"** → **"View Logs"**

### Reiniciar Serviço

```bash
railway restart
```

Ou no dashboard: **"Settings"** → **"Restart"**

## 🐛 Troubleshooting

### Erro de Conexão com Banco de Dados

1. Verifique se o PostgreSQL foi adicionado ao projeto
2. Confirme se `DATABASE_URL` está presente nas variáveis
3. Verifique se `NODE_ENV=production` está configurado

### Erro 503 Service Unavailable

1. Verifique os logs: `railway logs`
2. Confirme se a porta `PORT` está sendo lida corretamente do ambiente
3. O Railway injeta automaticamente a variável `PORT`

### PHP não funciona

1. Verifique se o `railway.toml` inclui PHP nos providers
2. Confirme se as variáveis de ambiente DB\_\* estão configuradas
3. Verifique se o caminho para os arquivos PHP está correto

### Sessões não persistem

1. Verifique se `SESSION_SECRET` está configurado
2. Confirme se `express-session` está nas dependências
3. Para múltiplas instâncias, considere usar Redis para sessões

## 📊 Monitoramento

O Railway fornece:

- **Métricas de CPU e Memória**
- **Logs em tempo real**
- **Histórico de deploys**
- **Alertas de erro**

Acesse em: **Project** → **Metrics**

## 💰 Custos

- Railway oferece **$5 USD de crédito grátis** por mês
- Além disso, cobra pelo uso de recursos
- Monitore seu uso em: **Project** → **Usage**

## 🔄 CI/CD Automático

Após configuração inicial, cada push no branch principal:

1. Dispara build automático
2. Executa testes (se configurados)
3. Faz deploy automático se bem-sucedido

Para desabilitar deploy automático:
**Settings** → **Disable Automatic Deployments**

## 📞 Suporte

- [Documentação Railway](https://docs.railway.app/)
- [Discord Railway](https://discord.gg/railway)
- [Status Railway](https://status.railway.app/)

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Variáveis de ambiente configuradas
- [ ] `SESSION_SECRET` forte e único
- [ ] Banco de dados criado e conectado
- [ ] Usuário admin criado
- [ ] Testes de login funcionando
- [ ] SSL/HTTPS funcionando (automático no Railway)
- [ ] Logs sem erros críticos
- [ ] Backup do banco configurado
- [ ] Domínio customizado (opcional)

## 🎯 Próximos Passos

1. Configure backups regulares do PostgreSQL
2. Adicione monitoramento de uptime
3. Configure alertas de erro
4. Implemente rate limiting na API
5. Configure CDN para assets estáticos (opcional)

---

**Última atualização**: Fevereiro 2026
