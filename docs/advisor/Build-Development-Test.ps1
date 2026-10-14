$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '../..'))
$env:JAVA_HOME = 'C:\Users\Acer\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2'
$env:ANDROID_HOME = 'C:\Users\Acer\AppData\Local\Android\Sdk'
$env:GRADLE_USER_HOME = 'D:\EXE\.ga'
$env:GRADLE_RO_DEP_CACHE = 'C:\Users\Acer\.gradle\caches'
$env:EAS_BUILD_PROFILE = 'advisor-local-test'
$env:BBOOK_ADVISOR_ENABLED = '1'

$env:BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL = '1'
$env:BBOOK_ADVISOR_CLOUD_ENABLED = '0'
$env:BBOOK_ADVISOR_GEMINI_APPROVED = '0'
$env:EXPO_PUBLIC_API_URL = 'https://beautybook-13zj.onrender.com/api'
$env:NODE_ENV = 'production'
& 'C:\Program Files\nodejs\node.exe' node_modules/expo/bin/cli prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { throw 'Local test prebuild failed' }
Push-Location android
try {
 & ./gradlew.bat :app:assembleRelease --console=plain --max-workers=1 --no-daemon --init-script "$PSScriptRoot/native-build.init.gradle" '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=768m -XX:ActiveProcessorCount=2' '-Pkotlin.compiler.execution.strategy=in-process' '-PreactNativeArchitectures=arm64-v8a'
 if ($LASTEXITCODE -ne 0) { throw 'Local test APK build failed' }
} finally { Pop-Location }
$apkTarget = Join-Path (Get-Location) 'BBook-Development-Test.apk'
Copy-Item -LiteralPath 'android/app/build/outputs/apk/release/app-release.apk' -Destination $apkTarget
Write-Output "APK test: $apkTarget"

