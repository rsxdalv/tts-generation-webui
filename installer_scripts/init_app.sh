#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(dirname "$0")"

# Source the activate script to set up the environment
source "$SCRIPT_DIR/activate.sh"

# Run the initialization script
node "$SCRIPT_DIR/init_app.js"
