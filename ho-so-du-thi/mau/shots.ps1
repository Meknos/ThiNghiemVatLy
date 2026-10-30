# Chụp ảnh màn hình trang thật bằng Edge chạy ẩn
$ErrorActionPreference = 'Continue'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = 'D:\DEV\ThiNghiem\ho-so-du-thi\anh'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$base = 'https://thinghiemvatly.pages.dev/'
$shots = @(
  @{ name = 'trang-chu';      url = $base;                                                   size = '1600,900' },
  @{ name = 'hai-guong';      url = $base + '?exp=hai-guong-phang&i=40&theta=90';            size = '1600,900' },
  @{ name = 'ban-mat';        url = $base + '?exp=ban-mat-song-song&i=60&n=1.73&e=5';        size = '1600,900' },
  @{ name = 'xe-tang';        url = $base + '?exp=ap-suat&F=340000&S=15000&find=1';          size = '1600,900' },
  @{ name = 'khuc-xa';        url = $base + '?exp=khuc-xa-anh-sang&i=60&n=1.73';             size = '1600,900' },
  @{ name = 'dien-thoai';     url = $base + '?exp=hai-guong-phang&i=40&theta=90';            size = '390,844' }
)
foreach ($s in $shots) {
  $file = Join-Path $out ($s.name + '.png')
  $profile = Join-Path $env:TEMP ('edge-shot-' + $s.name)
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 `
    --user-data-dir="$profile" --virtual-time-budget=8000 `
    --window-size=$($s.size) --screenshot="$file" $s.url 2>$null | Out-Null
  Start-Sleep -Milliseconds 500
  if (Test-Path $file) { Write-Output ("OK " + $s.name + " " + (Get-Item $file).Length) } else { Write-Output ("THIEU " + $s.name) }
}
