# ZZZ Poster Studio - Canvas Editor Launcher
$Host.UI.RawUI.WindowTitle = "ZZZ Poster Studio - Canvas Editor"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   🎨 Launching ZZZ Poster Studio (Canvas Editor)" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Starting local HTTP server for PWA & asset loading..." -ForegroundColor Yellow
Write-Host "[2] Opening Studio: http://localhost:8080/poster_studio/index.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tips:" -ForegroundColor DarkGray
Write-Host "  - Keep this PowerShell window running to host the local server." -ForegroundColor DarkGray
Write-Host "  - You can also open poster_studio/index.html directly for offline use." -ForegroundColor DarkGray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan

Start-Process "http://localhost:8080/poster_studio/index.html"
python -m http.server 8080
