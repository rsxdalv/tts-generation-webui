import glob
import os
import torch
import gradio as gr
from importlib.metadata import version
from tts_webui.tortoise.gr_reload_button import gr_open_button_simple, gr_reload_button
from tts_webui.utils.list_dir_models import unload_model_button
from tts_webui.utils.randomize_seed import randomize_seed_ui
from tts_webui.utils.manage_model_state import manage_model_state
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

MAHA_VERSION = version("maha_tts")


def get_ref_clips(speaker_name):
    return glob.glob(os.path.join("./voices-tortoise/", speaker_name, "*.wav"))


def get_voice_list():
    files = os.listdir("./voices-tortoise/")
    dirs = [f for f in files if os.path.isdir(os.path.join("./voices-tortoise/", f))]
    return dirs


@manage_model_state("maha_tts")
def preload_models_if_needed(model_name, device):
    from maha_tts.inference import load_models

    return load_models(name=model_name, device=device)


@decorator_extension_outer
@decorator_apply_torch_seed
@decorator_save_metadata
@decorator_save_wav
@decorator_add_model_type("maha_tts")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def generate_audio_maha_tts(
    text,
    model_name,
    text_language,
    speaker_name,
    device="auto",
    **kwargs,
):
    from maha_tts.inference import infer_tts, config

    device = torch.device(
        device == "auto" and "cuda" if torch.cuda.is_available() else "cpu" or device
    )
    diff_model, ts_model, vocoder, diffuser = preload_models_if_needed(
        model_name=model_name, device=device
    )

    ref_clips = get_ref_clips(speaker_name)
    text_language = (
        torch.tensor(config.lang_index[text_language]).to(device).unsqueeze(0)
    )
    audio, sr = infer_tts(
        text, ref_clips, diffuser, diff_model, ts_model, vocoder, text_language
    )
    return {"audio_out": (sr, audio)}


def maha_tts_ui():
    # from maha_tts.config import config
    class config:
        langs = [
            "english",
            "tamil",
            "telugu",
            "punjabi",
            "marathi",
            "hindi",
            "gujarati",
            "bengali",
            "assamese",
        ]

    gr.Markdown(
        """
    # Maha TTS Demo
    To use it, simply enter your text, and click "Generate".
    The model will generate speech from the text.
    It uses the [MahaTTS](https://huggingface.co/Dubverse/MahaTTS) model from HuggingFace.

    To make a voice, create a folder with the name of the voice in the `voices-tortoise` folder.
    Then, add the voice's wav files to the folder.

    A voice must be used. Some voices give errors.

    The reference voices can be downloaded [here](https://huggingface.co/Dubverse/MahaTTS/resolve/main/maha_tts/pretrained_models/infer_ref_wavs.zip).
    """
    )
    gr.Markdown(f"MahaTTS version: {MAHA_VERSION}")
    text = gr.Textbox(lines=2, label="Input Text")
    with gr.Row():
        model_name = gr.Radio(
            choices=[
                ("English", "Smolie-en"),
                ("Indian", "Smolie-in"),
            ],
            label="Model Language",
            value="Smolie-in",
            type="value",
        )
        device = gr.Radio(
            choices=["auto", "cuda", "cpu"],
            label="Device",
            value="auto",
            type="value",
        )
    text_language = gr.Radio(
        choices=list(config.langs),
        label="Text Language",
        value="english",
        type="value",
    )
    model_name.change(
        fn=lambda choice: choice == "Smolie-en"
        and gr.Radio(
            value="english",
            visible=False,
            interactive=False,
        )
        or gr.Radio(
            interactive=True,
            visible=True,
        ),
        inputs=[model_name],
        outputs=[text_language],
    )

    with gr.Column():
        gr.Markdown("Speaker Name")
        with gr.Row():
            voices = get_voice_list()
            speaker_name = gr.Dropdown(
                choices=voices,  # type: ignore
                value=voices[0] if voices else "None",
                type="value",
                show_label=False,
                container=False,
            )
            gr_open_button_simple("voices-tortoise", api_name="maha_tts_open_voices")
            gr_reload_button().click(
                fn=lambda: gr.Dropdown(choices=get_voice_list()),  # type: ignore
                outputs=[speaker_name],
                api_name="maha_tts_refresh_voices",
            )
        gr.Markdown("Note: The speaker audio must be mono at this time.")

    seed, randomize_seed_callback = randomize_seed_ui()

    unload_model_button("maha_tts")

    audio_out = gr.Audio(label="Output Audio")
    button = gr.Button("Generate")

    input_dict = {
        text: "text",
        model_name: "model_name",
        text_language: "text_language",
        speaker_name: "speaker_name",
        seed: "seed",
        device: "device",
    }

    output_dict = {
        "audio_out": audio_out,
        "metadata": gr.JSON(label="Metadata", visible=False),
        "folder_root": gr.Textbox(label="Folder root", visible=False),
    }

    button.click(
        **randomize_seed_callback,
    ).then(
        **dictionarize(
            fn=generate_audio_maha_tts,
            inputs=input_dict,
            outputs=output_dict,
        ),
        api_name="maha_tts",
    )


def maha_tts_tab():
    with gr.Tab(label="Maha TTS"):
        maha_tts_ui()


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()  # type: ignore
    with gr.Blocks() as demo:
        maha_tts_tab()

    demo.launch(
        server_port=7770,
    )
