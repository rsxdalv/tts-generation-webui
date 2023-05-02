import os

def dummy():
    pass

def setup_or_recover():
    if not os.path.exists('outputs'):
        os.makedirs('outputs')
    if not os.path.exists('favorites'):
        os.makedirs('favorites')
    if not os.path.exists('.env'):
        print("Env file not found. Creating default env.")
        with open('.env', 'w') as outfile:
            outfile.write(
                """
# Due to implementation, only empty string is False,
#  everything else is True
# Duplicates small models checkboxes
SUNO_USE_SMALL_MODELS=
# Use MPS when CUDA is unavailable
SUNO_ENABLE_MPS=
# Offload GPU models to CPU
SUNO_OFFLOAD_CPU=
"""
            )

setup_or_recover()
