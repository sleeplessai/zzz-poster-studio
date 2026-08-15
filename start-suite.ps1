# ZZZ Poster Studio - Hub Portal Launcher
$Host.UI.RawUI.WindowTitle = "ZZZ Poster Studio - Hub Portal"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   🚀 Launching ZZZ Poster Studio & Creative Hub" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Starting local HTTP server on port 8080..." -ForegroundColor Yellow
Write-Host "[2] Opening portal: http://localhost:8080/index.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tips:" -ForegroundColor DarkGray
Write-Host "  - Keep this PowerShell window running to host the local server." -ForegroundColor DarkGray
Write-Host "  - Press Ctrl+C anytime to stop the server." -ForegroundColor DarkGray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan

Start-Process "http://localhost:8080/index.html"
python -m http.server 8080
