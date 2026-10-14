param(
 [Parameter(Mandatory=$true)][string]$Serial,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Label,
 [ValidatePattern('^[a-zA-Z0-9_.]+$')][string]$Package='com.bbook.advisor',
 [string]$Adb='C:\Users\Acer\AppData\Local\Android\Sdk\platform-tools\adb.exe'
)
$ErrorActionPreference='Stop'
$processText=(& $Adb -s $Serial shell pidof $Package) -join ''
if($LASTEXITCODE -ne 0 -or $processText -notmatch '^\d+$'){throw 'One BBook process must be running.'}
$scanPid=[int]$processText
$memory=(& $Adb -s $Serial shell dumpsys meminfo $Package) -join "`n"
if($LASTEXITCODE -ne 0){throw 'meminfo read failed'}
$pss=[regex]::Match($memory,'(?m)^\s*TOTAL PSS:\s*(\d+)')
if(-not $pss.Success){throw 'Cannot parse PSS; preserve the raw meminfo locally for review.'}
$directory=Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.expo\profiling'
New-Item -ItemType Directory -Force -Path $directory | Out-Null
$memory | Set-Content -LiteralPath (Join-Path $directory ($Label+'-meminfo.txt')) -Encoding utf8
$result=[pscustomobject]@{Label=$Label;Utc=[DateTime]::UtcNow.ToString('o');Pid=$scanPid;PssKB=[long]$pss.Groups[1].Value}
$result | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $directory ($Label+'.json')) -Encoding utf8
$result
# Observation only: no GC, restart, inference, policy decision or PASS verdict.
