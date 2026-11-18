# Claritas — instalare asistată (Windows PowerShell).
# Descarcă pachetul, verifică SHA-256, îl despachetează și deschide pagina de extensii a browserului.
# Browserele NU permit instalarea silențioasă din afara magazinelor: ultimul pas (Load unpacked / Load Temporary Add-on) rămâne al tău.
# Folosire:  powershell -ExecutionPolicy Bypass -File .\install.ps1 [chrome|edge|brave|opera|vivaldi|firefox] [base|axe|pdf]
param([string]$Browser = 'chrome', [string]$Variant = 'base')
$ErrorActionPreference = 'Stop'
$Base = if ($env:CLARITAS_BASE) { $env:CLARITAS_BASE } else { 'https://claritas.chiuta.ro/download' }
$Dir = if ($env:CLARITAS_DIR) { $env:CLARITAS_DIR } else { Join-Path $HOME 'Claritas' }
$suf = switch ($Variant) { 'base' { '' } 'axe' { '-axe' } 'pdf' { '-pdf' } default { throw "Varianta necunoscută: $Variant (base|axe|pdf)" } }
$fam = switch ($Browser) { { $_ -in 'chrome','edge','brave','opera','vivaldi','chromium' } { 'chromium' } 'firefox' { 'firefox' } default { throw "Browser necunoscut: $Browser" } }
$file = "claritas-$fam$suf.zip"
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("claritas-" + [guid]::NewGuid())
New-Item -ItemType Directory $tmp | Out-Null
try {
  Write-Host "-> Descarc $file"
  Invoke-WebRequest "$Base/$file" -OutFile (Join-Path $tmp $file) -UseBasicParsing
  Invoke-WebRequest "$Base/SHA256SUMS" -OutFile (Join-Path $tmp 'SHA256SUMS') -UseBasicParsing
  $want = (Get-Content (Join-Path $tmp 'SHA256SUMS') | Where-Object { $_ -match "\s\*?$([regex]::Escape($file))$" } | Select-Object -First 1)
  if (-not $want) { throw 'Fisierul nu apare in SHA256SUMS.' }
  $want = ($want -split '\s+')[0].ToLower()
  $got = (Get-FileHash (Join-Path $tmp $file) -Algorithm SHA256).Hash.ToLower()
  if ($want -ne $got) { throw "SHA-256 NU se potriveste (asteptat $want, obtinut $got). Nu instalez." }
  Write-Host "OK SHA-256 corect ($got)"
  $out = Join-Path $Dir ($file -replace '\.zip$','')
  if (Test-Path $out) { Remove-Item $out -Recurse -Force }
  Expand-Archive (Join-Path $tmp $file) -DestinationPath $out
  Write-Host "OK Despachetat in: $out"
  Set-Clipboard -Value $out; Write-Host 'OK Calea e in clipboard (lipeste-o in fereastra de selectare a folderului)'
} finally { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
if ($fam -eq 'firefox') { $url = 'about:debugging#/runtime/this-firefox'; $exe = 'firefox'; $step = "Alege 'Load Temporary Add-on' si selecteaza manifest.json din folderul de mai sus (dispare la repornire)." }
else {
  $url = switch ($Browser) { 'edge' { 'edge://extensions' } 'opera' { 'opera://extensions' } 'brave' { 'brave://extensions' } 'vivaldi' { 'vivaldi://extensions' } default { 'chrome://extensions' } }
  $exe = switch ($Browser) { 'edge' { 'msedge' } 'opera' { Join-Path $env:LOCALAPPDATA 'Programs\Opera\opera.exe' } 'brave' { 'brave' } 'vivaldi' { Join-Path $env:LOCALAPPDATA 'Vivaldi\Application\vivaldi.exe' } default { 'chrome' } }
  $step = "Activeaza 'Mod dezvoltator', alege 'Incarca extensie despachetata' si selecteaza folderul de mai sus."
}
Write-Host "`nUltimul pas e al tau (browserele nu permit instalarea silentioasa):`n  1. Pagina: $url`n  2. $step"
if ($env:CLARITAS_NO_OPEN -ne '1') { try { Start-Process $exe $url } catch { Write-Host "(Nu am putut deschide browserul; deschide manual $url)" } }
