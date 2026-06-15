@echo off
title Schulify Git Push

echo =====================================
echo         Schulify Git Push
echo =====================================
echo.

set /p msg=Commit-Nachricht: 

if "%msg%"=="" (
    echo.
    echo Keine Commit-Nachricht eingegeben.
    pause
    exit /b
)

git add .
git commit -m "%msg%"

if errorlevel 1 (
    echo.
    echo Kein Commit erstellt oder ein Fehler ist aufgetreten.
    pause
    exit /b
)

git push

echo.
echo -------------------------------------
echo Push erfolgreich abgeschlossen!
echo -------------------------------------
exit