import gradio as gr

import os
import shutil


def save_to_favorites(directory: str):
    shutil.copytree(directory, os.path.join("favorites", os.path.basename(directory)))
    return gr.Button.update(value="Saved")
