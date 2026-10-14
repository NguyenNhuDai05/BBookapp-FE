@echo off
setlocal
rem Local APK only. Uses existing SDK/cache; never submits to EAS or Play.
set "JAVA_HOME=C:\Users\Acer\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2"
set "ANDROID_HOME=C:\Users\Acer\AppData\Local\Android\Sdk"
set "GRADLE_USER_HOME=D:\EXE\.ga"
set "GRADLE_RO_DEP_CACHE=C:\Users\Acer\.gradle\caches"
set "BBOOK_ADVISOR_ENABLED=1"
set "BBOOK_ADVISOR_GEMINI_APPROVED=0"
set "BBOOK_ADVISOR_CLOUD_ENABLED=0"
set "BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL=pending"
set "BBOOK_ADVISOR_BACKEND_URL=https://beautybook-13zj.onrender.com/api"
set "NODE_ENV=production"
set "EAS_BUILD_PROFILE=advisor-preview"
set "EXPO_PUBLIC_API_URL=https://beautybook-13zj.onrender.com/api"
cd /d "%~dp0..\..\android"
if errorlevel 1 exit /b 1
call gradlew.bat :bbook-face-analysis:compileReleaseKotlin :bbook-face-analysis:testDebugUnitTest --console=plain --max-workers=1 --no-daemon --init-script "%~dp0native-build.init.gradle" "-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=768m -XX:ActiveProcessorCount=2" "-Pkotlin.compiler.execution.strategy=in-process" "-PreactNativeArchitectures=arm64-v8a" %* > ..\.expo\advisor-native-check.log 2>&1
exit /b %ERRORLEVEL%



