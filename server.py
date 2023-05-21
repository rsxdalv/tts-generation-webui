import os
import time
import src.dotenv_init as dotenv_init
from generation_tab_tortoise import css_tortoise, generation_tab_tortoise
from src.history_tab.history_css import history_css
from src.load_config import default_config
from settings_tab_gradio import settings_tab_gradio
import src.setup_or_recover as setup_or_recover
import matplotlib
import matplotlib.pyplot as plt
from src.bark_tab.generation_tab_bark import generation_tab_bark, bark_css
from src.clone_tab.tab_voice_clone_demo import tab_voice_clone_demo
import gradio as gr
import json
from src.history_tab.main import favorites_tab, history_tab, voices_tab
from model_manager import model_manager
from settings_tab_bark import settings_tab_bark
from config import config

setup_or_recover.dummy()
dotenv_init.init()
matplotlib.use('agg')

def save_config(text_use_gpu,
                text_use_small,
                coarse_use_gpu,
                coarse_use_small,
                fine_use_gpu,
                fine_use_small,
                codec_use_gpu,
                load_models_on_startup=False
                ):
    global config
    config["model"]["text_use_gpu"] = text_use_gpu
    config["model"]["text_use_small"] = text_use_small
    config["model"]["coarse_use_gpu"] = coarse_use_gpu
    config["model"]["coarse_use_small"] = coarse_use_small
    config["model"]["fine_use_gpu"] = fine_use_gpu
    config["model"]["fine_use_small"] = fine_use_small
    config["model"]["codec_use_gpu"] = codec_use_gpu
    config["load_models_on_startup"] = load_models_on_startup
    with open('config.json', 'w') as outfile:
        json.dump(config, outfile, indent=2)

    return f"Saved: {str(config)}"

def save_config_gradio(keys, inputs):
    # Recreate the UI dictionary
    gradio_interface_options_ui = {
        keys[i]: value for i, value in enumerate(inputs)
    }
    # convert '' to None
    for key, value in gradio_interface_options_ui.items():
        if value == '':
            gradio_interface_options_ui[key] = None
    # Save the config
    global config
    config["gradio_interface_options"] = gradio_interface_options_ui
    with open('config.json', 'w') as outfile:
        json.dump(config, outfile, indent=2)

    return f"Saved {gradio_interface_options_ui}"

def load_models(
    text_use_gpu,
    text_use_small,
    coarse_use_gpu,
    coarse_use_small,
    fine_use_gpu,
    fine_use_small,
    codec_use_gpu
):

    save_config(text_use_gpu,
                text_use_small,
                coarse_use_gpu,
                coarse_use_small,
                fine_use_gpu,
                fine_use_small,
                codec_use_gpu)
    # download and load all models
    model_manager.reload_models(config)
    return gr.Button.update(value="Reload models", interactive=True)

material_symbols_css = """
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

.material-symbols-outlined {
    font-family: 'Material Symbols Outlined' !important;
    font-weight: normal !important;
    font-style: normal !important;
    font-size: 24px !important;
    line-height: 1 !important;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
}
"""

full_css = ""
full_css += material_symbols_css
full_css += css_tortoise
full_css += history_css
full_css += bark_css

def reload_config_and_restart_ui():
    os._exit(0)
    # print("Reloading config and restarting UI...")
    # config = load_config()
    # gradio_interface_options = config["gradio_interface_options"] if "gradio_interface_options" in config else {}
    # demo.close()
    # time.sleep(1)
    # demo.launch(**gradio_interface_options)

gradio_interface_options = config["gradio_interface_options"] if "gradio_interface_options" in config else default_config

with gr.Blocks(css=full_css) as demo:
    gr.Markdown("# TTS Generation WebUI (Bark & Tortoise)")
    with gr.Tabs() as tabs:
        register_use_as_history_button = generation_tab_bark(tabs)
        tab_voice_clone_demo()
        generation_tab_tortoise()

        history_tab(register_use_as_history_button)
        favorites_tab(register_use_as_history_button)
        voices_tab(register_use_as_history_button)

        settings_tab_bark(config, save_config, load_models)
        settings_tab_gradio(save_config_gradio, reload_config_and_restart_ui, gradio_interface_options)


def print_pretty_options(options):
    print("Gradio interface options:")
    max_key_length = max(len(key) for key in options.keys())
    for key, value in options.items():
        print(f"  {key}:{' '*(max_key_length - len(key))} {value}")

print("Starting Gradio server...")
if not gradio_interface_options["enable_queue"]:
    print("Warning: Gradio server queue is disabled. Automatically enabling")
    gradio_interface_options["enable_queue"] = True
print_pretty_options(gradio_interface_options)

if __name__ == "__main__":   
    demo.launch(**gradio_interface_options)