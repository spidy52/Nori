$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$rootDir\electron"
Write-Host "Launching Nori Transparent Floating Desktop Pet..." -ForegroundColor Cyan

$electronExe = Join-Path $rootDir "electron\node_modules\electron\dist\electron.exe"
if (Test-Path $electronExe) {
    & $electronExe .
} else {
    npx electron .
}
