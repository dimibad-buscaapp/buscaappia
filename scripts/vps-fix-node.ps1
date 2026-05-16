# Corrige Node.js no VPS para versao LTS 22 (better-sqlite3 nao suporta Node 24 sem compilar)
# Executar no VPS como Administrador

$ErrorActionPreference = "Stop"

Write-Host "=== BuscaapIA - Ajuste Node.js ===" -ForegroundColor Cyan

$nodeVersion = (node -v 2>$null)
if ($nodeVersion -match '^v24\.') {
  Write-Host "Node $nodeVersion detectado. Instalando Node.js 22 LTS..." -ForegroundColor Yellow
  winget install OpenJS.NodeJS --version 22.15.1 --accept-package-agreements --accept-source-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
} elseif ($nodeVersion -match '^v(20|22)\.') {
  Write-Host "Node $nodeVersion OK." -ForegroundColor Green
} else {
  Write-Host "Node atual: $nodeVersion. Recomendado: v22.x LTS" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Versao apos ajuste:" -ForegroundColor Cyan
node -v
npm -v

$projectPath = "C:\Apps\BuscaapIA"
if (Test-Path $projectPath) {
  Write-Host ""
  Write-Host "Reinstalando dependencias em $projectPath ..." -ForegroundColor Yellow
  Set-Location $projectPath
  Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
  npm install
  npm run build
  Write-Host ""
  Write-Host "Pronto. Inicie com: npm run start" -ForegroundColor Green
} else {
  Write-Host "Pasta $projectPath nao encontrada. Clone o projeto antes." -ForegroundColor Yellow
}
