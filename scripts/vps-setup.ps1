# Executar UMA VEZ no VPS (PowerShell como Administrador)
# Conectar: ssh -p 1097 Administrator@108.181.169.40

$projectPath = "C:\Apps\BuscaapIA"
$repo = "https://github.com/dimibad-buscaapp/buscaappia.git"

Write-Host "Configurando BuscaapIA em $projectPath..." -ForegroundColor Cyan

if (!(Test-Path $projectPath)) {
  New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
}

Set-Location $projectPath

if (!(Test-Path ".git")) {
  git clone $repo .
} else {
  git pull
}

if (!(Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Crie/edite o arquivo .env com JWT_SECRET de producao." -ForegroundColor Yellow
}

npm install
npm run build

Write-Host ""
Write-Host "Setup concluido." -ForegroundColor Green
Write-Host "Iniciar API: npm run start"
Write-Host "Desenvolvimento: npm run dev"
Write-Host "Health: http://localhost:3000/api/health"
