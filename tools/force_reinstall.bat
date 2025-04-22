@echo off

set FORCE_REINSTALL=1

cd %~dp0..

call start_tts_webui.bat

@REM --force--reinstall for conda


@REM CHECK PYTHONPATH