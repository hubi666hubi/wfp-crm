@echo off
title WFP GitHub Push - TRYB WOJSKOWY
echo ===================================================
echo INICJOWANIE WYPYCHANIA KODU NA GITHUB (TRYB WOJSKOWY)
echo ===================================================
echo.
git remote remove origin >nul 2>&1
git remote add origin https://github.com/hubi666hubi/wfp-crm.git
git branch -M main
echo.
echo UWAGA: Teraz Git sprobuje polaczyc sie z GitHubem.
echo Jesli otworzy sie okno w przegladarce z prosba o logowanie,
echo zaloguj sie i zatwierdz dostep (kliknij Authorize)!
echo.
git push -u origin main
echo.
echo ===================================================
echo PROCES ZAKONCZONY. Kliknij dowolny klawisz, aby zamknac.
echo ===================================================
pause
