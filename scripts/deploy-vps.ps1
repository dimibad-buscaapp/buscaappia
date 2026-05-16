# Deploy DevUnifiedTool no VPS Windows
# Uso local: .\scripts\deploy-vps.ps1
# Requer: git, acesso SSH ao VPS (porta 1097)

$ErrorActionPreference = "Stop"

$configPath = Join-Path $PSScriptRoot "..\config\deployment.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json

$host_ = $config.vps.host
$port = $config.vps.sshPort
$vpsPath = $config.vps.projectPath
$repo = $config.repository

Write-Host "=== DevUnifiedTool - Deploy VPS ===" -ForegroundColor Cyan
Write-Host "Repositorio: $repo"
Write-Host "VPS: ${host_}:${port}"
Write-Host "Destino: $vpsPath"
Write-Host ""

# 1. Push local para GitHub (requer pelo menos um commit)
Write-Host "[1/2] Enviando codigo para GitHub..." -ForegroundColor Yellow
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $projectRoot

$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"

git rev-parse --verify HEAD 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Erro: nao ha commits na branch atual." -ForegroundColor Red
  Write-Host "Execute antes:" -ForegroundColor Yellow
  Write-Host "  git add ."
  Write-Host "  git commit -m `"Initial commit`""
  Pop-Location
  exit 1
}

git push -u origin main 2>$null
if ($LASTEXITCODE -ne 0) {
  git push -u origin master 2>$null
}
if ($LASTEXITCODE -ne 0) {
  Write-Host "Falha ao enviar para o GitHub. Verifique credenciais e conexao." -ForegroundColor Red
  Pop-Location
  exit 1
}

$ErrorActionPreference = $prevErrorAction
Pop-Location

# 2. Atualizar projeto no VPS via SSH
Write-Host "[2/2] Atualizando projeto no VPS..." -ForegroundColor Yellow

$remoteScript = @"
if (!(Test-Path '$vpsPath')) { New-Item -ItemType Directory -Path '$vpsPath' -Force | Out-Null }
Set-Location '$vpsPath'
if (Test-Path '.git') {
  git pull origin main 2>`$null; if (`$LASTEXITCODE -ne 0) { git pull origin master }
} else {
  git clone $repo .
}
if (Test-Path 'package.json') {
  npm install
  npm run build
}
Write-Host 'Deploy concluido em' (Get-Location)
"@

ssh -p $port "Administrator@${host_}" "powershell -Command `"$remoteScript`""

Write-Host ""
Write-Host "Deploy finalizado." -ForegroundColor Green
Write-Host "API: http://${host_}:$($config.vps.apiPort)/api/health"
