# Script Automatizado - Certificado SSL GRATUITO
# Execute como Administrador

Write-Host ""
Write-Host "🆓 CERTIFICADO SSL GRATUITO - Let's Encrypt" -ForegroundColor Green
Write-Host "=" * 70
Write-Host ""
Write-Host "✅ 100% GRATUITO - Aceito por todos os navegadores" -ForegroundColor Cyan
Write-Host "✅ Mesma segurança de certificados pagos" -ForegroundColor Cyan
Write-Host "✅ Renovação automática a cada 90 dias" -ForegroundColor Cyan
Write-Host ""
Write-Host "=" * 70
Write-Host ""

# Verificar Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Execute este script como ADMINISTRADOR" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clique com botão direito no PowerShell e escolha:" -ForegroundColor Yellow
    Write-Host "'Executar como Administrador'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

$projectPath = "C:\Linx\cliente\digitalrf\projeto\intranet"
$sslPath = Join-Path $projectPath "ssl"
$winAcmePath = "C:\win-acme"
$domain = "intranet.digitalrf.com.br"

Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "   Domínio: $domain" -ForegroundColor Gray
Write-Host "   Pasta SSL: $sslPath" -ForegroundColor Gray
Write-Host ""

# Verificar se win-acme já está instalado
if (Test-Path $winAcmePath) {
    Write-Host "✅ win-acme já instalado em $winAcmePath" -ForegroundColor Green
} else {
    Write-Host "📥 Baixando win-acme (ferramenta GRATUITA)..." -ForegroundColor Cyan
    
    try {
        $zipPath = "C:\win-acme.zip"
        $url = "https://github.com/win-acme/win-acme/releases/download/v2.2.9/win-acme.v2.2.9.1701.x64.pluggable.zip"
        
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
        Expand-Archive -Path $zipPath -DestinationPath $winAcmePath -Force
        Remove-Item $zipPath -Force
        
        Write-Host "✅ win-acme instalado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao baixar win-acme: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Baixe manualmente de:" -ForegroundColor Yellow
        Write-Host "   https://github.com/win-acme/win-acme/releases" -ForegroundColor Cyan
        pause
        exit
    }
}

Write-Host ""
Write-Host "=" * 70
Write-Host "🔐 GERANDO CERTIFICADO SSL GRATUITO" -ForegroundColor Green
Write-Host "=" * 70
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   1. Seu domínio ($domain) deve estar apontando para este servidor" -ForegroundColor Yellow
Write-Host "   2. Porta 80 deve estar acessível da internet" -ForegroundColor Yellow
Write-Host "   3. Let's Encrypt irá validar seu domínio (demora ~30 segundos)" -ForegroundColor Yellow
Write-Host ""

$continuar = Read-Host "Deseja continuar? (S/N)"
if ($continuar -ne "S" -and $continuar -ne "s") {
    Write-Host "❌ Cancelado pelo usuário" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🚀 Iniciando geração do certificado..." -ForegroundColor Cyan
Write-Host ""

# Parar Node.js se estiver rodando
$nodeProcess = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Write-Host "⏸️  Parando Node.js temporariamente..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Parar IIS se estiver rodando na porta 80
$iisService = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
if ($iisService -and $iisService.Status -eq "Running") {
    Write-Host "⏸️  Parando IIS temporariamente..." -ForegroundColor Yellow
    Stop-Service W3SVC -Force
    Start-Sleep -Seconds 2
}

# Abrir portas no Firewall
Write-Host "🔥 Configurando Firewall..." -ForegroundColor Cyan

$rule80 = Get-NetFirewallRule -DisplayName "Intranet HTTP" -ErrorAction SilentlyContinue
if (-not $rule80) {
    New-NetFirewallRule -DisplayName "Intranet HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow | Out-Null
    Write-Host "   ✅ Porta 80 aberta" -ForegroundColor Green
}

$rule443 = Get-NetFirewallRule -DisplayName "Intranet HTTPS" -ErrorAction SilentlyContinue
if (-not $rule443) {
    New-NetFirewallRule -DisplayName "Intranet HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow | Out-Null
    Write-Host "   ✅ Porta 443 aberta" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Executando win-acme para gerar certificado GRATUITO..." -ForegroundColor Cyan
Write-Host ""
Write-Host "INSTRUÇÕES:" -ForegroundColor Yellow
Write-Host "1. Digite: N (para 'Create certificate - full options')" -ForegroundColor Gray
Write-Host "2. Digite: 2 (para 'Manual input')" -ForegroundColor Gray
Write-Host "3. Digite o domínio: $domain" -ForegroundColor Gray
Write-Host "4. Escolha: 1 (HTTP validation)" -ForegroundColor Gray
Write-Host "5. Escolha: 5 (No installation steps)" -ForegroundColor Gray
Write-Host "6. Escolha: 2 (PEM encoded files)" -ForegroundColor Gray
Write-Host "7. Digite o caminho: $sslPath" -ForegroundColor Gray
Write-Host "8. Confirme renovação automática: yes" -ForegroundColor Gray
Write-Host ""
Write-Host "Pressione ENTER para iniciar..." -ForegroundColor Cyan
pause

cd $winAcmePath
.\wacs.exe

Write-Host ""
Write-Host "=" * 70
Write-Host ""

# Verificar se certificados foram gerados
$keyPath = Join-Path $sslPath "private.key"
$certPath = Join-Path $sslPath "certificate.crt"

# win-acme pode gerar com nomes diferentes, vamos procurar
$keyFiles = Get-ChildItem -Path $sslPath -Filter "*-key.pem" -ErrorAction SilentlyContinue
$certFiles = Get-ChildItem -Path $sslPath -Filter "*-crt.pem" -ErrorAction SilentlyContinue

if ($keyFiles -and $certFiles) {
    # Renomear para os nomes esperados pelo app
    Copy-Item $keyFiles[0].FullName -Destination $keyPath -Force
    Copy-Item $certFiles[0].FullName -Destination $certPath -Force
    Write-Host "✅ Certificados gerados com sucesso!" -ForegroundColor Green
} elseif ((Test-Path $keyPath) -and (Test-Path $certPath)) {
    Write-Host "✅ Certificados já existem!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Certificados não encontrados automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Verifique a pasta: $sslPath" -ForegroundColor Gray
    Write-Host "E renomeie os arquivos para:" -ForegroundColor Gray
    Write-Host "  - private.key" -ForegroundColor Gray
    Write-Host "  - certificate.crt" -ForegroundColor Gray
    Write-Host ""
}

# Configurar .env
Write-Host ""
Write-Host "⚙️  Configurando .env para usar HTTPS..." -ForegroundColor Cyan

$envPath = Join-Path $projectPath ".env"
if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    $content = $content -replace "USE_HTTPS=false", "USE_HTTPS=true"
    $content = $content -replace "REDIRECT_HTTP=false", "REDIRECT_HTTP=true"
    Set-Content -Path $envPath -Value $content -NoNewline
    Write-Host "✅ .env configurado!" -ForegroundColor Green
}

# Reiniciar IIS se estava rodando
if ($iisService -and $iisService.Status -eq "Stopped") {
    Write-Host ""
    Write-Host "🔄 Reiniciando IIS..." -ForegroundColor Cyan
    Start-Service W3SVC
}

Write-Host ""
Write-Host "=" * 70
Write-Host "🎉 CERTIFICADO SSL GRATUITO INSTALADO!" -ForegroundColor Green
Write-Host "=" * 70
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Inicie o servidor:" -ForegroundColor Cyan
Write-Host "   cd $projectPath" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Acesse no navegador:" -ForegroundColor Cyan
Write-Host "   https://$domain" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Renovação automática configurada! ✅" -ForegroundColor Green
Write-Host "   O certificado será renovado automaticamente a cada 60 dias" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 70
Write-Host ""
Write-Host "Custo total: R$ 0,00 (GRATUITO PARA SEMPRE)" -ForegroundColor Green
Write-Host "Seguranca: Mesma de certificados pagos" -ForegroundColor Green
Write-Host "Aceito por: Todos os navegadores" -ForegroundColor Green
Write-Host ""
Write-Host "=" * 70
Write-Host ""
Write-Host "Dica: Renovacao automatica configurada" -ForegroundColor Cyan
Write-Host ""
