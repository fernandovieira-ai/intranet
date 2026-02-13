# 🆓 Certificado SSL GRATUITO com Let's Encrypt

## ✅ CERTIFICADO GRATUITO - 100% Funcional

Let's Encrypt fornece certificados SSL **totalmente gratuitos** que:

- ✅ São aceitos por **TODOS** os navegadores (Chrome, Firefox, Edge, Safari)
- ✅ Têm a **mesma segurança** que certificados pagos
- ✅ Renovação **automática** a cada 90 dias
- ✅ Usado por **milhões** de sites no mundo todo
- ✅ **ZERO CUSTO** - sempre gratuito

---

## 🚀 Instalação Rápida (5 minutos)

### Passo 1: Baixar win-acme

```powershell
# Execute no PowerShell como Administrador
cd C:\
Invoke-WebRequest -Uri "https://github.com/win-acme/win-acme/releases/download/v2.2.9/win-acme.v2.2.9.1701.x64.pluggable.zip" -OutFile "win-acme.zip"
Expand-Archive -Path "win-acme.zip" -DestinationPath "C:\win-acme"
```

### Passo 2: Gerar Certificado GRATUITO

```powershell
cd C:\win-acme
.\wacs.exe
```

**Siga o assistente:**

1. Digite: **N** (Create certificate - full options)
2. Digite: **2** (Manual input)
3. Digite o domínio: **intranet.digitalrf.com.br**
4. Escolha validação: **1** (HTTP validation)
5. Escolha instalação: **5** (No (additional) installation steps)
6. Escolha armazenamento: **2** (PEM encoded files)
7. Digite o caminho: **C:\Linx\cliente\digitalrf\projeto\intranet\ssl**
8. Confirme a renovação automática: **yes**

**Pronto!** Certificado gratuito gerado! 🎉

### Passo 3: Configurar no App

```powershell
# Edite o arquivo .env
notepad C:\Linx\cliente\digitalrf\projeto\intranet\.env
```

Configure:

```env
USE_HTTPS=true
HTTPS_PORT=443
REDIRECT_HTTP=true
DOMAIN=intranet.digitalrf.com.br
```

### Passo 4: Abrir Portas

```powershell
# Execute como Administrador
New-NetFirewallRule -DisplayName "Intranet HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Intranet HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

### Passo 5: Iniciar Servidor

```powershell
cd C:\Linx\cliente\digitalrf\projeto\intranet
npm start
```

Acesse: **https://intranet.digitalrf.com.br** ✅

---

## 🔄 Renovação Automática

O win-acme cria uma tarefa agendada no Windows que renova automaticamente o certificado a cada 60 dias (antes de expirar em 90 dias).

**Verificar tarefa:**

```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "*win-acme*"}
```

**Renovar manualmente (se necessário):**

```powershell
cd C:\win-acme
.\wacs.exe --renew --baseuri https://acme-v02.api.letsencrypt.org/
```

---

## ⚠️ Requisitos para Funcionar

Para o Let's Encrypt validar seu domínio, você precisa:

✅ **Domínio apontando para o servidor:**

- DNS: intranet.digitalrf.com.br → 131.100.231.199

✅ **Porta 80 acessível da internet:**

- Let's Encrypt precisa acessar http://intranet.digitalrf.com.br/.well-known/acme-challenge/
- Durante a geração do certificado, mantenha porta 80 aberta

---

## 🆚 Certificado Gratuito vs Pago

| Recurso                    | Let's Encrypt (Grátis) | Pago                     |
| -------------------------- | ---------------------- | ------------------------ |
| **Custo**                  | 🆓 R$ 0,00             | 💰 R$ 50-500/ano         |
| **Segurança**              | ✅ Mesma               | ✅ Mesma                 |
| **Cadeado Verde**          | ✅ Sim                 | ✅ Sim                   |
| **Aceito por navegadores** | ✅ Todos               | ✅ Todos                 |
| **Validade**               | 90 dias (auto-renova)  | 1-2 anos                 |
| **Suporte**                | Comunidade             | Pago                     |
| **Garantia financeira**    | ❌ Não                 | ✅ Sim (para e-commerce) |

**Conclusão:** Para intranet/sites normais, Let's Encrypt é **perfeito e gratuito**!

---

## 💡 Alternativa: Certbot

Se preferir outra ferramenta gratuita:

```powershell
# Instalar Certbot
winget install Certbot.Certbot

# Gerar certificado
certbot certonly --standalone -d intranet.digitalrf.com.br

# Copiar certificados
copy "C:\Certbot\live\intranet.digitalrf.com.br\privkey.pem" "C:\Linx\cliente\digitalrf\projeto\intranet\ssl\private.key"
copy "C:\Certbot\live\intranet.digitalrf.com.br\fullchain.pem" "C:\Linx\cliente\digitalrf\projeto\intranet\ssl\certificate.crt"
```

---

## 🆘 Problemas Comuns

### "Domínio não pode ser validado"

- Verifique se DNS aponta para seu servidor
- Confirme que porta 80 está acessível externamente
- Teste: http://intranet.digitalrf.com.br

### "Porta 80 em uso"

```powershell
# Ver o que está usando porta 80
netstat -ano | findstr :80

# Parar IIS temporariamente (se instalado)
Stop-Service W3SVC

# Gerar certificado
cd C:\win-acme
.\wacs.exe

# Reiniciar IIS (se necessário)
Start-Service W3SVC
```

### "Certificado não renova automaticamente"

- Verifique tarefa agendada do Windows
- Execute renovação manual: `.\wacs.exe --renew`
- Reinicie o app Node.js após renovação

---

## 🎯 Resumo

1. **Baixar win-acme** (2 minutos)
2. **Gerar certificado** com Let's Encrypt (3 minutos)
3. **Configurar .env** (USE_HTTPS=true)
4. **Iniciar app** (npm start como Admin)

**Total:** 5 minutos + **R$ 0,00** = HTTPS funcionando! 🎉

---

## 📞 Ajuda

- Let's Encrypt: https://letsencrypt.org/
- win-acme: https://www.win-acme.com/
- Certbot: https://certbot.eff.org/

**Certificado SSL não precisa custar nada!** 🆓✨
