# Gerar Certificado Auto-Assinado Rápido
# Execute este script se não tiver OpenSSL instalado

Write-Host "🔐 Gerando certificado auto-assinado..." -ForegroundColor Cyan

$certPath = "C:\Linx\cliente\digitalrf\projeto\intranet\ssl"
$domain = "intranet.digitalrf.com.br"

# Criar certificado usando PowerShell (Windows 10+)
$cert = New-SelfSignedCertificate `
    -DnsName $domain `
    -CertStoreLocation "cert:\LocalMachine\My" `
    -KeyExportPolicy Exportable `
    -KeySpec Signature `
    -KeyLength 4096 `
    -KeyAlgorithm RSA `
    -HashAlgorithm SHA256 `
    -NotAfter (Get-Date).AddYears(1) `
    -Subject "CN=$domain, O=DigitalRF, C=BR"

Write-Host "✅ Certificado criado no Windows Certificate Store" -ForegroundColor Green

# Exportar certificado
$pwd = ConvertTo-SecureString -String "temp123" -Force -AsPlainText

# Exportar como PFX
$pfxPath = Join-Path $certPath "temp.pfx"
Export-PfxCertificate -Cert "cert:\LocalMachine\My\$($cert.Thumbprint)" -FilePath $pfxPath -Password $pwd | Out-Null

# Converter PFX para PEM usando .NET
Add-Type -AssemblyName System.Security
$pfxCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, "temp123", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

# Exportar certificado (CRT)
$certBytes = $pfxCert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certPem = "-----BEGIN CERTIFICATE-----`n" + [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks) + "`n-----END CERTIFICATE-----"
$certPem | Out-File (Join-Path $certPath "certificate.crt") -Encoding ASCII

# Exportar chave privada (KEY)
$rsaKey = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($pfxCert)
$keyBytes = $rsaKey.ExportRSAPrivateKey()
$keyPem = "-----BEGIN RSA PRIVATE KEY-----`n" + [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks) + "`n-----END RSA PRIVATE KEY-----"
$keyPem | Out-File (Join-Path $certPath "private.key") -Encoding ASCII

# Limpar arquivos temporários
Remove-Item $pfxPath -Force
Remove-Item "cert:\LocalMachine\My\$($cert.Thumbprint)" -Force

Write-Host "✅ Arquivos gerados:" -ForegroundColor Green
Write-Host "   - $certPath\certificate.crt" -ForegroundColor Gray
Write-Host "   - $certPath\private.key" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Certificado AUTO-ASSINADO" -ForegroundColor Yellow
Write-Host "   Use apenas para desenvolvimento/testes" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Próximo passo:" -ForegroundColor Cyan
Write-Host "   1. Edite .env e configure USE_HTTPS=true" -ForegroundColor Gray
Write-Host "   2. Execute: npm start (como Administrador)" -ForegroundColor Gray
