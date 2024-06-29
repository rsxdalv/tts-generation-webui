import gradio as gr
import torch
import torchaudio
from transformers import AutoProcessor, SeamlessM4Tv2Model

from src.seamlessM4T.language_code_to_name import (
    text_source_languages,
    speech_target_languages,
    text_source_codes,
    speech_target_codes,
)

model = None


def get_model():
    global model
    if not model:
        model = SeamlessM4Tv2Model.from_pretrained("facebook/seamless-m4t-v2-large")
    return model


processor = None


def get_processor():
    global processor
    if not processor:
        processor = AutoProcessor.from_pretrained("facebook/seamless-m4t-v2-large")
    return processor


def seamless_translate(text, src_lang_name, tgt_lang_name):
    model = get_model()
    processor = get_processor()
    src_lang = text_source_codes[text_source_languages.index(src_lang_name)]
    tgt_lang = speech_target_codes[speech_target_languages.index(tgt_lang_name)]
    text_inputs = processor(text=text, src_lang=src_lang, return_tensors="pt")
    audio_array_from_text = (
        model.generate(**text_inputs, tgt_lang=tgt_lang)[0].cpu().squeeze()
    )
    sample_rate = model.config.sampling_rate
    return sample_rate, audio_array_from_text.numpy()


def seamless_translate_audio(audio, tgt_lang_name):
    model = get_model()
    processor = get_processor()
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
    return sample_rate, audio_array_from_audio.numpy()
    # return audio_array_from_audio.numpy()


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
                # seamless_input = Joutai.singleton.seamless_input
                # seamless_input.render()
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
                    source="upload",
                    type="numpy",
                    label="Input Audio",
                    elem_classes="tts-audio",
                )
                target_language_audio = gr.Dropdown(
                    choices=speech_target_languages,  # type: ignore
                    label="Target Language (Not all are supported)",
                    value="Mandarin Chinese",
                    type="value",
                )
                button2 = gr.Button("Translate Audio to Speech")

        with gr.Column():
            # seamless_output = Joutai.singleton.seamless_output
            # seamless_output.render()
            seamless_output = gr.Audio(label="Output Audio")
    button.click(
        inputs=[
            seamless_input,
            source_language,
            target_language,
        ],
        outputs=seamless_output,
        fn=seamless_translate,
        api_name="seamless",
    )

    button2.click(
        inputs=[
            input_audio,
            target_language_audio,
        ],
        outputs=seamless_output,
        fn=seamless_translate_audio,
        api_name="seamless_audio",
    )


def seamless_tab():
    with gr.Tab("Seamless M4Tv2 Demo", id="seamless"):
        seamless_ui()
