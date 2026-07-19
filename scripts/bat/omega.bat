@echo off
title 🪐 OMEGA MATRIX SYSTEMS CONTROLLER v5.0
cls

:: Cyberpunkowa zielono-czarna kolorystyka konsoli operatora
color 0A

:menu
cls
echo ==============================================================================
echo   🪐 OMEGA MATRIX CENTRAL CONTROL INTERFACE v5.0
echo ==============================================================================
echo   [1] IGNITE ALL - Odpal cały system (Docker + Python Core + Node.js + HUD)
echo   [2] HUD ONLY   - Odpal tylko konsolowy Dashboard (omega_dashboard.py)
echo   [3] MULTIPLEXER- Odpal potok i scoring leadów (ingest_multiplexer.py)
echo   [4] DEV CLIENT - Uruchom serwer deweloperski frontendu (npm run dev)
echo   [5] DOCKER     - Sprawdź status i zrestartuj kontenery baz danych
echo   [Q] EXIT       - Wyjście z konsoli sterowania
echo ==============================================================================
echo.
set /p opt="Wybierz opcję [1-5, Q]: "

if "%opt%"=="1" goto ignite
if "%opt%"=="2" goto hud
if "%opt%"=="3" goto multiplexer
if "%opt%"=="4" goto dev
if "%opt%"=="5" goto docker
if "%opt%"=="q" exit
if "%opt%"=="Q" exit
goto menu

:ignite
echo.
echo [BOOT] Uruchamianie pełnego ekosystemu za pomocą ignite_all.bat...
call ignite_all.bat
pause
goto menu

:hud
echo.
echo [BOOT] Uruchamianie Omega Dashboard HUD...
python omega_dashboard.py
pause
goto menu

:multiplexer
echo.
echo [BOOT] Uruchamianie Ingest Multiplexera...
python ingest_multiplexer.py
pause
goto menu

:dev
echo.
echo [BOOT] Uruchamianie Vite Dev Server...
npm run dev
pause
goto menu

:docker
echo.
echo [BOOT] Sprawdzanie statusu kontenerów Docker...
docker-compose ps
echo.
echo Wciśnij dowolny klawisz, aby zrestartować kontenery lub zamknij to okno...
pause >nul
docker-compose down
docker-compose up -d
pause
goto menu
