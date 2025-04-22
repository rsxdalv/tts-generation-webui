cd "$(dirname "$0")/.."

export MICROMAMBA_EXE="./installer_files/mamba/micromamba"

echo "Generating diagnostic..."

$MICROMAMBA_EXE run -p ./installer_files/env ./installer_scripts/diagnostic_inner.sh

echo "Diagnostic generated."
