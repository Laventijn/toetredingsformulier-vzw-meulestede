@echo off
setlocal
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

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin "%REMOTE_URL%"
) else (
  git remote set-url origin "%REMOTE_URL%"
)

git fetch origin main
if errorlevel 1 (
  echo.
  echo Fout: kon de GitHub-repository niet ophalen.
  exit /b 1
)

git merge-base --is-ancestor origin/main main
if errorlevel 1 (
  echo.
  echo Let op: GitHub bevat commits die lokaal nog niet gemerged zijn.
  echo Run eerst:
  echo git merge origin/main --allow-unrelated-histories
  echo.
  echo Los eventuele conflicten op, run scripts\bewaar-lokaal.bat, en probeer opnieuw.
  exit /b 1
)

git push -u origin main
if errorlevel 1 (
  echo.
  echo Fout: push naar GitHub is mislukt.
  exit /b 1
)

echo.
echo Gepusht naar %REMOTE_URL%
