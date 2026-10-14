param([Parameter(Mandatory=$true)][string]$Serial,
 [string]$Adb='C:\Users\Acer\AppData\Local\Android\Sdk\platform-tools\adb.exe')
$ErrorActionPreference='Stop'
$allowed=@('requestId','stage','timestampMs','durationMs','pid','nativeAllocBytes','pssKB','javaUsedBytes','bitmapWidth','bitmapHeight','bitmapBytes','detectorsCreated','detectorCloseCalls','pickerWidth','pickerHeight','sourceWidth','sourceHeight','sampleSize','exifOrientation','mirrored','outputWidth','outputHeight','reason','limitKB','requiredHeadroomKB','systemLowMemory','availableKB','systemThresholdKB','coldBaselinePssKB','warmedIdlePssKB','inferenceStarted','inferenceEnded','cleanupFailures','success','sdkProcessCalls','terminalReason')
$stages=@('normalize_start','bounds_read','decode_end','transform_end','jpeg_save_end','normalization_start','normalization_end','normalization_release','before_bitmap_decode','after_bitmap_decode','after_detector_creation','after_face_count','after_contour_detection','before_cleanup','cleanup_requested','idle_after_cleanup','delayed_sample_busy','admission','native_start','native_end','after_mesh_detection')
$rows=@(& $Adb -s $Serial logcat -d -v raw 'BBookPocMemory:I' '*:S')
if($LASTEXITCODE -ne 0){throw 'ADB log read failed'}
$clean=@(foreach($line in $rows){
 try {
  $row=$line | ConvertFrom-Json
  if($row.requestId -notmatch '^[anbp][0-9]+$' -or $row.stage -notin $stages){continue}
  $safe=[ordered]@{}
  foreach($key in $allowed){
   $value=$row.$key
   if($key -in @('requestId','stage')){$safe[$key]=$value}
   elseif($key -eq 'terminalReason' -and $value -in @('success','E_INPUT','E_DETECTION','E_SYSTEM_MEMORY_PRESSURE','E_MEMORY_BUDGET','E_CLEANUP_PENDING','E_SCAN_CANCELLED','E_NORMALIZATION_INPUT','E_NATIVE_UNAVAILABLE')){$safe[$key]=$value}
   elseif($key -eq 'reason' -and $value -in @('allowed','busy','system_pressure','insufficient_budget','cleanup_incomplete','unavailable')){$safe[$key]=$value}
   elseif($value -is [ValueType]){$safe[$key]=$value}
  }
  $safe | ConvertTo-Json -Compress
 } catch {continue}
})
$directory=Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.expo\profiling'
New-Item -ItemType Directory -Path $directory -Force | Out-Null
$path=Join-Path $directory ('stages-'+(Get-Date -Format yyyyMMddHHmmss)+'.jsonl')
$clean | Set-Content -LiteralPath $path -Encoding utf8
Write-Output "Scalar rows: $($clean.Count); file: $path"
# Read only this fixed log tag; never export full logcat or arbitrary strings.

