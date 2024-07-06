@echo off

call %~dp0activate.bat

call python server.py

@REM start command prompt for user to run commands in case of failure
echo ""
echo ""
echo App exitted or crashed.
echo Starting command prompt for user to run commands in case of failure...
echo ""
cmd /k "%*"

pause
