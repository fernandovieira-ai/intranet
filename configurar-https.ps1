# Script de Configuração HTTPS - Intranet DigitalRF
# Execute como Administrador

Write-Host "🔒 Configurador de HTTPS - Intranet DigitalRF" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

$projectPath = "C:\Linx\cliente\digitalrf\projeto\intranet"
$sslPath = Join-Path $projectPath "ssl"
$envPath = Join-Path $projectPath ".env"

# Verificar se está executando como admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  AVISO: Execute este script como Administrador para abrir portas 80 e 443" -ForegroundColor Yellow
    Write-Host ""
}

# Menu de opções
Write-Host "Escolha uma opção:" -ForegroundColor Green
Write-Host "1. Gerar certificado auto-assinado (DESENVOLVIMENTO)"
Write-Host "2. Configurar certificado existente (PRODUÇÃO)"
Write-Host "3. Abrir portas no Firewall (80 e 443)"
Write-Host "4. Testar configuração atual"
Write-Host "5. Habilitar HTTPS no .env"
Write-Host "6. Desabilitar HTTPS no .env"
Write-Host "0. Sair"
Write-Host ""

$opcao = Read-Host "Digite o número da opção"

switch ($opcao) {
    "1" {
        Write-Host "`n📝 Gerando certificado auto-assinado..." -ForegroundColor Cyan
        
        # Verificar se OpenSSL está instalado
        $openssl = Get-Command openssl -ErrorAction SilentlyContinue
        if (-not $openssl) {
            Write-Host "❌ OpenSSL não encontrado. Instalando via Chocolatey..." -ForegroundColor Red
            
            # Verificar Chocolatey
            $choco = Get-Command choco -ErrorAction SilentlyContinue
            if (-not $choco) {
                Write-Host "Instalando Chocolatey..." -ForegroundColor Yellow
                Set-ExecutionPolicy Bypass -Scope Process -Force
                [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
                Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            }
            
            choco install openssl -y
            refreshenv
        }
        
        # Gerar certificado
        $domain = "intranet.digitalrf.com.br"
        $keyPath = Join-Path $sslPath "private.key"
        $certPath = Join-Path $sslPath "certificate.crt"
        
        openssl req -x509 -newkey rsa:4096 -keyout $keyPath -out $certPath -days 365 -nodes -subj "/CN=$domain/O=DigitalRF/C=BR"
        
        if (Test-Path $keyPath) {
            Write-Host "✅ Certificado gerado com sucesso!" -ForegroundColor Green
            Write-Host "   Chave: $keyPath" -ForegroundColor Gray
            Write-Host "   Certificado: $certPath" -ForegroundColor Gray
            Write-Host "`n⚠️  ATENÇÃO: Este é um certificado AUTO-ASSINADO" -ForegroundColor Yellow
            Write-Host "   Navegadores mostrarão aviso de segurança." -ForegroundColor Yellow
            Write-Host "   Use apenas para desenvolvimento/testes." -ForegroundColor Yellow
        } else {
            Write-Host "❌ Erro ao gerar certificado" -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host "`n📂 Configurar certificado existente..." -ForegroundColor Cyan
        Write-Host ""
        
        $keySource = Read-Host "Caminho completo da chave privada (.key)"
        $certSource = Read-Host "Caminho completo do certificado (.crt ou .pem)"
        $caSource = Read-Host "Caminho do CA bundle (deixe vazio se não tiver)"
        
        if (Test-Path $keySource) {
            Copy-Item $keySource -Destination (Join-Path $sslPath "private.key") -Force
            Write-Host "✅ Chave privada copiada" -ForegroundColor Green
        } else {
            Write-Host "❌ Arquivo de chave não encontrado: $keySource" -ForegroundColor Red
            break
        }
        
        if (Test-Path $certSource) {
            Copy-Item $certSource -Destination (Join-Path $sslPath "certificate.crt") -Force
            Write-Host "✅ Certificado copiado" -ForegroundColor Green
        } else {
            Write-Host "❌ Arquivo de certificado não encontrado: $certSource" -ForegroundColor Red
            break
        }
        
        if ($caSource -and (Test-Path $caSource)) {
            Copy-Item $caSource -Destination (Join-Path $sslPath "ca-bundle.crt") -Force
            Write-Host "✅ CA Bundle copiado" -ForegroundColor Green
        }
        
        Write-Host "`n✅ Certificados configurados com sucesso!" -ForegroundColor Green
    }
    
    "3" {
        if (-not $isAdmin) {
            Write-Host "`n❌ Execute como Administrador para configurar Firewall" -ForegroundColor Red
            break
        }
        
        Write-Host "`n🔥 Configurando Firewall..." -ForegroundColor Cyan
        
        # Porta 443 (HTTPS)
        $rule443 = Get-NetFirewallRule -DisplayName "Intranet HTTPS" -ErrorAction SilentlyContinue
        if ($rule443) {
            Write-Host "   Porta 443 já configurada" -ForegroundColor Yellow
        } else {
            New-NetFirewallRule -DisplayName "Intranet HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow | Out-Null
            Write-Host "✅ Porta 443 (HTTPS) aberta" -ForegroundColor Green
        }
        
        # Porta 80 (HTTP)
        $rule80 = Get-NetFirewallRule -DisplayName "Intranet HTTP" -ErrorAction SilentlyContinue
        if ($rule80) {
            Write-Host "   Porta 80 já configurada" -ForegroundColor Yellow
        } else {
            New-NetFirewallRule -DisplayName "Intranet HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow | Out-Null
            Write-Host "✅ Porta 80 (HTTP) aberta" -ForegroundColor Green
        }
        
        Write-Host "`n✅ Firewall configurado!" -ForegroundColor Green
    }
    
    "4" {
        Write-Host "`n🧪 Testando configuração..." -ForegroundColor Cyan
        Write-Host ""
        
        # Verificar arquivos de certificado
        $keyExists = Test-Path (Join-Path $sslPath "private.key")
        $certExists = Test-Path (Join-Path $sslPath "certificate.crt")
        
        Write-Host "Certificados:" -ForegroundColor Yellow
        Write-Host "  Chave privada: $(if($keyExists){'✅ OK'}else{'❌ NÃO ENCONTRADA'})"
        Write-Host "  Certificado: $(if($certExists){'✅ OK'}else{'❌ NÃO ENCONTRADO'})"
        
        # Verificar .env
        if (Test-Path $envPath) {
            $envContent = Get-Content $envPath -Raw
            $httpsEnabled = $envContent -match "USE_HTTPS=true"
            Write-Host "`n.env:" -ForegroundColor Yellow
            Write-Host "  USE_HTTPS: $(if($httpsEnabled){'✅ true'}else{'❌ false'})"
        }
        
        # Verificar portas
        Write-Host "`nPortas:" -ForegroundColor Yellow
        $port443 = netstat -ano | Select-String ":443"
        $port80 = netstat -ano | Select-String ":80"
        Write-Host "  Porta 443: $(if($port443){'⚠️ EM USO'}else{'✅ LIVRE'})"
        Write-Host "  Porta 80: $(if($port80){'⚠️ EM USO'}else{'✅ LIVRE'})"
        
        # Verificar Node
        $nodeProcess = Get-Process -Name node -ErrorAction SilentlyContinue
        Write-Host "`nNode.js:" -ForegroundColor Yellow
        Write-Host "  Processo: $(if($nodeProcess){'✅ RODANDO'}else{'❌ PARADO'})"
        
        if ($keyExists -and $certExists) {
            Write-Host "`n✅ Tudo pronto para HTTPS!" -ForegroundColor Green
        } else {
            Write-Host "`n⚠️  Configure os certificados primeiro (opção 1 ou 2)" -ForegroundColor Yellow
        }
    }
    
    "5" {
        Write-Host "`n⚙️  Habilitando HTTPS no .env..." -ForegroundColor Cyan
        
        if (Test-Path $envPath) {
            $content = Get-Content $envPath -Raw
            $content = $content -replace "USE_HTTPS=false", "USE_HTTPS=true"
            $content = $content -replace "REDIRECT_HTTP=false", "REDIRECT_HTTP=true"
            Set-Content -Path $envPath -Value $content -NoNewline
            
            Write-Host "✅ HTTPS habilitado!" -ForegroundColor Green
            Write-Host "   USE_HTTPS=true" -ForegroundColor Gray
            Write-Host "   REDIRECT_HTTP=true" -ForegroundColor Gray
            Write-Host "`n💡 Reinicie o servidor: npm start" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Arquivo .env não encontrado" -ForegroundColor Red
        }
    }
    
    "6" {
        Write-Host "`n⚙️  Desabilitando HTTPS no .env..." -ForegroundColor Cyan
        
        if (Test-Path $envPath) {
            $content = Get-Content $envPath -Raw
            $content = $content -replace "USE_HTTPS=true", "USE_HTTPS=false"
            $content = $content -replace "REDIRECT_HTTP=true", "REDIRECT_HTTP=false"
            Set-Content -Path $envPath -Value $content -NoNewline
            
            Write-Host "✅ HTTPS desabilitado!" -ForegroundColor Green
            Write-Host "   USE_HTTPS=false" -ForegroundColor Gray
            Write-Host "   REDIRECT_HTTP=false" -ForegroundColor Gray
            Write-Host "`n💡 Reinicie o servidor: npm start" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Arquivo .env não encontrado" -ForegroundColor Red
        }
    }
    
    "0" {
        Write-Host "`n👋 Até logo!" -ForegroundColor Cyan
    }
    
    default {
        Write-Host "`n❌ Opção inválida" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=" * 60
Write-Host "Para mais informações, consulte: ssl/README.md" -ForegroundColor Gray
Write-Host ""
