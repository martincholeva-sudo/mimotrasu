# FixCharset.ps1 — rekurzivně vloží/přesune <meta charset="utf-8"> hned za <head>
# Zálohuje .bak, nic dalšího nemění.
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$reHead        = '<head\b[^>]*>'
$reAnyCharset  = '<meta\b[^>]*charset\s*=\s*[^>]*>\s*'
$reHttpEquivCT = '<meta\b[^>]*http-equiv\s*=\s*["'']?\s*content-type\s*["'']?[^>]*>\s*'

function Get-Newline([string]$s){
  if($s -match "`r`n"){ return "`r`n" } else { return "`n" }
}

$processed = 0; $added = 0; $moved = 0; $skippedNoHead = 0

Get-ChildItem -Recurse -File -Include *.html | ForEach-Object {
  $path = $_.FullName
  $processed++

  $html = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  $nl = Get-Newline $html

  $mHead = [regex]::Match($html, $reHead, 'IgnoreCase')
  if(-not $mHead.Success){ $skippedNoHead++; return }

  $hadCharset = [regex]::IsMatch($html, $reAnyCharset, 'IgnoreCase') -or `
                [regex]::IsMatch($html, $reHttpEquivCT, 'IgnoreCase')

  # vyčisti všechny existující charset meta (aby nebyly duplicity)
  $clean = [regex]::Replace($html, $reAnyCharset, '', 'IgnoreCase')
  $clean = [regex]::Replace($clean, $reHttpEquivCT, '', 'IgnoreCase')

  # najdi znovu <head> po očištění
  $m2 = [regex]::Match($clean, $reHead, 'IgnoreCase'); if(-not $m2.Success){ $m2 = $mHead }
  $insertPos = $m2.Index + $m2.Length
  $snippet   = "$nl    <meta charset=""utf-8"">"
  $new       = $clean.Insert($insertPos, $snippet)

  # záloha .bak (jen jednou)
  $bak = "$path.bak"
  if(-not (Test-Path -LiteralPath $bak)){
    Copy-Item -LiteralPath $path -Destination $bak -Force
  }

  # zapiš zpět
  Set-Content -LiteralPath $path -Value $new -Encoding UTF8 -NoNewline
  if($hadCharset){ $moved++ ; Write-Host "[OK] Přesunuto: $path" }
  else { $added++ ; Write-Host "[OK] Přidáno:  $path" }
}

Write-Host ""
Write-Host "===== REKAPITULACE ====="
Write-Host ("Zpracováno HTML:          {0}" -f $processed)
Write-Host ("Přidáno <meta charset>:   {0}" -f $added)
Write-Host ("Přesunuto <meta charset>: {0}" -f $moved)
Write-Host ("Přeskočeno (bez <head>):  {0}" -f $skippedNoHead)
