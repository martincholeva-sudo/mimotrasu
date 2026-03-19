@echo off
setlocal
chcp 65001 >nul
rem Spoustime ze STEJNE slozky, kde lezi i HTML (www)
cd /d "%~dp0"

rem Zkus 'py -3', kdyby neslo, pouzij 'python'
set "PY=py -3"

echo --------------------------------------
echo Generuji search.json v: "%cd%"
echo --------------------------------------

%PY% "make_search_json.py" --root "." --base-url "https://www.mimotrasu.cz" --verbose
echo.
echo Hotovo. Vysledek: "%cd%\search.json"
echo.
pause
