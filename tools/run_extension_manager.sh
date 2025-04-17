#!/bin/bash
echo "Starting Extension Management UI..."

echo "Activating conda environment..."
cd ..
source "./installer_scripts/activate.sh"

echo "Running Extension server..."
python ./tools/extension_manager.py
