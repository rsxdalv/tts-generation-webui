@REM invoke cmd_windows.bat
@REM call ../cmd_windows.bat

echo "This script needs to be run with conda active to work"

echo "Dry run"
conda clean --all --dry-run
pause
echo "Confirm cleaning files or cancel"
conda clean --all
