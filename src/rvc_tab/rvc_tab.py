import os
import gradio as gr
from scipy.io import wavfile
import torch
import tempfile
from rvc_beta import infer_batch_rvc
from rvc_beta.infer_batch_rvc import vc_single, get_vc
from src.rvc_tab.get_and_load_hubert import get_and_load_hubert
from src.Joutai import Joutai
from src.history_tab.open_folder import open_folder
from src.utils.get_path_from_root import get_path_from_root
import glob
from src.tortoise.gr_reload_button import gr_reload_button, gr_open_button_simple
from src.utils.date import get_date_string


def inject_hubert(hubert_model: torch.nn.Module):
    infer_batch_rvc.hubert_model = hubert_model


def infer_rvc(
    f0up_key,
    input_path,
    index_path,
    f0method,
    opt_path,
    model_path,
    index_rate,
):
    date = get_date_string()
    get_vc(model_path)
    wav_opt = vc_single(0, input_path, f0up_key, None, f0method, index_path, index_rate)
    out_path = os.path.join(opt_path, f"{os.path.basename(input_path)}_{date}.wav")
    wavfile.write(out_path, infer_batch_rvc.tgt_sr, wav_opt)
    return out_path


def run_rvc(
    f0up_key: str,
    original_audio_path: str,
    index_path: tempfile._TemporaryFileWrapper,
    f0method: str,
    model_path: tempfile._TemporaryFileWrapper,
    index_rate: float,
    device: str,
    is_half: bool,
    filter_radius: int,
    resample_sr: int,
    rms_mix_rate: float,
    protect: float,
):
    infer_batch_rvc.set_params_temp(
        _device=device,
        _is_half=is_half,
        _filter_radius=filter_radius,
        _resample_sr=resample_sr,
        _rms_mix_rate=rms_mix_rate,
        _protect=protect,
    )

    from rvc_beta.infer_batch_rvc import config

    if device == "cpu":  # Workaround for "slow_conv2d_cpu" not implemented for 'Half'
        config.is_half = is_half

    if infer_batch_rvc.hubert_model is None:
        get_and_load_hubert()

    opt_path = "./outputs-rvc/"
    return infer_rvc(
        f0method=f0method,
        f0up_key=f0up_key,
        input_path=original_audio_path,
        index_path=index_path.name,
        index_rate=index_rate,
        model_path=model_path.name,
        opt_path=opt_path,
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
    file_type = "pth" if label == "Model" else "index"
    extension = f".{file_type}"
    file_types = [extension]
    get_list_fn = get_rvc_model_list if label == "Model" else get_rvc_index_list

    with gr.Box():
        gr.Markdown(f"{label}")
        with gr.Row():
            file_path_dropdown = gr.Dropdown(
                label=label,
                choices=get_list_fn(),
                show_label=False,
                container=False,
            )
            gr_open_button_simple(RVC_LOCAL_MODELS_DIR)
            gr_reload_button().click(
                lambda: file_path_dropdown.update(
                    choices=get_list_fn(),
                ),
                outputs=[file_path_dropdown],
            )
    gr.Markdown(
        """
<div style="text-align: center;">
- or -
</div>
    """
    )
    file_path_file = gr.File(
        label=label,
        type="file",
        file_count="single",
        file_types=file_types,
    )
    file_path = gr.File(
        label=label,
        type="file",
        file_count="single",
        file_types=file_types,
        visible=False,
    )
    file_path_file.change(
        lambda file: [
            file_path.update(value=file.name),
            file_path_dropdown.update(value=None),
        ]
        if file is not None
        else [
            file_path.update(),
            file_path_dropdown.update(),
        ],
        inputs=[file_path_file],
        outputs=[file_path, file_path_dropdown],
    )
    file_path_dropdown.change(
        lambda model: [
            file_path.update(
                value=os.path.join(RVC_LOCAL_MODELS_DIR, f"{model}{extension}")
            ),
            file_path_file.update(value=None),
        ]
        if model is not None
        else [
            file_path.update(),
            file_path_file.update(),
        ],
        inputs=[file_path_dropdown],
        outputs=[file_path, file_path_file],
    )
    return file_path


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
                # f0method = gr.Dropdown(
                #     ["harvest", "pm", "crepe"], label="f0 Method", value="harvest"
                # )
                f0method = gr.Radio(
                    ["harvest", "pm", "crepe"],
                    label="Pitch Collection Method",
                    value="harvest",
                )
                index_rate = gr.Slider(
                    minimum=0.0, maximum=1.0, step=0.01, value=0.66, label="Search Feature Ratio"
                )
                filter_radius = gr.Slider(
                    minimum=0, maximum=10, step=1, value=3, label="Filter Radius (Pitch)"
                )
            with gr.Row():
                resample_sr = gr.Slider(
                    minimum=0,
                    maximum=48000,
                    step=1,
                    value=0,
                    label="Resample Sample-rate (Bug)",
                )
                rms_mix_rate = gr.Slider(
                    minimum=0.0, maximum=1.0, step=0.01, value=1, label="Voice Envelope Normalizaiton"
                )
                protect = gr.Slider(
                    minimum=0.0, maximum=0.5, step=0.01, value=0.33, label="Protect Breath Sounds"
                )
            with gr.Group():
                gr.Markdown("### Hubert")
                with gr.Row():
                    device = gr.Dropdown(
                        ["cuda:0", "cpu", "mps"], label="Device", value="cuda:0"
                    )
                    is_half = gr.Checkbox(
                        label="Use half precision model (Depends on GPU support)",
                        value=False,
                    )
                    gr.Button(
                        value="Clear Hubert (to reload on next generation)",
                        variant="secondary",
                    ).click(
                        fn=lambda: inject_hubert(None)  # type: ignore
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
            outputs=result,
        )

    return original_audio


def rvc_conversion_tab():
    with gr.Tab("RVC Beta Demo", id="rvc_tab"):
        rvc_ui()


if __name__ == "__main__":
    with gr.Blocks(analytics_enabled=False) as demo:
        rvc_conversion_tab()

    demo.launch()
