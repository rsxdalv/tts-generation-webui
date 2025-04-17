#!/bin/bash
echo "Starting Extension Management UI..."

echo "Activating conda environment..."
source "$(dirname "$0")/../installer_scripts/activate.sh"

echo "Running Extension server..."
python extension_manager.py
