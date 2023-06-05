import gradio as gr

import os
import shutil


def save_to_favorites(directory: str):
    shutil.copytree(directory, os.path.join("favorites", os.path.basename(directory)))
    return gr.Button.update(value="Saved")


def save_to_collection(directory: str, collection: str):
    shutil.copytree(directory, os.path.join(collection, os.path.basename(directory)))
    return gr.Dropdown.update(value="Saved")
