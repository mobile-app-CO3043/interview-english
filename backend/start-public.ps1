$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$cloudflared = Join-Path $PSScriptRoot '../../../tmp/tools/cloudflared.exe'
if (-not (Test-Path -LiteralPath $cloudflared)) {
    throw 'Chưa có cloudflared. Cài theo README-SWAGGER.md rồi chạy: cloudflared tunnel --url http://127.0.0.1:3100 --protocol http2'
}
Write-Host 'Giữ API chạy ở terminal khác bằng npm start. URL hiện bên dưới là URL mới; thêm /docs để nộp.'
& $cloudflared tunnel --url http://127.0.0.1:3100 --protocol http2 --no-autoupdate
