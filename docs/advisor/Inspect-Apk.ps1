param([Parameter(Mandatory=$true)][string]$Apk,
  [string]$Sdk='C:\Users\Acer\AppData\Local\Android\Sdk',
  [string]$Output='D:\EXE\artifacts\mlkit-poc-apk-inspection.json')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Apk))
try {
  $libraries=@(foreach($entry in $archive.Entries) {
    if($entry.FullName -notmatch '^lib/(arm64-v8a|x86_64)/.+\.so$') { continue }
    $stream=$entry.Open(); $memory=[IO.MemoryStream]::new()
    try { $stream.CopyTo($memory); $bytes=$memory.ToArray() } finally { $stream.Dispose(); $memory.Dispose() }
    if($bytes[4] -ne 2 -or $bytes[5] -ne 1) { throw "Unexpected ELF format: $($entry.FullName)" }
    $offset=[BitConverter]::ToUInt64($bytes,32)
    $size=[BitConverter]::ToUInt16($bytes,54)
    $count=[BitConverter]::ToUInt16($bytes,56)
    $loads=@(); $segments=@(); $relroSegments=@()
    for($i=0;$i -lt $count;$i++) {
      $position=[int]($offset+$i*$size)
      $type=[BitConverter]::ToUInt32($bytes,$position)
      $segment=[pscustomobject]@{type=$type;flags=[BitConverter]::ToUInt32($bytes,$position+4);
        virtualAddress=[BitConverter]::ToUInt64($bytes,$position+16);
        memorySize=[BitConverter]::ToUInt64($bytes,$position+40);
        alignment=[BitConverter]::ToUInt64($bytes,$position+48)}
      if($type -eq 1) { $loads += $segment.alignment; $segments += $segment }
      if($type -eq 0x6474e552) { $relroSegments += $segment }
    }
    # A non-aligned RELRO end is not itself a failure: if RELRO owns the
    # entire LOAD (or its suffix), rounding protection cannot cover mutable data.
    # Check actual writable LOAD bytes outside RELRO, not unused page padding.
    $relroDetails=@(foreach($relro in $relroSegments) {
      $start=$relro.virtualAddress; $end=$start+$relro.memorySize
      $pageStart=$start-($start % 16384)
      $pageEnd=$end+((16384-($end % 16384)) % 16384)
      $overlaps=@(foreach($load in $segments) {
        if(($load.flags -band 2) -eq 0) { continue }
        $loadEnd=$load.virtualAddress+$load.memorySize
        $overlapStart=[Math]::Max($pageStart,$load.virtualAddress)
        $overlapEnd=[Math]::Min($pageEnd,$loadEnd)
        if($overlapStart -lt $overlapEnd -and ($overlapStart -lt $start -or $overlapEnd -gt $end)) {
          [pscustomobject]@{start=$overlapStart;end=$overlapEnd}
        }
      })
      $owner=@($segments | Where-Object {$_.virtualAddress -le $start -and ($_.virtualAddress+$_.memorySize) -le $end -and ($_.virtualAddress+$_.memorySize) -gt $start})
      [pscustomobject]@{start=$start;end=$end;endRemainder16KB=($end % 16384);
        endAligned16KB=($end % 16384 -eq 0);entireOrSuffixOfLoad=($owner.Count -gt 0);
        mutableOverlap=$overlaps;layoutSafe16KB=($overlaps.Count -eq 0)}
    })
    [pscustomobject]@{library=$entry.FullName;loadAlignments=$loads;
      loadAligned16KB=($loads.Count -gt 0 -and @($loads | Where-Object {$_ -lt 16384}).Count -eq 0);
      loadSegments=$segments;relroDetails=$relroDetails;
      relroAligned16KB=(@($relroDetails | Where-Object {-not $_.endAligned16KB}).Count -eq 0);
      relroLayoutSafe16KB=(@($relroDetails | Where-Object {-not $_.layoutSafe16KB}).Count -eq 0)}
  })
  $abis=@($archive.Entries.FullName | Where-Object {$_ -match '^lib/[^/]+/.+\.so$'} | ForEach-Object {($_ -split '/')[1]} | Sort-Object -Unique)
  $models=@($archive.Entries.FullName | Where-Object {$_ -match 'face.*\.(tflite|dat)|models(_bundled)?/|face.*model'})
} finally { $archive.Dispose() }
$zipOutput=& "$Sdk\build-tools\36.0.0\zipalign.exe" -c -P 16 4 $Apk 2>&1
$zipExit=$LASTEXITCODE
$result=[pscustomobject]@{apk=(Resolve-Path -LiteralPath $Apk).Path;sha256=(Get-FileHash -LiteralPath $Apk -Algorithm SHA256).Hash;
  abis=$abis;modelEntries=$models;zip16KBExit=$zipExit;zip16KBOutput=($zipOutput -join "`n");libraries=$libraries;
  # Current Android guidance checks RELRO end alignment as well. Retain the
  # old layout analysis as diagnostics, never use it to override that check.
  guidance='https://developer.android.com/guide/practices/page-sizes';
  checkVersion='3-official-relro-and-layout';
  static16KBPass=($zipExit -eq 0 -and $libraries.Count -gt 0 -and @($libraries | Where-Object {-not $_.loadAligned16KB -or -not $_.relroAligned16KB}).Count -eq 0);
  runtime16KB='NOT TESTED'}
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Output -Encoding utf8
$result | Select-Object apk,sha256,abis,zip16KBExit,static16KBPass,runtime16KB
if(-not $result.static16KBPass) { exit 1 }
