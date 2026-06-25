@echo off
REM Bewaart dit project lokaal in Git.
REM Gebruik optioneel: scripts\bewaar-lokaal.bat "Mijn commitbericht"

cd /d "%~dp0\.."

set "COMMIT_MESSAGE=%~1"
if "%COMMIT_MESSAGE%"=="" set "COMMIT_MESSAGE=Lokale update toetredingsformulier"

git init
git add .
git diff --cached --quiet
if %ERRORLEVEL%==0 (
  echo Geen wijzigingen om lokaal te bewaren.
  exit /b 0
)

git commit -m "%COMMIT_MESSAGE%"
git branch -M main

echo.
echo Lokaal bewaard in Git.
