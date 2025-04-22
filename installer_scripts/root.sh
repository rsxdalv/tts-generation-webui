#!/bin/bash

# Define log file location
logFile="$(dirname "$0")/output.log"

# Start logging
exec > >(tee -i "$logFile") 2>&1

"$(dirname "$0")/init_mamba.sh"
if [ $? -ne 0 ]; then
    echo "Failed to init mamba, exiting..."
    exit 1
fi


export MICROMAMBA_ROOT_PREFIX="./installer_files/mamba"
export MICROMAMBA_EXE="./installer_files/mamba/micromamba"
export SCRIPTS_DIR_MAMBA="./$(dirname "$0")"

$MICROMAMBA_EXE run -p ./installer_files/env node "$SCRIPTS_DIR_MAMBA/init_app.js"
if [ $? -ne 0 ]; then
    echo "Failed to init the app, exiting..."
    exit 1
fi

$MICROMAMBA_EXE run -p ./installer_files/env python server.py
if [ $? -ne 0 ]; then
    echo "Failed to start the app, exiting..."
    exit 1
fi

# Stop logging (automatically handled when the script ends)
exec &>/dev/tty
