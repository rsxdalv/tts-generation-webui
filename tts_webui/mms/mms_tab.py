import os
from iso639 import Lang
import torch
import gradio as gr

from tts_webui.decorators.gradio_dict_decorator import dictionarize
from tts_webui.utils.manage_model_state import manage_model_state
from tts_webui.utils.list_dir_models import unload_model_button
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
from tts_webui.utils.randomize_seed import randomize_seed_ui

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from transformers import VitsTokenizer, VitsModel


@manage_model_state("mms")
def preload_models_if_needed(language="eng") -> tuple["VitsModel", "VitsTokenizer"]:
    from transformers import VitsTokenizer, VitsModel

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = VitsModel.from_pretrained(  # type: ignore
        f"facebook/mms-tts-{language}",
    )
    model = model.to(device)  # type: ignore
    tokenizer = VitsTokenizer.from_pretrained(  # type: ignore
        f"facebook/mms-tts-{language}",
    )  # type: ignore
    return model, tokenizer


@decorator_extension_outer
@decorator_apply_torch_seed
@decorator_save_metadata
@decorator_save_wav
@decorator_add_model_type("mms")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def generate_audio_with_mms(
    text,
    language="eng",
    speaking_rate=1.0,
    noise_scale=0.667,
    noise_scale_duration=0.8,
    **kwargs,
):
    model, tokenizer = preload_models_if_needed(language)
    model.speaking_rate = speaking_rate
    model.noise_scale = noise_scale
    model.noise_scale_duration = noise_scale_duration
    inputs = tokenizer(text=text, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model(**inputs)  # type: ignore
    waveform = outputs.waveform[0].cpu().numpy().squeeze()
    return {
        "audio_out": (model.config.sampling_rate, waveform),
    }


def get_mms_languages():
    with open(os.path.join("./tts_webui/mms/", "mms-languages-iso639-3.txt")) as f:
        for line in f:
            yield (Lang(line[:3]).name + line[3:].strip(), line[:3])


def mms_ui():
    gr.Markdown(
        """
    # MMS
    To use it, simply enter your text, and click "Generate".
    The model will generate speech from the text.
    It uses the [MMS](https://huggingface.co/facebook/mms-tts) model from HuggingFace.

    The MMS-TTS checkpoints are trained on lower-cased, un-punctuated text. By default, the VitsTokenizer normalizes the inputs by removing any casing and punctuation, to avoid passing out-of-vocabulary characters to the model. Hence, the model is agnostic to casing and punctuation, so these should be avoided in the text prompt.

    For certain languages with non-Roman alphabets, such as Arabic, Mandarin or Hindi, the uroman perl package is required to pre-process the text inputs to the Roman alphabet.

    Speaking rate. Larger values give faster synthesised speech.

    Noise scale. How random the speech prediction is. Larger values create more variation in the predicted speech.
    
    Noise scale duration. How random the duration prediction is. Larger values create more variation in the predicted durations.
    """
    )
    with gr.Row():
        with gr.Column():
            mms_input = gr.Textbox(lines=2, label="Input Text")
            mms_generate_button = gr.Button("Generate")

        with gr.Column():
            mms_language = gr.Dropdown(
                choices=list(get_mms_languages()),
                label="Language",
                value="eng",
            )
            speaking_rate = gr.Slider(
                minimum=0.1,
                maximum=10.0,
                step=0.1,
                label="Speaking Rate",
                value=1.0,
            )
            noise_scale = gr.Slider(
                minimum=-2.5,
                maximum=2.5,
                step=0.05,
                label="Noise Scale",
                value=0.667,
            )
            noise_scale_duration = gr.Slider(
                minimum=-1.0,
                maximum=2,
                step=0.05,
                label="Noise Scale Duration",
                value=0.8,
            )

            with gr.Row():
                seed, randomize_seed_callback = randomize_seed_ui()

                unload_model_button("mms")

    audio_out = gr.Audio(label="Output Audio")

    input_dict = {
        mms_input: "text",
        mms_language: "language",
        speaking_rate: "speaking_rate",
        noise_scale: "noise_scale",
        noise_scale_duration: "noise_scale_duration",
        seed: "seed",
    }

    output_dict = {
        "audio_out": audio_out,
        "metadata": gr.JSON(visible=False),
        "folder_root": gr.Textbox(visible=False),
    }

    mms_generate_button.click(
        **randomize_seed_callback,
    ).then(
        **dictionarize(
            fn=generate_audio_with_mms,
            inputs=input_dict,
            outputs=output_dict,
        ),
        api_name="mms",
    )


def mms_tab():
    with gr.Tab(label="MMS"):
        mms_ui()


if __name__ == "__main__":
    if "demo" in locals():
        locals()["demo"].close()
    with gr.Blocks() as demo:
        mms_tab()
    demo.launch(
        server_port=7770,
    )
