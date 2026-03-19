@echo off
echo Instalace dependencies...
pip install requests beautifulsoup4
echo ===============================
echo  Spouštím audit_site.py…
echo ===============================
python "%~dp0\audit_site.py"
pause
