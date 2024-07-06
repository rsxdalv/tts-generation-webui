$logFile = Join-Path -Path $PSScriptRoot -ChildPath "output.log"
Start-Transcript -Path $logFile

& "$PSScriptRoot\init_mamba.bat"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to init mamba, exiting..."
    exit 1
}

& "$PSScriptRoot\init_app.bat"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to init the app, exiting..."
    exit 1
}

& "$PSScriptRoot\start_app.bat"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start the app, exiting..."
    exit 1
}


Stop-Transcript
