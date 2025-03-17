import os
import gradio as gr
import glob
from pathlib import Path
from huggingface_hub import hf_hub_download

from tts_webui.history_tab.open_folder import open_folder
from tts_webui.utils.get_path_from_root import get_path_from_root
from tts_webui.tortoise.gr_reload_button import gr_reload_button, gr_open_button_simple

from tts_webui.rvc_tab.get_and_load_hubert import download_rmvpe

from tts_webui.utils.randomize_seed import randomize_seed_ui
from tts_webui.utils.manage_model_state import manage_model_state
from tts_webui.utils.list_dir_models import unload_model_button
from tts_webui.decorators.gradio_dict_decorator import dictionarize
from tts_webui.decorators.decorator_apply_torch_seed import decorator_apply_torch_seed
from tts_webui.decorators.decorator_log_generation import decorator_log_generation
from tts_webui.decorators.decorator_save_metadata import decorator_save_metadata
from tts_webui.decorators.decorator_save_wav import decorator_save_wav
from tts_webui.decorators.decorator_add_base_filename import decorator_add_base_filename
from tts_webui.decorators.decorator_add_date import decorator_add_date
from tts_webui.decorators.decorator_add_model_type import decorator_add_model_type
from tts_webui.decorators.log_function_time import log_function_time
from tts_webui.extensions_loader.decorator_extensions import (
    decorator_extension_outer,
    decorator_extension_inner,
)

hubert_path = ""


def get_hubert_path():
    global hubert_path

    if hubert_path != "":
        return hubert_path

    else:
        hubert_path = hf_hub_download(
            repo_id="lj1995/VoiceConversionWebUI", filename="hubert_base.pt"
        )
        return hubert_path


@manage_model_state("rvc")
def get_vc(model_path):
    from rvc.modules.vc.modules import VC

    vc = VC()
    vc.get_vc(model_path)
    return vc


def decorator_rvc_use_model_name_as_text(fn):
    def wrapper(*args, **kwargs):
        kwargs["text"] = kwargs["model_path"]
        return fn(*args, **kwargs)

    return wrapper


# add f0_file
@decorator_extension_outer
@decorator_rvc_use_model_name_as_text
@decorator_apply_torch_seed
@decorator_save_metadata
@decorator_save_wav
@decorator_add_model_type("rvc")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def run_rvc(
    pitch_up_key: str,
    original_audio_path: str,
    index_path: str,
    pitch_collection_method: str,
    model_path: str,
    index_rate: float,
    filter_radius: int,
    resample_sr: int,
    rms_mix_rate: float,
    protect: float,
    **kwargs,
):
    vc = get_vc(model_path + ".pth")
    if pitch_collection_method == "rmvpe":
        download_rmvpe()
    tgt_sr, audio_opt, times, _ = vc.vc_inference(
        sid=1,
        input_audio_path=Path(original_audio_path),
        f0_up_key=int(pitch_up_key),
        f0_method=pitch_collection_method,
        f0_file=None,
        index_file=Path(index_path + ".index"),
        index_rate=index_rate,
        filter_radius=filter_radius,
        resample_sr=resample_sr,
        rms_mix_rate=rms_mix_rate,
        protect=protect,
        hubert_path=get_hubert_path(),
        # hubert_path="data/models/hubert/hubert_base.pt",
    )
    return {"audio_out": (tgt_sr, audio_opt)}


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

    with gr.Column():
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
                fn=lambda: gr.Dropdown(choices=get_list_fn()),
                outputs=[file_path_dropdown],
                api_name=f"rvc_{label.lower()}_reload",
            )

            return file_path_dropdown


def get_rvc_local_path(path: str, file_type: str):
    return os.path.join(RVC_LOCAL_MODELS_DIR, f"{path}.{file_type}")


def rvc_ui():
    with gr.Row(equal_height=False):
        with gr.Column():
            with gr.Row():
                with gr.Column():
                    model_path = rvc_ui_model_or_index_path_ui("Model")
                with gr.Column():
                    index_path = rvc_ui_model_or_index_path_ui("Index")
            unload_model_button("rvc")
            with gr.Row():
                pitch_up_key = gr.Textbox(label="Semitone shift", value="0")
                pitch_collection_method = gr.Radio(
                    ["harvest", "pm", "crepe", "rmvpe", "fcpe"],
                    label="Pitch Collection Method",
                    value="harvest",
                )
                index_rate = gr.Slider(
                    minimum=0.0,
                    maximum=1.0,
                    step=0.01,
                    value=0.66,
                    label="Search Feature Ratio (accent strength)",
                )
                filter_radius = gr.Slider(
                    minimum=0,
                    maximum=10,
                    step=1,
                    value=3,
                    label="Filter Radius (Pitch median filtering)",
                )
            with gr.Row():
                resample_sr = gr.Slider(
                    minimum=0,
                    maximum=48000,
                    step=1,
                    value=0,
                    label="Resample to:",
                )
                rms_mix_rate = gr.Slider(
                    minimum=0.0,
                    maximum=1.0,
                    step=0.01,
                    value=1,
                    label="Voice Envelope Normalizaiton (volume)",
                )
                protect = gr.Slider(
                    minimum=0.0,
                    maximum=0.5,
                    step=0.01,
                    value=0.33,
                    label="Protect Breath Sounds",
                )

        with gr.Column():
            original_audio_path = gr.Audio(label="Original Audio", type="filepath")
            button = gr.Button(value="Convert", variant="primary")
            audio_out = gr.Audio(label="result", interactive=False)
            open_folder_button = gr.Button(
                value="Open outputs folder", variant="secondary"
            )
            open_folder_button.click(lambda: open_folder("outputs-rvc"))

    inputs_dict = {
        pitch_up_key: "pitch_up_key",
        original_audio_path: "original_audio_path",
        index_path: "index_path",
        pitch_collection_method: "pitch_collection_method",
        model_path: "model_path",
        index_rate: "index_rate",
        filter_radius: "filter_radius",
        resample_sr: "resample_sr",
        rms_mix_rate: "rms_mix_rate",
        protect: "protect",
    }

    outputs_dict = {
        "audio_out": audio_out,
        "metadata": gr.JSON(label="Metadata", visible=False),
        "folder_root": gr.Textbox(label="Folder root", visible=False),
    }

    button.click(
        **dictionarize(
            fn=run_rvc,
            inputs=inputs_dict,
            outputs=outputs_dict,
        ),
        api_name="rvc",
    )

    return original_audio_path


def rvc_conversion_tab():
    with gr.Tab("RVC", id="rvc_tab"):
        rvc_ui()


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()  # type: ignore
    with gr.Blocks(analytics_enabled=False) as demo:
        rvc_conversion_tab()

    demo.launch(
        server_port=7770,
    )
