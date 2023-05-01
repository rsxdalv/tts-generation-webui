import shutil
from clear_audio import clear_audio
from config import config

import dotenv_init
import matplotlib
import matplotlib.pyplot as plt
from generation_tab_bark import generation_tab_tortoise, generation_tab_bark
import gradio as gr
import json
import os
import glob
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

    with gr.Tab("History") as history_tab:

        with gr.Row():
            button_output = gr.Button(value="Open outputs folder")
        button_output.click(open_outputs_folder)

        wav_file_list = []

        def get_wav_files():
            wav_files = glob.glob("outputs/*.wav")
            global wav_file_list
            wav_file_list = wav_files
            return [[file] for file in wav_files]

        _audio_component = gr.Audio(visible=False)
        history_list = gr.Dataset(components=[_audio_component],
                                  samples=get_wav_files(), label="History", samples_per_page=20)
        history_audio = gr.Audio(
            visible=True, type="filepath", label="History")
        history_image = gr.Image()
        history_json = gr.JSON()

        def save_to_favorites(json_text):
            shutil.copy(json_text["filename"], "favorites/")
            shutil.copy(json_text["filename_png"], "favorites/")
            # write new json file with new filename
            json_text["filename"] = json_text["filename"].replace(
                "outputs/", "favorites/")
            json_text["filename_png"] = json_text["filename_png"].replace(
                "outputs/", "favorites/")
            json_text["filename_json"] = json_text["filename_json"].replace(
                "outputs/", "favorites/")
            with open(json_text["filename_json"].replace("outputs/", "favorites/"), "w") as f:
                json.dump(json_text, f, indent=2)
            return gr.Button.update(value="Saved")

        with gr.Row():
            delete_from_history = gr.Button(
                value="Delete", variant="stop", visible=False)
            save_to_favorites_history = gr.Button(
                value="Save to favorites", variant="primary", visible=False)

        save_to_favorites_history.click(
            fn=save_to_favorites, inputs=history_json, outputs=save_to_favorites_history)

        def select_audio(selection):
            filename = wav_file_list[selection]
            with open(filename.replace(".wav", ".json")) as f:
                json_text = json.load(f)
            return [
                gr.Audio.update(value=filename, label=filename),
                gr.Image.update(value=filename.replace(".wav", ".png")),
                gr.JSON.update(value=json_text),
                gr.Button.update(visible=True),
                gr.Button.update(visible=True, value="Save to favorites"),
            ]

        history_list.select(fn=select_audio, inputs=[history_list], outputs=[
                            history_audio, history_image, history_json, delete_from_history, save_to_favorites_history], preprocess=False)

        def update_history_tab():
            return gr.Dataset.update(samples=get_wav_files())

        delete_from_history.click(fn=clear_audio, outputs=[
                                  history_audio, history_image, history_json, delete_from_history])
        delete_from_history.click(fn=delete_generation_cb(
            update_history_tab), inputs=history_json, outputs=[history_list])
        history_tab.select(fn=update_history_tab, outputs=[history_list])

    with gr.Tab("Favorites") as favorites_tab:

        with gr.Row():
            button_output = gr.Button(value="Open favorites folder")
        button_output.click(open_favorites_folder)

        wav_file_list_favorites = []

        def get_wav_files_favorites():
            wav_files = glob.glob("favorites/*.wav")
            global wav_file_list_favorites
            wav_file_list_favorites = wav_files
            return [[file] for file in wav_files]

        _audio_component = gr.Audio(visible=False)
        favorites_list = gr.Dataset(components=[_audio_component],
                                    samples=get_wav_files_favorites(), label="Favorites", samples_per_page=20)
        favorites_audio = gr.Audio(
            visible=True, type="filepath", label="Favorites")
        favorites_image = gr.Image()
        favorites_json = gr.JSON()

        with gr.Row():
            delete_from_favorites = gr.Button(
                value="Delete", variant="stop", visible=False)

        def select_audio(selection):
            filename = wav_file_list_favorites[selection]
            with open(filename.replace(".wav", ".json")) as f:
                json_text = json.load(f)
            return [
                gr.Audio.update(value=filename, label=filename),
                gr.Image.update(value=filename.replace(".wav", ".png")),
                gr.JSON.update(value=json_text),
                gr.Button.update(visible=True),
            ]

        favorites_list.select(fn=select_audio, inputs=[favorites_list], outputs=[
            favorites_audio, favorites_image, favorites_json, delete_from_favorites], preprocess=False)

        def update_favorites_tab():
            return gr.Dataset.update(samples=get_wav_files_favorites())

        delete_from_favorites.click(fn=clear_audio, outputs=[
                                    favorites_audio, favorites_image, favorites_json, delete_from_favorites])
        delete_from_favorites.click(fn=delete_generation_cb(
            update_favorites_tab), inputs=favorites_json, outputs=[favorites_list])
        favorites_tab.select(fn=update_favorites_tab, outputs=[favorites_list])

    settings_tab(config, save_config, load_models)

    block.launch(server_name='0.0.0.0')




