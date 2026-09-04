@echo off
rem Launches the local writing desk. Nothing here touches the network.
cd /d "%~dp0"

if not exist "node_modules\electron\dist\electron.exe" (
  echo Electron is not installed yet.
  echo Run:  npm install
  echo Then: node node_modules\electron\install.js
  pause
  exit /b 1
)

start "" "node_modules\electron\dist\electron.exe" "%~dp0."
