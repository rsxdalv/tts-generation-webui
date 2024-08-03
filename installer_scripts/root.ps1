$logFile = Join-Path -Path $PSScriptRoot -ChildPath "output.log"
Start-Transcript -Path $logFile


$title    = 'Confirmation'
$question = 'Are you sure you want to proceed?'
$choices  = '&Yes', '&No'

# check if there are spaces in the path
if ($PSScriptRoot -match " ") {
    Write-Host "Warning: The installation directory's path contains a space character. Conda will fail to install. Please change the directory."
    Write-Host "For example, C:\AI\TTS-Generation-WebUI\"
    # ask user if they still want to continue
    $decision = $Host.UI.PromptForChoice($title, $question, $choices, 1)
    if ($decision -eq 1) {
        exit 1
    }
}


# check if long paths are enabled
$longPathsEnabled = (Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name 'LongPathsEnabled').LongPathsEnabled
if ($longPathsEnabled -ne 1) {
    Write-Host "Warning: Long paths are not enabled, please enable them and restart the installer."
    Write-Host "The installer is likely to fail without long paths enabled, that is why this is required."
    Write-Host "You can enable long paths by running the enable_long_paths.reg file in the installer_scripts folder."
    Write-Host "For more information, please visit:"
    Write-Host "https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=registry#enable-long-paths-in-windows-10-version-1607-and-later"
    # ask user if they still want to continue
    $decision = $Host.UI.PromptForChoice($title, $question, $choices, 1)
    if ($decision -eq 1) {
        exit 1
    }
}


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
