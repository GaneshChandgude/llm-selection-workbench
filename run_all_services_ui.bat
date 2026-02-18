@echo off
setlocal

REM One-click launcher for Windows.
REM Starts backend services in separate terminals and opens the UI.

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python is not installed or not available on PATH.
  exit /b 1
)

echo [INFO] Starting primary backend + UI service on http://localhost:8000 ...
start "LLM Workbench - Primary Service" cmd /k "python app.py"

REM Optional second backend service (if present in future/extended setups).
if exist app_secondary.py (
  echo [INFO] Starting secondary backend service on http://localhost:8001 ...
  start "LLM Workbench - Secondary Service" cmd /k "python app_secondary.py"
) else (
  echo [INFO] Secondary backend service file (app_secondary.py) not found. Skipping.
)

timeout /t 2 /nobreak >nul
start "" "http://localhost:8000"

echo [INFO] Services launched. Close the opened terminals to stop services.
endlocal
