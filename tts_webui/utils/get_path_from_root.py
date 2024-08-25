import os


def get_path_from_root(*paths: str):
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", *paths))


if __name__ == "__main__":
    TORTOISE_VOICE_DIR_ABS = get_path_from_root("voices-tortoise")
    TORTOISE_LOCAL_MODELS_DIR = get_path_from_root("data", "models", "tortoise")
    # __file__ = c:\Users\admin\Desktop\one-click-installers-tts-main\tts-generation-webui\src\rvc_tab\rvc_tab.py
    get_path_from_root("data", "models", "tortoise")
    print(
        get_path_from_root(
            "data",
            "models",
            "tortoise",
        )
    )
