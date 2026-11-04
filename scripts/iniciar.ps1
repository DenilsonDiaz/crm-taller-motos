$ErrorActionPreference = "Stop"
foreach ($pieza in @('panel','api','frontend')) {
    $archivo = Join-Path $PSScriptRoot "servidor-$pieza.ps1"
    Start-Process powershell.exe -ArgumentList @('-NoExit','-File',('"'+$archivo+'"'))
}
Write-Host 'Se abrieron tres terminales. Manténgalas abiertas mientras use el CRM.'
Write-Host 'Panel: http://127.0.0.1:8000 | Vendedores: http://127.0.0.1:5500'
