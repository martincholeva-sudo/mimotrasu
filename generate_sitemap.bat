@echo off
REM generate_sitemap.bat - spouští generate_sitemap.py na Windows
REM Použití z příkazové řádky nebo dvojklikem:
REM   generate_sitemap.bat "C:\cesta\k\tvemu\webu" https://mimotrasu.cz

:: Adresář, kde je tento .bat
SET "SCRIPT_DIR=%~dp0"

:: První parametr = site-dir, jinak výchozí (kde je .bat)
IF "%~1"=="" (
  SET "SITE_DIR=%SCRIPT_DIR%"
) ELSE (
  SET "SITE_DIR=%~1"
)

:: Druhý parametr = base-url, jinak výchozí
IF "%~2"=="" (
  SET "BASE_URL=https://mimotrasu.cz"
) ELSE (
  SET "BASE_URL=%~2"
)

ECHO Generating sitemap.xml in "%SITE_DIR%" with base URL "%BASE_URL%"...

:: Spuštění Python skriptu
"%PYTHON%" "%SCRIPT_DIR%generate_sitemap.py" --site-dir "%SITE_DIR%" --base-url "%BASE_URL%"
IF ERRORLEVEL 1 (
  ECHO ERROR: Sitemap generation failed.
) ELSE (
  ECHO Sitemap generated successfully.
)

PAUSE
