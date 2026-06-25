@echo off
REM Pusht dit project naar GitHub via HTTPS.
REM Zorg dat de GitHub-repository al bestaat:
REM https://github.com/Laventijn/toetredingsformulier-vzw-meulestede

cd /d "%~dp0\.."

set "REMOTE_URL=https://github.com/Laventijn/toetredingsformulier-vzw-meulestede.git"

git init
git branch -M main

for /f %%i in ('git status --porcelain') do (
  echo.
  echo Let op: er zijn lokale wijzigingen die nog niet bewaard zijn.
  echo Run eerst: scripts\bewaar-lokaal.bat
  echo.
  exit /b 1
)

:push
git remote remove origin 2>nul
git remote add origin "%REMOTE_URL%"
git push -u origin main

echo.
echo Gepusht naar %REMOTE_URL%
