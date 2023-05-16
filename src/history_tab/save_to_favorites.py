import gradio as gr


import json
import shutil


def save_to_favorites(json_text):
    shutil.copy(json_text["filename"], "favorites/")
    shutil.copy(json_text["filename_png"], "favorites/")
    shutil.copy(json_text["filename_npz"], "favorites/")
    # write new json file with new filename
    json_text["filename"] = json_text["filename"].replace(
        "outputs\\", "favorites\\").replace("outputs/", "favorites/")
    json_text["filename_png"] = json_text["filename_png"].replace(
        "outputs\\", "favorites\\").replace("outputs/", "favorites/")
    json_text["filename_json"] = json_text["filename_json"].replace(
        "outputs\\", "favorites\\").replace("outputs/", "favorites/")
    json_text["filename_npz"] = json_text["filename_npz"].replace(
        "outputs\\", "favorites\\").replace("outputs/", "favorites/")
    with open(json_text["filename_json"], "w") as f:
        json.dump(json_text, f, indent=2)
    return gr.Button.update(value="Saved")