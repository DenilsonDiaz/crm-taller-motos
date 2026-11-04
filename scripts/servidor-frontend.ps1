$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $raiz '.')
npm.cmd run frontend
