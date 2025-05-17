#!/bin/bash

export MICROMAMBA_EXE="./installer_files/mamba/micromamba"

$MICROMAMBA_EXE run -p ./installer_files/env bash

# /tools$ ./conda_env_bash.sh
# ./conda_env_bash.sh: line 5: ./installer_files/mamba/micromamba: No such file or directory
