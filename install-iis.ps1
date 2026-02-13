# Instalar IIS no Windows
# Execute como Administrador

Write-Host "Instalando IIS e componentes necessarios..."
Write-Host ""

# Habilitar IIS no Windows
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole -All

Write-Host ""
Write-Host "IIS instalado com sucesso!"
Write-Host ""
Write-Host "Agora execute o script setup-iis-clean.ps1"
Write-Host ""
pause
