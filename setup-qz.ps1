$ErrorActionPreference = "Stop"

$source = Join-Path $PSScriptRoot "node_modules\qz-tray\qz-tray.js"
$publicDir = Join-Path $PSScriptRoot "public"
$destination = Join-Path $publicDir "qz-tray.js"

if (-not (Test-Path $source)) {
    Write-Host "No se encontró node_modules\qz-tray\qz-tray.js" -ForegroundColor Red
    Write-Host "Ejecuta primero: npm install qz-tray" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir | Out-Null
}

Copy-Item $source $destination -Force
Write-Host "QZ Tray copiado correctamente a public\qz-tray.js" -ForegroundColor Green
