import json
import os

def dummy():
    pass

def setup_or_recover():
    if not os.path.exists('config.json'):
        print("Config file not found. Creating default config.")
        with open('config.json', 'w') as outfile:
            json.dump({
                "model": {
                    "text_use_gpu": True,
                    "text_use_small": True,
                    "coarse_use_gpu": True,
                    "coarse_use_small": True,
                    "fine_use_gpu": True,
                    "fine_use_small": False,
                    "codec_use_gpu": True,
                    "load_models_on_startup": True
                },
                "load_models_on_startup": True
            }, outfile, indent=2)
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
