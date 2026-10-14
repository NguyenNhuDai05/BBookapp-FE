param([Parameter(Mandatory=$true)][string]$Apk,[string]$Output='D:\EXE\artifacts\feature-advisor-apk-inspection')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskApk=(Resolve-Path -LiteralPath $Apk).Path
$taskOutput=$Output
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
$taskZip=[System.IO.Compression.ZipFile]::OpenRead($taskApk)
try {
  $taskModels=@($taskZip.Entries | Where-Object {$_.FullName -match '\.(tflite|binarypb)$'} | Select-Object -ExpandProperty FullName)
  $taskAbis=@($taskZip.Entries | Where-Object {$_.FullName -match '^lib/[^/]+/[^/]+\.so$'} | ForEach-Object {$_.FullName.Split('/')[1]} | Sort-Object -Unique)
  $taskNative=$false;$taskMesh=$false
  foreach($taskEntry in ($taskZip.Entries | Where-Object {$_.FullName -match '^classes\d*\.dex$'})) {
    $taskStream=$taskEntry.Open();$taskBytes=[System.IO.MemoryStream]::new();$taskStream.CopyTo($taskBytes);$taskStream.Dispose()
    $taskText=[System.Text.Encoding]::UTF8.GetString($taskBytes.ToArray());$taskBytes.Dispose()
    if($taskText.Contains('Lexpo/modules/bbookfaceanalysis/BBookFaceAnalysisModule;')){$taskNative=$true}
    if($taskText.Contains('Lcom/google/mlkit/vision/facemesh/FaceMesh;')){$taskMesh=$true}
  }
  $taskConfig=$null;$taskConfigEntry=$taskZip.GetEntry('assets/app.config')
  if($taskConfigEntry){$taskReader=[System.IO.StreamReader]::new($taskConfigEntry.Open());try{$taskConfig=$taskReader.ReadToEnd() | ConvertFrom-Json}finally{$taskReader.Dispose()}}
  foreach($taskEntry in ($taskZip.Entries | Where-Object {$_.FullName -match '^lib/arm64-v8a/[^/]+\.so$'})) {
    $taskFile=Join-Path $taskOutput ([System.IO.Path]::GetFileName($taskEntry.FullName))
    $taskInput=$taskEntry.Open();$taskSink=[System.IO.File]::Create($taskFile)
    try{$taskInput.CopyTo($taskSink)}finally{$taskInput.Dispose();$taskSink.Dispose()}
  }
  [pscustomobject]@{apk=$taskApk;sha256=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash;bytes=(Get-Item -LiteralPath $taskApk).Length;abis=$taskAbis;nativeModuleInDex=$taskNative;faceMeshInDex=$taskMesh;advisorEnabled=$taskConfig.extra.advisorEnabled;advisorGeminiApproved=$taskConfig.extra.advisorGeminiApproved;models=$taskModels} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $taskOutput 'package.json')
} finally {$taskZip.Dispose()}
& 'C:\Users\Acer\AppData\Local\Android\Sdk\build-tools\36.0.0\aapt.exe' dump badging $taskApk | Select-String 'package:|sdkVersion|targetSdkVersion|native-code' | Set-Content (Join-Path $taskOutput 'badging.txt')
& 'C:\Users\Acer\AppData\Local\Android\Sdk\build-tools\36.0.0\aapt.exe' dump xmltree $taskApk AndroidManifest.xml | Select-String 'advisor.enabled' -Context 0,1 | Set-Content (Join-Path $taskOutput 'advisor-manifest.txt')
& 'C:\Users\Acer\AppData\Local\Android\Sdk\build-tools\36.0.0\zipalign.exe' -v -c -P 16 4 $taskApk > (Join-Path $taskOutput 'zipalign-16k.txt')
$taskAlignmentExit=$LASTEXITCODE
Write-Output "ZIPALIGN_16K_EXIT=$taskAlignmentExit"
Get-Content (Join-Path $taskOutput 'package.json')
