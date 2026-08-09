@echo off
setlocal
title Project Ledger
cd /d "%~dp0"

echo Starting Project Ledger...
echo.
echo Keep this window open while you use the app.
echo Closing this window turns the app off.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required for this launcher.
  echo Install the current Node.js LTS release, then double-click this file again.
  pause
  exit /b 1
)

if not exist ".env" copy /y ".env.example" ".env" >nul

if not exist "node_modules" (
  echo Installing dependencies for this copy...
  call npm install
  if errorlevel 1 goto :failed
)

if not exist "prisma\dev.db" (
  echo Preparing the local database...
  call npm run setup
  if errorlevel 1 goto :failed
)

start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"
call npm run dev
goto :end

:failed
echo.
echo Setup did not finish successfully. Review the message above and try again.
pause

:end
endlocal
