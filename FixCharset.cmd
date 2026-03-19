@echo off
setlocal
cd /d "%~dp0"

set PSARGS=-NoProfile -ExecutionPolicy Bypass -File "%~dp0FixCharset.ps1"

echo === Spoustim FixCharset.ps1 === > "%~dp0FixCharset.log"
echo Cesta: %~dp0 >> "%~dp0FixCharset.log"
echo. >> "%~dp0FixCharset.log"

powershell %PSARGS% 1>>"%~dp0FixCharset.log" 2>&1

echo. >> "%~dp0FixCharset.log"
echo === Hotovo === >> "%~dp0FixCharset.log"

type "%~dp0FixCharset.log"
echo.
echo (Log ulozen v: "%~dp0FixCharset.log")
echo.
pause
endlocal
