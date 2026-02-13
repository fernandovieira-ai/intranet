# Script de Configuracao do IIS - Intranet DigitalRF
# Execute como Administrador

Write-Host "========================================"
Write-Host "Configuracao IIS - Intranet DigitalRF"
Write-Host "========================================"
Write-Host ""

# Configuracoes
$siteName = "IntranetDigitalRF"
$hostName = "intranet.digitalrf.com.br"
$nodePort = 3005
$sitePath = "C:\inetpub\wwwroot\intranet"
$appPoolName = "IntranetDigitalRFPool"

Write-Host "Configuracoes:"
Write-Host "  Nome do Site: $siteName"
Write-Host "  Dominio: $hostName"
Write-Host "  Porta Node.js: $nodePort"
Write-Host "  Caminho: $sitePath"
Write-Host ""

# Criar diretorio
Write-Host "[1/5] Criando diretorio..."
if (-not (Test-Path $sitePath)) {
    New-Item -Path $sitePath -ItemType Directory -Force | Out-Null
}
Write-Host "OK"

# Criar web.config
Write-Host "[2/5] Criando web.config..."
$webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="NodeJS">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:$nodePort/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@
$webConfig | Out-File -FilePath "$sitePath\web.config" -Encoding UTF8 -Force
Write-Host "OK"

# Importar modulo IIS
Write-Host "[3/5] Carregando modulo IIS..."
Import-Module WebAdministration -ErrorAction SilentlyContinue
Write-Host "OK"

# Criar Application Pool
Write-Host "[4/5] Criando Application Pool..."
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Remove-WebAppPool -Name $appPoolName
}
New-WebAppPool -Name $appPoolName | Out-Null
Write-Host "OK"

# Criar Site
Write-Host "[5/5] Criando site..."
if (Test-Path "IIS:\Sites\$siteName") {
    Remove-Website -Name $siteName
}
New-Website -Name $siteName -PhysicalPath $sitePath -ApplicationPool $appPoolName -Port 80 -HostHeader $hostName | Out-Null
Write-Host "OK"

Write-Host ""
Write-Host "Configuracao concluida!"
Write-Host "Teste: http://$hostName"
Write-Host ""
pause
