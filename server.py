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
# required for proper rendering due to gr.* methods
from src.Joutai import Joutai

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


def generic_error_tab(e, name="SeamlessM4Tv2Model", id="seamless"):
    with gr.Tab(name + " (!)", id=id):
        gr.Markdown(f"""Failed to load {name} tab. Please check your configuration.""")
        gr.Markdown(f"""Error: {e}""")


with gr.Blocks(
    css=full_css,
    title="TTS Generation WebUI",
    analytics_enabled=False,  # it broke too many times
) as demo:
    gr.Markdown(
        """
# TTS Generation WebUI [React UI](http://localhost:3000) [Feedback / Bug reports](https://forms.gle/2L62owhBsGFzdFBC8)
### _(Text To Speech, Audio & Music Generation, Conversion)_
"""
    )
    with gr.Tabs():
        with gr.Tab("Text-to-Speech"), gr.Tabs():
            from src.bark.generation_tab_bark import generation_tab_bark

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
                from src.tortoise.generation_tab_tortoise import generation_tab_tortoise

                generation_tab_tortoise()
            except Exception as e:
                generic_error_tab(e, name="Tortoise TTS", id="tortoise")

            try:
                from src.seamlessM4T.seamless_tab import seamless_tab

                seamless_tab()

            except Exception as e:
                generic_error_tab(e, name="SeamlessM4Tv2Model", id="seamless")

            try:
                from src.vall_e_x.vall_e_x_tab import valle_x_tab

                valle_x_tab()

            except Exception as e:
                generic_error_tab(e, name="Valle-X", id="vall_e_x")

            try:
                from src.mms.mms_tab import mms_tab

                mms_tab()

            except Exception as e:
                generic_error_tab(e, name="MMS", id="mms")

            try:
                from src.maha_tts.maha_tts_tab import maha_tts_tab

                maha_tts_tab()

            except Exception as e:
                generic_error_tab(e, name="MahaTTS", id="maha_tts")

            try:
                from src.styletts2.styletts2_tab import style_tts2_tab

                style_tts2_tab()

            except Exception as e:
                generic_error_tab(e, name="StyleTTS2", id="style_tts2")

        with gr.Tab("Audio/Music Generation"), gr.Tabs():

            try:
                from src.stable_audio.stable_audio import stable_audio_ui_tab

                stable_audio_ui_tab()

            except Exception as e:
                generic_error_tab(e, name="Stable Audio", id="stable_audio")

            try:
                from src.magnet.magnet_tab import generation_tab_magnet

                generation_tab_magnet()

            except Exception as e:
                generic_error_tab(e, name="MAGNeT", id="magnet")

            try:
                from src.musicgen.musicgen_tab import generation_tab_musicgen

                generation_tab_musicgen()
            except Exception as e:
                from src.musicgen.musicgen_tab_error import musicgen_tab_error

                musicgen_tab_error(e)
                print("Failed to load musicgen demo")
                print(e)

        with gr.Tab("Audio Conversion"), gr.Tabs():
            try:
                from src.rvc_tab.rvc_tab import rvc_conversion_tab

                rvc_conversion_tab()
            except Exception as e:
                from src.rvc_tab.rvc_tab_error import rvc_tab_error

                rvc_tab_error(e)
                print("Failed to load rvc demo")
                print(e)

            try:
                from src.rvc_tab.uvr5_tab import uvr5_tab

                uvr5_tab()
            except Exception as e:
                from src.rvc_tab.rvc_tab_error import rvc_tab_error

                rvc_tab_error(e, name="UVR5")
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

            from src.vocos.vocos_tabs import vocos_tabs

            vocos_tabs()

        with gr.Tab("Outputs"), gr.Tabs():
            from src.history_tab.main import history_tab

            collections_directories_atom.render()
            history_tab(register_use_as_history_button)
            history_tab(register_use_as_history_button, directory="favorites")
            history_tab(
                register_use_as_history_button,
                directory="outputs",
                show_collections=True,
            )
            from src.history_tab.voices_tab import voices_tab

            voices_tab(register_use_as_history_button)

        with gr.Tab("Settings"), gr.Tabs():
            from src.settings_tab_gradio import settings_tab_gradio

            settings_tab_gradio(reload_config_and_restart_ui, gradio_interface_options)

            from src.bark.settings_tab_bark import settings_tab_bark

            settings_tab_bark()
            from src.utils.model_location_settings_tab import (
                model_location_settings_tab,
            )

            model_location_settings_tab()
            from src.utils.gpu_info_tab import gpu_info_tab
            gpu_info_tab()
            from src.utils.pip_list_tab import pip_list_tab
            pip_list_tab()

        # from src.studio.studio_tab import simple_remixer_tab
        # remixer_input = simple_remixer_tab()


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
if gradio_interface_options["server_name"] == "0.0.0.0":
    print(
        f"Gradio server will be available on http://localhost:{gradio_interface_options['server_port']}"
    )


def start_server():
    demo.queue(
        concurrency_count=gradio_interface_options.get("concurrency_count", 5),
    ).launch(**gradio_interface_options)


if __name__ == "__main__":
    import subprocess
    import webbrowser

    subprocess.Popen("npm start --prefix react-ui", shell=True)
    if gradio_interface_options["inbrowser"]:
        webbrowser.open("http://localhost:3000")

    start_server()
