$logFile = Join-Path -Path $PSScriptRoot -ChildPath "output.log"
Start-Transcript -Path $logFile

# enable long paths on Windows
# requires admin
# Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name 'LongPathsEnabled' -Value 1

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
