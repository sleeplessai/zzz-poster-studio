# ZZZ Poster Studio - Emoji Gallery Launcher
$Host.UI.RawUI.WindowTitle = "ZZZ Poster Studio - Emoji Gallery"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   🖼️ Launching ZZZ Emoji Gallery (Asset Hub)" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Starting local HTTP server for fast HD image browsing..." -ForegroundColor Yellow
Write-Host "[2] Opening Gallery: http://localhost:8080/gallery/index.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tips:" -ForegroundColor DarkGray
Write-Host "  - Keep this PowerShell window running to host the local server." -ForegroundColor DarkGray
Write-Host "  - You can also open gallery/index.html directly for offline use." -ForegroundColor DarkGray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan

Start-Process "http://localhost:8080/gallery/index.html"
python -m http.server 8080
