param([Parameter(Mandatory=$true)][string]$Artifact,
  [string]$Sdk='C:\Users\Acer\AppData\Local\Android\Sdk',
  [string]$Output='D:\EXE\artifacts\advisor-release-artifact-inspection.json')
$ErrorActionPreference='Stop'
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Output))) | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Artifact))
try {
  $libraries=@(foreach($entry in $archive.Entries) {
    if($entry.FullName -notmatch '(^|/)lib/(arm64-v8a|x86_64)/.+\.so$') { continue }
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
  $abis=@($archive.Entries.FullName | Where-Object {$_ -match '(^|/)lib/[^/]+/.+\.so$'} | ForEach-Object {[regex]::Match($_,'(?:^|/)lib/([^/]+)/').Groups[1].Value} | Sort-Object -Unique)
  $models=@($archive.Entries.FullName | Where-Object {$_ -match 'face.*\.(tflite|dat)|models(_bundled)?/|face.*model'})
} finally { $archive.Dispose() }
$kind=[IO.Path]::GetExtension($Artifact).ToLowerInvariant()
if($kind -notin @('.apk','.aab')){throw 'Supply an APK or AAB you built yourself.'}
$zipExit=$null;$zipOutput=@();$bundleAlignment='NOT CHECKED'
if($kind -eq '.apk'){
  $zipOutput=& "$Sdk\build-tools\36.0.0\zipalign.exe" -c -P 16 4 $Artifact 2>&1
  $zipExit=$LASTEXITCODE
}else{
  # AAB alignment must be checked by the owner's bundletool config/APK set.
  $bundleAlignment='RUN bundletool dump config AND inspect Play-generated APKs'
}
$elfPass=($libraries.Count -gt 0 -and @($libraries|Where-Object {-not $_.loadAligned16KB -or -not $_.relroAligned16KB}).Count -eq 0)
$result=[pscustomobject]@{artifact=(Resolve-Path -LiteralPath $Artifact).Path;kind=$kind;sha256=(Get-FileHash -LiteralPath $Artifact -Algorithm SHA256).Hash;
 abis=$abis;libraries=$libraries;checkedAbis=@('arm64-v8a','x86_64');elf16KBPass=$elfPass;zip16KBExit=$zipExit;zip16KBOutput=($zipOutput -join "`n");aabPackaging=$bundleAlignment;
 static16KBPass=if($kind -eq '.apk'){$elfPass -and $zipExit -eq 0}else{$null};runtime16KB='NOT TESTED';checkVersion='4-apk-aab-official-relro';guidance='https://developer.android.com/guide/practices/page-sizes'}
$result|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $Output -Encoding utf8
$result|Select-Object artifact,kind,elf16KBPass,zip16KBExit,aabPackaging,static16KBPass,runtime16KB
if(-not $elfPass -or ($kind -eq '.apk' -and $zipExit -ne 0)){exit 1}
if($kind -eq '.aab'){Write-Output 'ELF check only: AAB/Play packaging and device validation remain pending.'}
