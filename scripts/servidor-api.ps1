$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $raiz 'api')
npm.cmd run dev
