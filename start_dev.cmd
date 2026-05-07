@echo off
setlocal
cd /d C:\focusfloat

echo Starting ОтдохнИИ backend and frontend...

start "ОтдохнИИ backend" /min cmd /k "cd /d C:\focusfloat\backend && .venv\Scripts\activate.bat && uvicorn app.main:app --reload"
start "ОтдохнИИ frontend" /min cmd /k "cd /d C:\focusfloat\frontend && C:\investment_center\tools\nodejs\npm.cmd run dev -- --host 0.0.0.0"

timeout /t 4 /nobreak >nul
start http://localhost:5173

echo ОтдохнИИ is opening at http://localhost:5173
echo Backend health: http://localhost:8000/api/health
endlocal
