from config import config

import dotenv_init
import matplotlib
import matplotlib.pyplot as plt
from generation_tab_bark import generation_tab_tortoise, generation_tab_bark
import gradio as gr
import json
import os
from history_tab import favorites_tab, history_tab
from model_manager import model_manager
from settings_tab import settings_tab

from setup_or_recover import setup_or_recover

dotenv_init.init()
matplotlib.use('agg')
setup_or_recover()

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


def open_outputs_folder():
    os.startfile("outputs")


def open_favorites_folder():
    os.startfile("favorites")


def delete_generation_cb(refresh):
    def delete_generation(json):
        os.remove(json["filename"])
        os.remove(json["filename_png"])
        os.remove(json["filename_json"])

        return refresh()

    return delete_generation

with gr.Blocks() as block:
    gr.Markdown("# TTS Generation WebUI (Bark & Tortoise)")
    generation_tab_bark()
    generation_tab_tortoise()

    history_tab(open_outputs_folder, delete_generation_cb)

    favorites_tab(open_favorites_folder, delete_generation_cb)

    settings_tab(config, save_config, load_models)

    block.launch(server_name='0.0.0.0')






