$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
function Ejecutar { param([string]$Programa,[string[]]$Argumentos)
    & $Programa @Argumentos
    if ($LASTEXITCODE -ne 0) { throw "Falló $Programa. Revise el mensaje anterior." }
}
foreach ($programa in @('php','composer','node','npm.cmd')) {
    if (-not (Get-Command $programa -ErrorAction SilentlyContinue)) { throw "No se encontró $programa. Cierre y abra la terminal después de instalarlo." }
}
Ejecutar 'php' @('-v')
Ejecutar 'node' @('--version')
if (-not (Test-Path 'laravel/.env')) { Copy-Item 'laravel/.env.example' 'laravel/.env' }
if (-not (Test-Path 'api/.env')) { Copy-Item 'api/.env.example' 'api/.env' }
Push-Location 'laravel'
try {
    Ejecutar 'composer' @('install','--no-interaction','--prefer-dist')
    if ((Get-Content '.env' -Raw) -match '(?m)^APP_KEY=\s*$') { Ejecutar 'php' @('artisan','key:generate') }
    Ejecutar 'npm.cmd' @('ci')
    Ejecutar 'npm.cmd' @('run','build')
} finally { Pop-Location }
Push-Location 'api'
try { Ejecutar 'npm.cmd' @('ci') } finally { Pop-Location }
Write-Host 'Dependencias listas. Configure los dos .env según README antes de migrar.'
Write-Host 'Este paso no borra ni crea tablas y no modifica sus contraseñas.'
