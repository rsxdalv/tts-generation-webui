import os
import gradio as gr
import torch
from src.Joutai import Joutai
from src.history_tab.open_folder import open_folder
from src.utils.get_path_from_root import get_path_from_root
import glob
from src.tortoise.gr_reload_button import gr_reload_button, gr_open_button_simple
from src.rvc_tab.infer_rvc import infer_rvc as infer_rvc


def run_rvc(
    f0up_key: str,
    original_audio_path: str,
    index_path: str,
    f0method: str,
    model_path: str,
    index_rate: float,
    device: str,
    is_half: bool,
    filter_radius: int,
    resample_sr: int,
    rms_mix_rate: float,
    protect: float,
):
    return infer_rvc(
        f0method=f0method,
        f0up_key=int(f0up_key),
        input_path=original_audio_path,
        index_path_2=index_path + ".index",
        index_rate=index_rate,
        device=device,
        is_half=is_half,
        filter_radius=filter_radius,
        resample_sr=resample_sr,
        rms_mix_rate=rms_mix_rate,
        protect=protect,
        model_name=model_path + ".pth",
    )


RVC_LOCAL_MODELS_DIR = get_path_from_root("data", "models", "rvc", "checkpoints")


def remove_path_base(path: str, pos: int = 0):
    return os.path.join(*path.split(os.path.sep)[pos:])


def get_list(type: str):
    try:
        return [
            remove_path_base(x, 4).replace(f".{type}", "")
            for x in glob.glob(
                os.path.join("data", "models", "rvc", "checkpoints", "**", f"*.{type}")
            )
            if x != ".gitkeep"
        ]
    except FileNotFoundError as e:
        print(e)
        return []


def get_rvc_model_list():
    return get_list("pth")


def get_rvc_index_list():
    return get_list("index")


def rvc_ui_model_or_index_path_ui(label: str):
    get_list_fn = get_rvc_model_list if label == "Model" else get_rvc_index_list

    with gr.Box():
        gr.Markdown(f"{label}")
        with gr.Row():
            file_path_dropdown = gr.Dropdown(
                label=label,
                choices=get_list_fn(),  # type: ignore
                show_label=False,
                container=False,
            )
            gr_open_button_simple(
                RVC_LOCAL_MODELS_DIR, api_name=f"rvc_{label.lower()}_open"
            )
            gr_reload_button().click(
                lambda: file_path_dropdown.update(
                    choices=get_list_fn(),  # type: ignore
                ),
                outputs=[file_path_dropdown],
                api_name=f"rvc_{label.lower()}_reload",
            )

            return file_path_dropdown


def get_rvc_local_path(path: str, file_type: str):
    return os.path.join(RVC_LOCAL_MODELS_DIR, f"{path}.{file_type}")


def rvc_ui():
    gr.Markdown("# RVC Beta Demo")
    with gr.Row(equal_height=False):
        with gr.Column():
            with gr.Row():
                with gr.Column():
                    model_path = rvc_ui_model_or_index_path_ui("Model")
                with gr.Column():
                    index_path = rvc_ui_model_or_index_path_ui("Index")
            with gr.Row():
                f0up_key = gr.Textbox(label="Pitch Up key", value="0")
                f0method = gr.Radio(
                    ["harvest", "pm", "crepe", "rmvpe", "fcpe"],
                    label="Pitch Collection Method",
                    value="harvest",
                )
                index_rate = gr.Slider(
                    minimum=0.0,
                    maximum=1.0,
                    step=0.01,
                    value=0.66,
                    label="Search Feature Ratio",
                )
                filter_radius = gr.Slider(
                    minimum=0,
                    maximum=10,
                    step=1,
                    value=3,
                    label="Filter Radius (Pitch)",
                )
            with gr.Row():
                resample_sr = gr.Slider(
                    minimum=0,
                    maximum=48000,
                    step=1,
                    value=0,
                    label="Resample Sample-rate",
                )
                rms_mix_rate = gr.Slider(
                    minimum=0.0,
                    maximum=1.0,
                    step=0.01,
                    value=1,
                    label="Voice Envelope Normalizaiton",
                )
                protect = gr.Slider(
                    minimum=0.0,
                    maximum=0.5,
                    step=0.01,
                    value=0.33,
                    label="Protect Breath Sounds",
                )
            with gr.Box():
                gr.Markdown("### Hubert")
                with gr.Row():
                    device = gr.Dropdown(
                        ["cuda:0", "cpu", "mps"], label="Device", value="cuda:0"
                    )
                    is_half = gr.Checkbox(
                        label="Use half precision model (Depends on GPU support)",
                        value=False,
                    )

        with gr.Column():
            original_audio = Joutai.singleton.rvc_input
            original_audio.render()
            button = gr.Button(value="Convert", variant="primary")
            result = gr.Audio(label="result", interactive=False)
            open_folder_button = gr.Button(
                value="Open outputs folder", variant="secondary"
            )
            open_folder_button.click(lambda: open_folder("outputs-rvc"))

        metadata = gr.JSON(
            label="Metadata",
            visible=False,
        )

        button.click(
            run_rvc,
            inputs=[
                f0up_key,
                original_audio,
                index_path,
                f0method,
                model_path,
                index_rate,
                device,
                is_half,
                filter_radius,
                resample_sr,
                rms_mix_rate,
                protect,
            ],
            outputs=[
                result,
                metadata,
            ],
            api_name="rvc",
        )

    return original_audio


def rvc_conversion_tab():
    with gr.Tab("RVC Beta Demo", id="rvc_tab"):
        rvc_ui()


if __name__ == "__main__":
    with gr.Blocks(analytics_enabled=False) as demo:
        rvc_conversion_tab()

    demo.launch()
