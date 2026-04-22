$ProjectRoot = $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "      Iniciando Entorno BarberBook       " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Definir rutas absolutas para mayor robustez
$PythonPath = "$ProjectRoot\venv\Scripts\python.exe"
$BackendDir = "$ProjectRoot\backend"
$FrontendDir = "$ProjectRoot\frontend"

# Verificación de requisitos
if (-not (Test-Path $PythonPath)) {
    Write-Host "ERROR: No se encuentra el ejecutable de Python en $PythonPath" -ForegroundColor Red
    Write-Host "Asegúrate de que la carpeta 'venv' existe en la raíz del proyecto." -ForegroundColor Red
    Pause
    exit
}

if (-not (Test-Path $BackendDir)) {
    Write-Host "ERROR: No se encuentra la carpeta 'backend' en $BackendDir" -ForegroundColor Red
    Pause
    exit
}

if (-not (Test-Path $FrontendDir)) {
    Write-Host "ERROR: No se encuentra la carpeta 'frontend' en $FrontendDir" -ForegroundColor Red
    Pause
    exit
}

# 1. Iniciar el Backend
Write-Host "`n[1/2] Levantando el Backend (Django)..." -ForegroundColor Yellow
$BackendCmd = "cd '$BackendDir'; Write-Host '--- Iniciando Servidor Django ---' -ForegroundColor Cyan; & '$PythonPath' manage.py runserver --settings=config.settings.dev"
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass", "-NoExit", "-Command", $BackendCmd

# 2. Iniciar el Frontend
Write-Host "[2/2] Levantando el Frontend (Next.js)..." -ForegroundColor Yellow
$FrontendCmd = "cd '$FrontendDir'; Write-Host '--- Iniciando Servidor Next.js ---' -ForegroundColor Cyan; npm run dev"
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass", "-NoExit", "-Command", $FrontendCmd

Write-Host "`n¡Listo! Se han abierto dos nuevas ventanas para los servidores." -ForegroundColor Green
Write-Host "-> Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "-> Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "`nCierra esta ventana cuando quieras. Los servidores seguirán activos en sus ventanas correspondientes.`n" -ForegroundColor Gray
