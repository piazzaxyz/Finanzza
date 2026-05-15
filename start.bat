@echo off
echo ===========================================
echo  FINANZZA - Iniciando sistema...
echo ===========================================

echo.
echo [1/3] Instalando dependencias do backend...
cd backend
call npm install
cd ..

echo.
echo [2/3] Instalando dependencias do frontend...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Iniciando servidores...
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo  Login: piazza / dudu2203
echo ===========================================

start "Finanzza Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Finanzza Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servidores iniciados! Abrindo navegador em 5s...
timeout /t 5 /nobreak >nul
start http://localhost:5173
