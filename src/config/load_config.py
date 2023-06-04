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
        "load_models_on_startup": True,
    },
    "gradio_interface_options": {
        "inline": False,
        "inbrowser": True,
        "share": False,
        "debug": False,
        "enable_queue": True,
        "max_threads": 40,
        "auth": None,
        "auth_message": None,
        "prevent_thread_lock": False,
        "show_error": False,
        "server_name": "0.0.0.0",
        "server_port": None,
        "show_tips": False,
        "height": 500,
        "width": "100%",
        "favicon_path": None,
        "ssl_keyfile": None,
        "ssl_certfile": None,
        "ssl_keyfile_password": None,
        "ssl_verify": True,
        "quiet": True,
        "show_api": True,
        "file_directories": None,
        "_frontend": True,
    },
    "load_models_on_startup": True,
}


def load_config():
    if os.path.exists("config.json"):
        with open("config.json", "r") as infile:
            return json.load(infile)
    else:
        print("Config file not found. Creating default config.")
        with open("config.json", "w") as outfile:
            json.dump(default_config, outfile, indent=2)
        return default_config
