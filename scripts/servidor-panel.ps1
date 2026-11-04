$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $raiz 'laravel')
php artisan serve --host=127.0.0.1 --port=8000
