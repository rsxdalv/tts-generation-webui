#!/bin/bash

# This script allows double-clicking to start the TTS WebUI on macOS
# Change to the directory where the script is located
cd "$(dirname "$0")"

# Execute the root script which handles initialization and startup
./installer_scripts/root.sh

# Keep the terminal window open after the script finishes
echo
echo "Press any key to close this window..."
read -n 1