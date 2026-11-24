@echo off
setlocal
cd /d "%~dp0"

set "PORT=%~1"
if "%PORT%"=="" set "PORT=8124"

echo Avvio di SOGLIA IV su http://localhost:%PORT%
echo Premi CTRL+C in questa finestra per chiudere il server.

start "" "http://localhost:%PORT%"

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

echo Errore: Python non trovato nel PATH.
pause
