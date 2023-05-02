import json
import os

default_config = {
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
}

def load_config():
    if os.path.exists('config.json'):
        with open('config.json', 'r') as infile:
            return json.load(infile)
    else:
        print("Config file not found. Creating default config.")
        with open('config.json', 'w') as outfile:
            json.dump(default_config, outfile, indent=2)
            return default_config
