import gradio as gr
import torch
import torchaudio

from tts_webui.seamlessM4T.language_code_to_name import (
    text_source_languages,
    speech_target_languages,
    text_source_codes,
    speech_target_codes,
)

from tts_webui.decorators.gradio_dict_decorator import gradio_dict_decorator
from tts_webui.utils.randomize_seed import randomize_seed_ui
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


@manage_model_state("seamless")
def get_model(model_name=""):
    from transformers import AutoProcessor, SeamlessM4Tv2Model

    # todo - add device setting
    return SeamlessM4Tv2Model.from_pretrained(
        model_name
    ), AutoProcessor.from_pretrained(model_name)


@decorator_extension_outer
@decorator_apply_torch_seed
@decorator_save_metadata
@decorator_save_wav
@decorator_add_model_type("seamless")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def seamless_translate(text, src_lang_name, tgt_lang_name, **kwargs):
    model, processor = get_model("facebook/seamless-m4t-v2-large")
    src_lang = text_source_codes[text_source_languages.index(src_lang_name)]
    tgt_lang = speech_target_codes[speech_target_languages.index(tgt_lang_name)]
    text_inputs = processor(text=text, src_lang=src_lang, return_tensors="pt")
    audio_array_from_text = (
        model.generate(**text_inputs, tgt_lang=tgt_lang)[0].cpu().squeeze()
    )
    sample_rate = model.config.sampling_rate

    return {"audio_out": (sample_rate, audio_array_from_text.numpy())}


@decorator_extension_outer
@decorator_apply_torch_seed
@decorator_save_metadata
@decorator_save_wav
@decorator_add_model_type("seamless")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def seamless_translate_audio(audio, tgt_lang_name):
    model, processor = get_model("facebook/seamless-m4t-v2-large")
    # audio, orig_freq = torchaudio.load(audio)
    orig_freq, audio = audio
    sample_rate = model.config.sampling_rate
    audio = torchaudio.functional.resample(
        torch.from_numpy(audio).float(), orig_freq=orig_freq, new_freq=16_000
    )  # must be a 16 kHz waveform array
    tgt_lang = speech_target_codes[speech_target_languages.index(tgt_lang_name)]
    audio_inputs = processor(audios=audio, return_tensors="pt")
    audio_array_from_audio = (
        model.generate(**audio_inputs, tgt_lang=tgt_lang)[0].cpu().squeeze()
    )

    return {"audio_out": (sample_rate, audio_array_from_audio.numpy())}


def seamless_ui():
    gr.Markdown(
        """
    # Seamless Demo
    To use it, simply enter your text, and click "Translate".
    The model will translate the text into the target language, and then synthesize the translated text into speech.
    It uses the [SeamlessM4Tv2Model](https://huggingface.co/facebook/seamless-m4t-v2-large) model from HuggingFace.
    """
    )
    with gr.Row(equal_height=False):
        with gr.Column():
            with gr.Tab(label="Text to Speech"):
                seamless_input = gr.Textbox(lines=2, label="Input Text")
                source_language = gr.Dropdown(
                    choices=text_source_languages,  # type: ignore
                    label="Source Language",
                    value="English",
                    type="value",
                )
                target_language = gr.Dropdown(
                    choices=speech_target_languages,  # type: ignore
                    label="Target Language",
                    value="Mandarin Chinese",
                    type="value",
                )
                button = gr.Button("Translate Text to Speech")
            with gr.Tab(label="Audio to Speech"):
                input_audio = gr.Audio(
                    sources="upload",
                    type="numpy",
                    label="Input Audio",
                )
                target_language_audio = gr.Dropdown(
                    choices=speech_target_languages,  # type: ignore
                    label="Target Language (Not all are supported)",
                    value="Mandarin Chinese",
                    type="value",
                )
                button2 = gr.Button("Translate Audio to Speech")

        with gr.Column():
            audio_out = gr.Audio(label="Output Audio")

            seed, randomize_seed_callback = randomize_seed_ui()
            unload_model_button("seamless")

    input_dict = {
        seamless_input: "text",
        source_language: "src_lang_name",
        target_language: "tgt_lang_name",
        seed: "seed",
    }

    input_dict2 = {
        input_audio: "audio",
        target_language_audio: "tgt_lang_name",
    }

    output_dict = {
        "audio_out": audio_out,
    }

    button.click(
        **randomize_seed_callback,
    ).then(
        fn=gradio_dict_decorator(
            fn=seamless_translate,
            gradio_fn_input_dictionary=input_dict,
            outputs=output_dict,
        ),
        inputs={*input_dict},
        outputs=list(output_dict.values()),
        api_name="seamless",
    )

    button2.click(
        **randomize_seed_callback,
    ).then(
        fn=gradio_dict_decorator(
            fn=seamless_translate_audio,
            gradio_fn_input_dictionary=input_dict2,
            outputs=output_dict,
        ),
        inputs={*input_dict2},
        outputs=list(output_dict.values()),
        api_name="seamless_audio",
    )


def seamless_tab():
    with gr.Tab("Seamless M4Tv2", id="seamless"):
        seamless_ui()


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()  # type: ignore
    with gr.Blocks() as demo:
        seamless_tab()

    demo.launch()
