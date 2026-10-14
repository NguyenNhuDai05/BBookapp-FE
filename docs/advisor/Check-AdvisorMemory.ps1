param([Parameter(Mandatory=$true)][string]$Serial,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Label,
  [long]$BaselinePssKB=0, [int]$ExpectedPid=0,
  [string]$Adb='C:\Users\Acer\AppData\Local\Android\Sdk\platform-tools\adb.exe')
$ErrorActionPreference='Stop'
$package='com.bbook.app'
$processText=(& $Adb -s $Serial shell pidof $package) -join ''
if($LASTEXITCODE -ne 0 -or $processText -notmatch '^\d+$') {throw 'One running PoC process is required; do not perform inference.'}
$pocPid=[int]$processText
$memory=(& $Adb -s $Serial shell dumpsys meminfo $package) -join "`n"
if($LASTEXITCODE -ne 0){throw 'meminfo failed; do not perform inference.'}
$match=[regex]::Match($memory,'(?m)^\s*TOTAL PSS:\s*(\d+)\s+TOTAL RSS:\s*(\d+)')
if(-not $match.Success){throw 'Cannot parse PSS/RSS; do not perform inference.'}
$pss=[long]$match.Groups[1].Value
$rss=[long]$match.Groups[2].Value
$native=[regex]::Match($memory,'(?m)^\s*Native Heap\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)')
$reasons=@()
if($pss -ge 768*1024){$reasons+='PSS >= 768 MiB'}
if($BaselinePssKB -gt 0 -and $pss-$BaselinePssKB -ge 128*1024){$reasons+='PSS growth >= 128 MiB'}
if($ExpectedPid -gt 0 -and $ExpectedPid -ne $pocPid){$reasons+='PID changed; session is not comparable'}
$result=[pscustomobject]@{Label=$Label;Utc=[DateTime]::UtcNow.ToString('o');Pid=$pocPid;
  PssKB=$pss;RssKB=$rss;PssMiB=[Math]::Round($pss/1024,1);RssMiB=[Math]::Round($rss/1024,1);
  NativePssKB=$(if($native.Success){[long]$native.Groups[1].Value}else{$null});
  NativeAllocKB=$(if($native.Success){[long]$native.Groups[7].Value}else{$null});
  Stop=($reasons.Count -gt 0);Reason=($reasons -join '; ')}
$directory=Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.expo\profiling'
New-Item -ItemType Directory -Path $directory -Force | Out-Null
$result | ConvertTo-Json | Set-Content (Join-Path $directory ($Label+'.json')) -Encoding utf8
$result
# One read-only snapshot per invocation. No loops, GC, app restart or inference.
# Stop=false only means below operational limits, never memory acceptance PASS.

