# %%
import os
import src.utils.setup_or_recover as setup_or_recover
import src.utils.dotenv_init as dotenv_init
import gradio as gr
from src.utils.suppress_warnings import suppress_warnings

suppress_warnings()

from src.config.load_config import default_config
from src.config.config import config

from src.css.css import full_css
from src.history_tab.collections_directories_atom import collections_directories_atom

print("Starting server...\n")

setup_or_recover.dummy()
dotenv_init.init()


from src.utils.generic_error_tab_advanced import generic_error_tab_advanced
from src.extensions_loader.interface_extensions import (
    extension_list_tab,
    handle_extension_class,
)
from src.extensions_loader.ext_callback_save_generation import (
    load_ext_callback_save_generation,
)

load_ext_callback_save_generation()


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


import time
import importlib


def run_tab(module_name, function_name, name, requirements=None):
    print(f"Loading {name} tab...")
    start_time = time.time()
    try:
        module = importlib.import_module(module_name)
        func = getattr(module, function_name)
        func()
    except Exception as e:
        generic_error_tab_advanced(e, name=name, requirements=requirements)
    finally:
        elapsed_time = time.time() - start_time
        print(f"{name} tab loaded in {elapsed_time:.2f} seconds.")


def load_tabs(list_of_tabs):
    for tab in list_of_tabs:
        module_name, function_name, name = tab[:3]
        requirements = tab[3] if len(tab) > 3 else None
        run_tab(module_name, function_name, name, requirements)


def main_ui():
    with gr.Blocks(
        css=full_css,
        title="TTS Generation WebUI",
        analytics_enabled=False,  # it broke too many times
    ) as blocks:
        gr.Markdown(
            """
            # TTS Generation WebUI (Legacy - Gradio) [React UI](http://localhost:3000) [Feedback / Bug reports](https://forms.gle/2L62owhBsGFzdFBC8) [Discord Server](https://discord.gg/V8BKTVRtJ9)
            ### _(Text To Speech, Audio & Music Generation, Conversion)_
            """
        )
        with gr.Tabs():
            all_tabs()

    return blocks


def all_tabs():
    with gr.Tab("Text-to-Speech"), gr.Tabs():
        tts_tabs = [
            ("src.bark.generation_tab_bark", "generation_tab_bark", "Bark TTS"),
            (
                "src.bark.clone.tab_voice_clone",
                "tab_voice_clone",
                "Bark Voice Clone",
                "-r requirements_bark_hubert_quantizer.txt",
            ),
            (
                "src.tortoise.generation_tab_tortoise",
                "generation_tab_tortoise",
                "Tortoise TTS",
            ),
            ("src.seamlessM4T.seamless_tab", "seamless_tab", "SeamlessM4Tv2Model"),
            (
                "src.vall_e_x.vall_e_x_tab",
                "valle_x_tab",
                "Valle-X",
                "-r requirements_vall_e.txt",
            ),
            ("src.mms.mms_tab", "mms_tab", "MMS"),
            (
                "src.maha_tts.maha_tts_tab",
                "maha_tts_tab",
                "MahaTTS",
                "-r requirements_maha_tts.txt",
            ),
            (
                "src.styletts2.styletts2_tab",
                "style_tts2_tab",
                "StyleTTS2",
                "-r requirements_styletts2.txt",
            ),
        ]
        load_tabs(tts_tabs)

        handle_extension_class("text-to-speech")
    with gr.Tab("Audio/Music Generation"), gr.Tabs():
        audio_music_generation_tabs = [
            (
                "src.stable_audio.stable_audio",
                "stable_audio_ui_tab",
                "Stable Audio",
                "-r requirements_stable_audio.txt",
            ),
            (
                "src.magnet.magnet_tab",
                "generation_tab_magnet",
                "MAGNeT",
                "-r requirements_audiocraft.txt",
            ),
            (
                "src.musicgen.musicgen_tab",
                "generation_tab_musicgen",
                "MusicGen",
                "-r requirements_audiocraft.txt",
            ),
        ]
        load_tabs(audio_music_generation_tabs)

        handle_extension_class("audio-music-generation")
    with gr.Tab("Audio Conversion"), gr.Tabs():
        audio_conversion_tabs = [
            (
                "src.rvc_tab.rvc_tab",
                "rvc_conversion_tab",
                "RVC",
                "-r requirements_rvc.txt",
            ),
            ("src.rvc_tab.uvr5_tab", "uvr5_tab", "UVR5", "-r requirements_rvc.txt"),
            (
                "src.demucs.demucs_tab",
                "demucs_tab",
                "Demucs",
                "-r requirements_audiocraft.txt",
            ),
            ("src.vocos.vocos_tabs", "vocos_tabs", "Vocos"),
        ]
        load_tabs(audio_conversion_tabs)

        handle_extension_class("audio-conversion")
    with gr.Tab("Outputs"), gr.Tabs():
        from src.history_tab.main import history_tab

        collections_directories_atom.render()
        history_tab()
        history_tab(directory="favorites")
        history_tab(
            directory="outputs",
            show_collections=True,
        )

        outputs_tabs = [
            # voices
            ("src.history_tab.voices_tab", "voices_tab", "Voices"),
        ]
        load_tabs(outputs_tabs)

        handle_extension_class("outputs")

    with gr.Tab("Tools"), gr.Tabs():
        tools_tabs = []
        load_tabs(tools_tabs)

        handle_extension_class("tools")
    with gr.Tab("Settings"), gr.Tabs():
        from src.settings_tab_gradio import settings_tab_gradio

        settings_tab_gradio(reload_config_and_restart_ui, gradio_interface_options)

        settings_tabs = [
            ("src.bark.settings_tab_bark", "settings_tab_bark", "Settings (Bark)"),
            (
                "src.utils.model_location_settings_tab",
                "model_location_settings_tab",
                "Model Location Settings",
            ),
            ("src.utils.gpu_info_tab", "gpu_info_tab", "GPU Info"),
            ("src.utils.pip_list_tab", "pip_list_tab", "Installed Packages"),
        ]
        load_tabs(settings_tabs)

        extension_list_tab()

        handle_extension_class("settings")


def start_gradio_server():
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

    demo = main_ui()

    print("\n\n")

    if gradio_interface_options["server_name"] == "0.0.0.0":
        print("Notice: Server is open to the internet")
        print(
            f"Gradio server will be available on http://localhost:{gradio_interface_options['server_port']}"
        )

    demo.queue(
        concurrency_count=gradio_interface_options.get("concurrency_count", 5),
    ).launch(**gradio_interface_options)


if __name__ == "__main__":
    import subprocess
    import webbrowser

    print("Starting React UI...")
    subprocess.Popen(
        "npm start --prefix react-ui",
        env={
            **os.environ,
            "GRADIO_BACKEND_AUTOMATIC": f"http://127.0.0.1:{gradio_interface_options['server_port']}",
        },
        shell=True,
    )
    if gradio_interface_options["inbrowser"]:
        webbrowser.open("http://localhost:3000")

    start_gradio_server()
