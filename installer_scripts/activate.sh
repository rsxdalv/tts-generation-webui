#!/bin/bash

# Activate the conda environment
export MAMBA_ROOT_PREFIX="$(pwd)/installer_files/mamba"
export MICROMAMBA_EXE="$MAMBA_ROOT_PREFIX/micromamba"
export PATH="$(pwd)/installer_files/env/bin:$PATH"

# Activate the environment
eval "$($MICROMAMBA_EXE shell hook -s bash)"
$MICROMAMBA_EXE activate -p "$(pwd)/installer_files/env"
