import os
import src.utils.setup_or_recover as setup_or_recover
import src.utils.dotenv_init as dotenv_init
import gradio as gr
import warnings

warnings.filterwarnings(
    "ignore",
    message="Using the update method is deprecated. Simply return a new object instead",
)
warnings.filterwarnings(
    "ignore",
    message="Trying to convert audio automatically from float32 to 16-bit int format.",
)
warnings.filterwarnings(
    "ignore",
    message="Trying to convert audio automatically from int32 to 16-bit int format.",
)

import logging

# suppress warning from logging "A matching Triton is not available, some optimizations will not be enabled"
# suppress warning from logging "Triton is not available, some optimizations will not be enabled."
logging.getLogger("xformers").addFilter(
    lambda record: "Triton is not available" not in record.getMessage()
)

from src.config.load_config import default_config
from src.config.config import config

from src.css.css import full_css
from src.Joutai import Joutai
from src.history_tab.collections_directories_atom import collections_directories_atom


setup_or_recover.dummy()
dotenv_init.init()


def reload_config_and_restart_ui():
    os._exit(0)
    # print("Reloading config and restarting UI...")
    # config = load_config()
    # gradio_interface_options = config["gradio_interface_options"] if "gradio_interface_options" in config else {}
    # demo.close()
    # time.sleep(1)
    # demo.launch(**gradio_interface_options)


gradio_interface_options = (
    config["gradio_interface_options"]
    if "gradio_interface_options" in config
    else default_config
)

with gr.Blocks(
    css=full_css,
    title="TTS Generation WebUI",
    analytics_enabled=False,  # it broke too many times
) as demo:
    gr.Markdown(
        "# TTS Generation WebUI (Bark, MusicGen + AudioGen, Tortoise, RVC) [NEW React UI (Beta)](http://localhost:3000)"
    )
    with Joutai.singleton.tabs:
        from src.tortoise.generation_tab_tortoise import generation_tab_tortoise
        from src.settings_tab_gradio import settings_tab_gradio
        from src.bark.generation_tab_bark import generation_tab_bark
        from src.history_tab.main import history_tab
        from src.bark.settings_tab_bark import settings_tab_bark
        from src.history_tab.voices_tab import voices_tab
        from src.vocos.vocos_tabs import vocos_tabs
        from src.studio.studio_tab import simple_remixer_tab

        register_use_as_history_button = generation_tab_bark()

        try:
            from src.bark.clone.tab_voice_clone import tab_voice_clone

            tab_voice_clone(register_use_as_history_button)
        except Exception as e:
            from src.bark.clone.tab_voice_clone_error import tab_voice_clone_error

            tab_voice_clone_error(e)
            print("Failed to load voice clone demo")
            print(e)

        try:
            from src.musicgen.musicgen_tab import generation_tab_musicgen

            generation_tab_musicgen()
        except Exception as e:
            from src.musicgen.musicgen_tab_error import musicgen_tab_error

            musicgen_tab_error(e)
            print("Failed to load musicgen demo")
            print(e)

        try:
            from src.rvc_tab.rvc_tab import rvc_conversion_tab

            rvc_conversion_tab()
        except Exception as e:
            from src.rvc_tab.rvc_tab_error import rvc_tab_error

            rvc_tab_error(e)
            print("Failed to load rvc demo")
            print(e)

        try:
            from src.demucs.demucs_tab import demucs_tab

            demucs_tab()
        except Exception as e:
            from src.demucs.demucs_tab_error import demucs_tab_error

            demucs_tab_error(e)
            print("Failed to load demucs demo")
            print(e)

        try:
            from src.seamlessM4T.seamless_tab import seamless_tab

            seamless_tab()

        except Exception as e:
            with gr.Tab("SeamlessM4Tv2Model (!)", id="seamless"):
                gr.Markdown("""Failed to load SeamlessM4Tv2Model demo. Please check your configuration.""")
                gr.Markdown(f"""Error: {e}""")
            print("Failed to load seamless demo")
            print(e)

        vocos_tabs()
        generation_tab_tortoise()

        collections_directories_atom.render()
        history_tab(register_use_as_history_button)
        history_tab(register_use_as_history_button, directory="favorites")
        history_tab(
            register_use_as_history_button, directory="outputs", show_collections=True
        )
        voices_tab(register_use_as_history_button)

        with gr.Tab("Settings"):
            from src.settings_tab_gradio import settings_tab_gradio

            settings_tab_gradio(reload_config_and_restart_ui, gradio_interface_options)

            from src.bark.settings_tab_bark import settings_tab_bark

            settings_tab_bark()
            from src.utils.model_location_settings_tab import (
                model_location_settings_tab,
            )

            model_location_settings_tab()

        remixer_input = simple_remixer_tab()
    Joutai.singleton.tabs.render()


def print_pretty_options(options):
    print(" Gradio interface options:")
    max_key_length = max(len(key) for key in options.keys())
    for key, value in options.items():
        if key == "auth" and value is not None:
            print(f"  {key}:{' ' * (max_key_length - len(key))} {value[0]}:******")
        else:
            print(f"  {key}:{' ' * (max_key_length - len(key))} {value}")


# detect if --share is passed
if "--share" in os.sys.argv:
    print("Gradio share mode enabled")
    gradio_interface_options["share"] = True


print("Starting Gradio server...")
if "enable_queue" in gradio_interface_options:
    del gradio_interface_options["enable_queue"]
if gradio_interface_options["auth"] is not None:
    # split username:password into (username, password)
    gradio_interface_options["auth"] = tuple(
        gradio_interface_options["auth"].split(":")
    )
    print("Gradio server authentication enabled")
print_pretty_options(gradio_interface_options)


def start_server():
    demo.queue(
        concurrency_count=gradio_interface_options.get("concurrency_count", 5),
    ).launch(**gradio_interface_options)


if __name__ == "__main__":
    import subprocess

    subprocess.Popen("npm start --prefix react-ui", shell=True)
    start_server()
