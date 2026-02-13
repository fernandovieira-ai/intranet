# Script SSL Gratuito - Windows 10

Write-Host "Certificado SSL GRATUITO - Let's Encrypt"
Write-Host "=========================================="
Write-Host ""
Write-Host "Este script vai:"
Write-Host "1. Baixar win-acme (ferramenta gratuita)"
Write-Host "2. Gerar certificado SSL gratuito"
Write-Host "3. Configurar renovacao automatica"
Write-Host ""

$winAcmePath = 'C:\win-acme'
$sslPath = 'C:\Linx\cliente\digitalrf\projeto\intranet\ssl'
$domain = 'intranet.digitalrf.com.br'

# Criar pasta SSL se nao existir
if (-not (Test-Path $sslPath)) {
    New-Item -Path $sslPath -ItemType Directory -Force | Out-Null
}

# Baixar win-acme
if (-not (Test-Path "$winAcmePath\wacs.exe")) {
    Write-Host "Baixando win-acme..."
    $url = 'https://github.com/win-acme/win-acme/releases/download/v2.2.9/win-acme.v2.2.9.1701.x64.pluggable.zip'
    $zip = 'C:\win-acme.zip'
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
        Expand-Archive -Path $zip -DestinationPath $winAcmePath -Force
        Remove-Item $zip -Force
        Write-Host "OK!"
    } catch {
        Write-Host "Erro: $($_.Exception.Message)"
        Write-Host ""
        Write-Host "Baixe manualmente de:"
        Write-Host "https://github.com/win-acme/win-acme/releases"
        Write-Host ""
        Write-Host "Procure o arquivo: win-acme.v2.x.x.x64.pluggable.zip"
        Write-Host "Extraia para: C:\win-acme"
        pause
        exit
    }
}

Write-Host ""
Write-Host "Abrindo Firewall..."
New-NetFirewallRule -DisplayName 'Intranet HTTP' -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName 'Intranet HTTPS' -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Host "OK!"

Write-Host ""
Write-Host "Executando win-acme..."
Write-Host ""
cd $winAcmePath
.\wacs.exe

Write-Host ""
Write-Host "Concluido!"
