import os
import json

import torch
from huggingface_hub import hf_hub_download
import gradio as gr

from stable_audio_tools.interface.gradio import (
    create_sampling_ui,
    load_model,
)

from src.history_tab.open_folder import open_folder
from src.tortoise.gr_reload_button import gr_open_button_simple
from src.utils.get_path_from_root import get_path_from_root

LOCAL_DIR_BASE = "data/models/stable-audio"
LOCAL_DIR_BASE_ABSOLUTE = get_path_from_root(*LOCAL_DIR_BASE.split("/"))


def get_local_dir(name):
    return os.path.join(LOCAL_DIR_BASE, name.replace("/", "__"))


def get_config_path(name):
    return os.path.join(get_local_dir(name), "model_config.json")


def get_ckpt_path(name):
    # check if model.safetensors exists, if not, check if model.ckpt exists
    safetensor_path = os.path.join(get_local_dir(name), "model.safetensors")
    if os.path.exists(safetensor_path):
        return safetensor_path
    else:
        chkpt_path = os.path.join(get_local_dir(name), "model.ckpt")
        if os.path.exists(chkpt_path):
            return chkpt_path
        else:
            raise Exception(
                f"Neither model.safetensors nor model.ckpt exists for {name}"
            )


def download_pretrained_model(name: str, token: str):

    local_dir = get_local_dir(name)

    model_config_path = hf_hub_download(
        name,
        filename="model_config.json",
        repo_type="model",
        local_dir=local_dir,
        local_dir_use_symlinks=False,
        token=token,
    )

    # Try to download the model.safetensors file first, if it doesn't exist, download the model.ckpt file
    try:
        print(f"Downloading {name} model.safetensors")
        ckpt_path = hf_hub_download(
            name,
            filename="model.safetensors",
            repo_type="model",
            local_dir=local_dir,
            local_dir_use_symlinks=False,
            token=token,
        )
    except Exception as e:
        print(f"Downloading {name} model.ckpt")
        ckpt_path = hf_hub_download(
            name,
            filename="model.ckpt",
            repo_type="model",
            local_dir=local_dir,
            local_dir_use_symlinks=False,
            token=token,
        )

    return model_config_path, ckpt_path


def get_model_list():
    try:
        return [
            x
            for x in os.listdir(LOCAL_DIR_BASE)
            if x != ".gitkeep" and x != "diffusion_cond.json"
        ]
    except FileNotFoundError as e:
        print(e)
        return []


def stable_audio_ui():
    default_model_config_path = "data/models/stable-audio/diffusion_cond.json"
    with open(default_model_config_path) as f:
        model_config = json.load(f)

    pretransform_ckpt_path = None
    pretrained_name = None

    def load_model_helper(model_name, model_half):
        if model_name == None:
            return model_name

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        def load_model_config(model_name):
            path = get_config_path(model_name)
            with open(path) as f:
                return json.load(f)

        _, model_config_new = load_model(
            model_config=load_model_config(model_name),
            model_ckpt_path=get_ckpt_path(model_name),
            pretrained_name=None,
            pretransform_ckpt_path=pretransform_ckpt_path,
            model_half=model_half,
            device=device,  # type: ignore
        )

        model_type = model_config_new["model_type"]  # type: ignore

        if model_type != "diffusion_cond":
            gr.Error("Only diffusion_cond models are supported")
            raise Exception("Only diffusion_cond models are supported")

        # if model_type == "diffusion_cond":
        #     ui = create_txt2audio_ui(model_config)
        # elif model_type == "diffusion_uncond":
        #     ui = create_diffusion_uncond_ui(model_config)
        # elif model_type == "autoencoder" or model_type == "diffusion_autoencoder":
        #     ui = create_autoencoder_ui(model_config)
        # elif model_type == "diffusion_prior":
        #     ui = create_diffusion_prior_ui(model_config)
        # elif model_type == "lm":
        #     ui = create_lm_ui(model_config)

        return model_name

    def model_select_ui():
        with gr.Row():
            model_select = gr.Dropdown(
                choices=get_model_list(),  # type: ignore
                label="Model",
                default=pretrained_name,
                type="value",
            )

            half_checkbox = gr.Checkbox(
                label="Use half precision",
                value=True,
                type="value",
            )

            model_select.change(
                fn=load_model_helper,
                inputs=[model_select, half_checkbox],
                outputs=[model_select],
            )

    model_select_ui()

    with gr.Tabs():
        with gr.Tab("Generation"):
            create_sampling_ui(model_config)
        with gr.Tab("Inpainting"):
            create_sampling_ui(model_config, inpainting=True)
        with gr.Tab("Model Download"):
            gr.Markdown(
                "Models can be found on the [HuggingFace model hub](https://huggingface.co/models?search=stable-audio-open-1.0)."
            )
            pretrained_name_text = gr.Textbox(
                label="HuggingFace repo name, e.g. stabilityai/stable-audio-open-1.0",
                value="",
            )
            token_text = gr.Textbox(
                label="HuggingFace Token (Optional, but needed for some non-public models)",
                placeholder="hf_nFjKuKLJF...",
                value="",
            )
            download_btn = gr.Button("Download")
            download_btn.click(
                download_pretrained_model,
                inputs=[pretrained_name_text, token_text],
                outputs=[pretrained_name_text],
                api_name="model_download",
            )

            gr.Markdown(
                "Models can also be downloaded manually and placed within the directory in a folder, for example `data/models/stable-audio/my_model`"
            )

            open_dir_btn = gr.Button("Open local models dir")
            open_dir_btn.click(
                lambda: open_folder(LOCAL_DIR_BASE_ABSOLUTE),
                api_name="model_open_dir",
            )


def stable_audio_ui_tab():
    with gr.Tab("Stable Audio"):
        stable_audio_ui()


if __name__ == "__main__":

    def main():
        torch.manual_seed(42)

        with gr.Blocks() as interface:
            stable_audio_ui_tab()

        interface.queue()
        interface.launch()

    main()
