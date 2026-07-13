@echo off
title 🪐 OMEGA MATRIX CENTRAL CONTROL INTERFACE v5.0
cls

:: Cyberpunkowa fioletowo-różowa kolorystyka konsoli
color 0D

echo ==============================================================================
echo   🪐 OMEGA MATRIX CENTRAL CONTROL INTERFACE - TOTAL SWARM IGNITION SEQUENCE
echo ==============================================================================
echo [BOOT] Sprawdzanie uprawnień administracyjnych...

:: KROK 0: Bezwzględna weryfikacja uprawnień administratora (UAC Guard)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [OSTRZEŻENIE] Brak uprawnień administratora. Uruchamiam procedurę wymuszenia UAC...
    powershell -Command "Start-Process -FilePath '%0' -Verb RunAs"
    exit /b
)

echo 🟢 [UAC SUCCESS] Uprawnienia administracyjne zweryfikowane nominalnie.

set "PROJECT_ROOT=C:\Users\brend\Desktop\XX2"
cd /d "%PROJECT_ROOT%"

:: 1. Ładowanie i eksportowanie kluczy z pliku .env
if exist .env (
    echo [BOOT] Wykryto plik konfiguracyjny .env. Eksportowanie kluczy kryptograficznych...
    for /f "usebackq delims=" %%x in (".env") do (
        echo %%x | findstr /v "^#" >nul
        if not errorlevel 1 (
            echo   ^> Eksportowanie: %%x
            set "%%x"
        )
    )
) else (
    echo [OSTRZEŻENIE] Brak pliku .env w katalogu %PROJECT_ROOT%. Uruchamianie z domyślnymi kluczami.
)

echo.
echo ==============================================================================
echo   [KROK 01] ODPAŁ KONTENERÓW DOCKER (POSTGRESQL CONNECT OMEGA ^& REDIS CLUSTER)
echo ==============================================================================
echo [DOCKER] Sprawdzanie and podnoszenie kontenerów w tle...
docker-compose down >nul 2>&1
docker-compose up -d --remove-orphans

if %errorlevel% neq 0 (
    echo [BLAD KRYTYCZNY] Docker nie jest uruchomiony lub napotkał błąd podczas podnoszenia kontenerów.
    pause
    exit /b %errorlevel%
)
echo 🟢 [DOCKER SUCCESS] Bazy danych PostgreSQL Connect oraz Redis działają w trybie NOMINAL.

echo.
echo ==============================================================================
echo   [KROK 02] ROZRUCH RDZENIA ASYNCHRONICZNEGO PYTHON (AUTO-EWOLUCJA L3/L4/L5)
echo ==============================================================================
echo [PYTHON] Zapłon demonów i piaskownicy walidacyjnej w osobnym oknie terminala...
start "🐍 OMEGA CORE - ASYNC PYTHON SYSTEM" cmd /k "cd /d %PROJECT_ROOT% && title PYTHON RE-EVOLUTION CORE && python backend/app/main_omega.py"

echo.
echo ==============================================================================
echo   [KROK 03] ROZRUCH KONSOLI OPERATORSKIEJ (QUANTUM DASHBOARD HUD)
echo ==============================================================================
echo [PYTHON] Uruchamianie omega_dashboard.py w osobnym oknie terminala...
start "👁️ OMEGA SYSTEM OPERATOR HUD" cmd /k "cd /d %PROJECT_ROOT% && title OMEGA SYSTEM OPERATOR HUD && python omega_dashboard.py"

echo.
echo ==============================================================================
echo   [KROK 04] KONTROLNA KOMPILACJA I START SERWERA EXPRESS CORE (NODE.JS IPC)
echo ==============================================================================
echo [NODE] Uruchamianie głównego skryptu startera run_omega_core.js...
node run_omega_core.js

if %errorlevel% neq 0 (
    echo [BLAD KRYTYCZNY] Serwer Express lub kompilacja TypeScript zakatowała błąd.
    pause
    exit /b %errorlevel%
)

pause
