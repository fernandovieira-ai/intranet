# Configuração de Certificados SSL/HTTPS

## 📋 Requisitos

Para habilitar HTTPS, você precisa de:

1. **Certificado SSL** (arquivo `.crt` ou `.pem`)
2. **Chave Privada** (arquivo `.key`)
3. **Certificado CA** (arquivo `.ca-bundle`, opcional)

---

## 🔧 Opções de Obtenção de Certificados

### Opção 1: Let's Encrypt (GRATUITO - Recomendado)

#### Windows com win-acme:

```powershell
# Baixar win-acme
Invoke-WebRequest -Uri "https://github.com/win-acme/win-acme/releases/latest/download/win-acme.v2.2.9.1701.x64.pluggable.zip" -OutFile "win-acme.zip"
Expand-Archive -Path "win-acme.zip" -DestinationPath "C:\win-acme"

# Executar como Administrador
cd C:\win-acme
.\wacs.exe

# Seguir o assistente:
# 1. Escolher "N: Create certificate (full options)"
# 2. Manual input
# 3. Digite: intranet.digitalrf.com.br
# 4. Escolher validação HTTP
# 5. Escolher armazenamento PEM
```

Após gerar, copie os arquivos:

```powershell
# Os arquivos estarão em C:\ProgramData\win-acme\certificates\
copy "C:\ProgramData\win-acme\certificates\intranet.digitalrf.com.br\*-key.pem" "C:\projeto\intranet\ssl\private.key"
copy "C:\ProgramData\win-acme\certificates\intranet.digitalrf.com.br\*-crt.pem" "C:\projeto\intranet\ssl\certificate.crt"
```

### Opção 2: Certbot (Alternativa)

```powershell
# Instalar Certbot
winget install Certbot.Certbot

# Gerar certificado
certbot certonly --standalone -d intranet.digitalrf.com.br

# Copiar arquivos
copy "C:\Certbot\live\intranet.digitalrf.com.br\privkey.pem" "C:\projeto\intranet\ssl\private.key"
copy "C:\Certbot\live\intranet.digitalrf.com.br\fullchain.pem" "C:\projeto\intranet\ssl\certificate.crt"
```

### Opção 3: Certificado Pago (Comércio Eletrônico)

Compre de provedores como:

- DigiCert
- GoDaddy
- Sectigo

Após compra, você receberá os arquivos. Renomeie e coloque nesta pasta:

- Chave privada → `private.key`
- Certificado → `certificate.crt`
- CA Bundle → `ca-bundle.crt` (se fornecido)

### Opção 4: Certificado Auto-Assinado (APENAS DESENVOLVIMENTO)

⚠️ **NÃO USE EM PRODUÇÃO** - Navegadores mostrarão aviso de segurança

```powershell
# Gerar certificado auto-assinado (validade 365 dias)
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.crt -days 365 -nodes -subj "/CN=intranet.digitalrf.com.br"

# Mover para pasta ssl
move private.key C:\projeto\intranet\ssl\
move certificate.crt C:\projeto\intranet\ssl\
```

---

## ⚙️ Configuração no Projeto

### 1. Coloque os certificados nesta pasta (`ssl/`)

```
ssl/
├── private.key       (Chave privada)
├── certificate.crt   (Certificado)
└── ca-bundle.crt     (Opcional - Certificado CA)
```

### 2. Configure o arquivo `.env`

```env
# Habilitar HTTPS
USE_HTTPS=true

# Porta HTTPS (443 é padrão)
HTTPS_PORT=443

# Redirecionar HTTP para HTTPS automaticamente
REDIRECT_HTTP=true

# Domínio
DOMAIN=intranet.digitalrf.com.br

# Se os certificados estiverem em outro local, especifique:
SSL_KEY_PATH=C:\caminho\para\private.key
SSL_CERT_PATH=C:\caminho\para\certificate.crt
SSL_CA_PATH=C:\caminho\para\ca-bundle.crt
```

### 3. Abra as portas no Firewall

```powershell
# Porta 443 (HTTPS)
New-NetFirewallRule -DisplayName "Node HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Porta 80 (HTTP - para redirecionamento)
New-NetFirewallRule -DisplayName "Node HTTP Redirect" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

### 4. Execute como Administrador

```powershell
# Porta 443 requer privilégios de administrador
npm start
```

---

## 🧪 Testar Configuração

### Verificar certificados:

```powershell
# Ver detalhes do certificado
openssl x509 -in certificate.crt -text -noout

# Verificar se chave e certificado combinam
openssl rsa -modulus -noout -in private.key | openssl md5
openssl x509 -modulus -noout -in certificate.crt | openssl md5
# Os valores MD5 devem ser idênticos
```

### Testar localmente:

```powershell
# Testar HTTPS
curl -k https://localhost:443

# Testar redirecionamento HTTP → HTTPS
curl http://localhost:80
```

### Testar remotamente:

```
https://intranet.digitalrf.com.br
```

---

## 🔄 Renovação Automática (Let's Encrypt)

Certificados Let's Encrypt expiram em 90 dias.

### win-acme (Windows):

```powershell
# win-acme configura renovação automática via Task Scheduler
# Verificar tarefa agendada:
Get-ScheduledTask | Where-Object {$_.TaskName -like "*win-acme*"}

# Renovar manualmente:
cd C:\win-acme
.\wacs.exe --renew --baseuri https://acme-v02.api.letsencrypt.org/
```

### Certbot:

```powershell
# Renovar manualmente
certbot renew

# Agendar renovação (Task Scheduler)
# Criar tarefa que executa: certbot renew --quiet
```

---

## ⚠️ Troubleshooting

### Erro: "address already in use"

```powershell
# Verificar processo usando porta 443
netstat -ano | findstr :443

# Matar processo (substitua PID)
taskkill /PID <numero_pid> /F
```

### Erro: "Error loading SSL certificates"

- Verifique se os arquivos existem na pasta `ssl/`
- Verifique permissões dos arquivos
- Confirme que os caminhos no `.env` estão corretos

### Erro: "EACCES: permission denied"

- Execute `npm start` como **Administrador**
- Portas 80 e 443 requerem privilégios elevados no Windows

### Navegador mostra "Conexão não segura"

- Certificado auto-assinado (normal em desenvolvimento)
- Certificado expirado (renovar)
- Nome do domínio não corresponde ao certificado

---

## 📚 Estrutura de Arquivos Esperada

```
intranet/
├── ssl/
│   ├── private.key        ← Sua chave privada
│   ├── certificate.crt    ← Seu certificado
│   └── ca-bundle.crt      ← Certificado CA (opcional)
├── .env                   ← Configurações (USE_HTTPS=true)
├── server.js              ← Servidor configurado
└── package.json
```

---

## 🔐 Segurança

✅ **Boas Práticas:**

- Nunca commitar certificados no Git (já está no `.gitignore`)
- Manter chave privada segura (permissões restritas)
- Usar certificados válidos em produção
- Renovar antes da expiração
- Manter NODE_ENV=production em produção

❌ **Não fazer:**

- Usar certificados auto-assinados em produção
- Compartilhar chave privada
- Deixar SSL_KEY_PATH vazio com certificados sensíveis

---

## 🆘 Suporte

Em caso de problemas:

1. Verificar logs do servidor
2. Testar certificados com openssl
3. Confirmar DNS aponta para o servidor
4. Verificar firewall (portas 80 e 443)
5. Executar como Administrador

Para mais informações:

- Let's Encrypt: https://letsencrypt.org/
- win-acme: https://www.win-acme.com/
- OpenSSL: https://www.openssl.org/
