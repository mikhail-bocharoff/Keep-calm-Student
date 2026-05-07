@echo off
setlocal
cd /d C:\focusfloat\backend
call .venv\Scripts\activate.bat
python -m pytest app/tests -q

cd /d C:\focusfloat\frontend
C:\investment_center\tools\nodejs\npm.cmd run build
endlocal
