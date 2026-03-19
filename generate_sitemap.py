@echo off
setlocal enabledelayedexpansion

REM generate_sitemap.bat - spouští generate_sitemap.py na Windows
REM Usage: generate_sitemap.bat ["C:\cesta\k\Tvemu\Webu"] [https://mimotrasu.cz]

:: Zjistí adresář, kde je .bat
set "SCRIPT_DIR=%~dp0"

:: První parametr = site directory, nebo výchozí SCRIPT_DIR
if "%~1"=="" (
  set "SITE_DIR=%SCRIPT_DIR%"
) else (
  set "SITE_DIR=%~1"
)

:: Druhý parametr = base URL, nebo výchozí
if "%~2"=="" (
  set "BASE_URL=https://mimotrasu.cz"
) else (
  set "BASE_URL=%~2"
)

echo Generating sitemap.xml in "%SITE_DIR%" with base URL "%BASE_URL%"...

REM Volání Python skriptu
python "%SCRIPT_DIR%generate_sitemap.py" --site-dir "%SITE_DIR%" --base-url "%BASE_URL%"

if errorlevel 1 (
  echo ERROR: Sitemap generation failed.
) else (
  echo Sitemap generated successfully.
)

pause

