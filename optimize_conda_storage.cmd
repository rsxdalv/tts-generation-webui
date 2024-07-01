@REM invoke cmd_windows.bat
call ../cmd_windows.bat

echo "Dry run"
conda clean --all --dry-run
pause
echo "Confirm cleaning files or cancel"
conda clean --all
