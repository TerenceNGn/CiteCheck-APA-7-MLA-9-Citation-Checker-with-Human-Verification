@echo off
rem CiteCheck local server. Double-click this file, then open http://localhost:8000
cd /d "%~dp0"
echo Starting CiteCheck at http://localhost:8000  (press Ctrl+C to stop)
python -m http.server 8000
pause
