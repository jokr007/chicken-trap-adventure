@echo off
title تشغيل لعبة الدجاجة والأفخاخ
cd /d "%~dp0"

echo ======================================================
echo    🐔 جارٍ تشغيل لعبة الدجاجة والأفخاخ باحترافية...
echo ======================================================

:: فحص توفر بايثون لتشغيل سيرفر محلي نظيف (http://localhost:8080)
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] تم العثور على خادم بايثون المحلي...
    echo جارٍ الفتح برابط محلي سريع http://localhost:8080
    python server.py
    goto end
)

:: في حال عدم توفر بايثون، نفتح اللعبة كنافذة تطبيق مستقلة بدون شريط الروابط file:///
echo جارٍ تشغيل اللعبة كنافذة تطبيق مستقلة...

:: تجربة فتح Microsoft Edge في وضع التطبيق
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%~dp0index.html" --window-size=960,750
    goto end
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%~dp0index.html" --window-size=960,750
    goto end
)

:: تجربة فتح Google Chrome في وضع التطبيق
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%~dp0index.html" --window-size=960,750
    goto end
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%~dp0index.html" --window-size=960,750
    goto end
)

:: الحل الاحتياطي: فتح في المتصفح الافتراضي
start "" "%~dp0index.html"

:end
