# Xuất từng trang của tệp .pptx ra ảnh PNG bằng PowerPoint (dùng để kiểm tra hình)
param(
  [Parameter(Mandatory = $true)][string]$Pptx,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [int]$Width = 1600
)
$ErrorActionPreference = 'Stop'
$full = (Resolve-Path $Pptx).Path
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$out = (Resolve-Path $OutDir).Path
Get-ChildItem $out -Filter *.png | Remove-Item -Force
$app = New-Object -ComObject PowerPoint.Application
try {
  # ReadOnly, Untitled, WithWindow = false
  $pres = $app.Presentations.Open($full, $true, $false, $false)
  $ratio = $pres.PageSetup.SlideHeight / $pres.PageSetup.SlideWidth
  $h = [int]($Width * $ratio)
  $i = 0
  foreach ($s in $pres.Slides) {
    $i++
    $s.Export((Join-Path $out ("slide-{0:D2}.png" -f $i)), 'PNG', $Width, $h)
  }
  $pres.Close()
  Write-Output "Đã xuất $i trang vào $out"
} finally {
  $app.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
