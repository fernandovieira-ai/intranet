# Configuração do Servidor para HTTPS

## Situação Atual

- Aplicação rodando em: http://131.100.231.199:3004
- Domínio desejado: https://intranet.digitalrf.com.br

## Passos para Configurar no Servidor (Windows)

### 1. Instalar IIS (se ainda não estiver instalado)

```powershell
# Executar como Administrador
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

### 2. Instalar URL Rewrite e ARR

- Baixar e instalar: [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
- Baixar e instalar: [Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing)

### 3. Habilitar Proxy no ARR

1. Abrir IIS Manager
2. Clicar no servidor (nível raiz)
3. Abrir "Application Request Routing Cache"
4. Clicar em "Server Proxy Settings" (painel direito)
5. Marcar "Enable proxy"
6. Clicar em "Apply"

### 4. Criar Site no IIS

1. No IIS Manager, clicar com botão direito em "Sites"
2. Selecionar "Add Website"
3. Configurar:
   - **Site name**: Intranet DigitalRF
   - **Physical path**: C:\inetpub\wwwroot\intranet (criar pasta vazia)
   - **Binding Type**: https
   - **Port**: 443
   - **Host name**: intranet.digitalrf.com.br
   - **SSL certificate**: Selecionar o certificado instalado

### 5. Configurar URL Rewrite

1. Selecionar o site criado
2. Abrir "URL Rewrite"
3. Clicar em "Add Rule(s)..."
4. Selecionar "Reverse Proxy"
5. Configurar:
   - **Inbound Rules**: intranet.digitalrf.com.br
   - **Rewrite URL**: localhost:3004
6. Adicionar regra para HTTP -> HTTPS:
   - "Add Rule" > "Blank Rule"
   - Pattern: (.\*)
   - Conditions: {HTTPS} equals off
   - Action: Redirect to https://{HTTP_HOST}/{R:1}

### 6. Configurar web.config no site

Criar arquivo `C:\inetpub\wwwroot\intranet\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- Redirecionar HTTP para HTTPS -->
                <rule name="HTTP to HTTPS" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions>
                        <add input="{HTTPS}" pattern="off" />
                    </conditions>
                    <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
                </rule>

                <!-- Proxy reverso para Node.js -->
                <rule name="NodeJS" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3004/{R:1}" />
                </rule>
            </rules>
        </rewrite>

        <!-- Aumentar limite de upload -->
        <security>
            <requestFiltering>
                <requestLimits maxAllowedContentLength="10485760" />
            </requestFiltering>
        </security>
    </system.webServer>
</configuration>
```

### 7. Configurar Firewall

```powershell
# Permitir tráfego na porta 443 (HTTPS)
New-NetFirewallRule -DisplayName "HTTPS Intranet" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Permitir tráfego na porta 80 (HTTP - para redirect)
New-NetFirewallRule -DisplayName "HTTP Intranet" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

### 8. Certificado SSL

Você precisa de um certificado SSL válido para o domínio. Opções:

**Opção A - Let's Encrypt (Gratuito):**

1. Instalar [win-acme](https://www.win-acme.com/)
2. Executar e seguir wizard para gerar certificado
3. Ele instala automaticamente no IIS

**Opção B - Certificado Comercial:**

1. Comprar certificado SSL
2. Instalar no Windows Certificate Store
3. Vincular ao site no IIS

### 9. Ajustar Session Cookie (Código Node.js)

No arquivo `.env` do servidor, definir:

```
PORT=3004
NODE_ENV=production
```

No `server.js`, a configuração de sessão já deve estar com `secure: false` pois o HTTPS é terminado no IIS.

### 10. Reiniciar Serviços

```powershell
# Reiniciar IIS
iisreset

# Reiniciar aplicação Node.js
# (pelo método que você está usando - PM2, NSSM, etc)
```

### 11. Testar

1. Acessar: http://intranet.digitalrf.com.br (deve redirecionar para HTTPS)
2. Acessar: https://intranet.digitalrf.com.br (deve funcionar)

## Verificações de Problemas

### DNS não resolve

```powershell
nslookup intranet.digitalrf.com.br
# Deve retornar 131.100.231.199
```

### Porta não está aberta

```powershell
Test-NetConnection -ComputerName 131.100.231.199 -Port 443
```

### IIS não está rodando

```powershell
Get-Service -Name W3SVC
Start-Service W3SVC
```

### Node.js não está rodando

```powershell
Get-Process -Name node
# Se não aparecer, iniciar a aplicação
```

## Alternativa Simples (Sem HTTPS)

Se quiser testar sem HTTPS primeiro:

1. Configurar DNS para apontar para: http://intranet.digitalrf.com.br:3004
2. Ou usar IIS apenas na porta 80 (HTTP)
3. No IIS, binding: http, porta 80, host: intranet.digitalrf.com.br
4. Proxy para: localhost:3004

## Suporte

Se precisar de ajuda com algum passo específico, me avise!
