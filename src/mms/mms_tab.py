import os
from iso639 import Lang
import torch
from transformers import VitsTokenizer, VitsModel, set_seed
import gradio as gr

model: VitsModel = None  # type: ignore
tokenizer: VitsTokenizer = None  # type: ignore
last_language = None


def preload_models_if_needed(language="eng"):
    global model, tokenizer, last_language
    if language != last_language:
        model = None  # type: ignore
        tokenizer = None  # type: ignore
        last_language = language
    if model is None:
        model = VitsModel.from_pretrained(f"facebook/mms-tts-{language}")  # type: ignore
        tokenizer = VitsTokenizer.from_pretrained(f"facebook/mms-tts-{language}")

    return model, tokenizer


def generate_audio_with_mms(
    text,
    language="eng",
    speaking_rate=1.0,
    noise_scale=0.667,
    noise_scale_duration=0.8,
    seed=None,
):
    if seed is not None:
        set_seed(seed)
    model, tokenizer = preload_models_if_needed(language)
    model.speaking_rate = speaking_rate
    model.noise_scale = noise_scale
    model.noise_scale_duration = noise_scale_duration
    inputs = tokenizer(text=text, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)  # type: ignore
    waveform = outputs.waveform[0].numpy().squeeze()
    return (model.config.sampling_rate, waveform)  # type: ignore


def get_mms_languages():
    with open(os.path.join("./src/mms/", "mms-languages-iso639-3.txt")) as f:
        for line in f:
            yield (Lang(line[:3]).name + line[3:].strip(), line[:3])


def mms_ui():
    gr.Markdown(
        """
    # MMS Demo
    To use it, simply enter your text, and click "Generate".
    The model will generate speech from the text.
    It uses the [MMS](https://huggingface.co/facebook/mms-tts) model from HuggingFace.

    The MMS-TTS checkpoints are trained on lower-cased, un-punctuated text. By default, the VitsTokenizer normalizes the inputs by removing any casing and punctuation, to avoid passing out-of-vocabulary characters to the model. Hence, the model is agnostic to casing and punctuation, so these should be avoided in the text prompt.

    For certain languages with non-Roman alphabets, such as Arabic, Mandarin or Hindi, the uroman perl package is required to pre-process the text inputs to the Roman alphabet.

    Speaking rate. Larger values give faster synthesised speech.

    How random the speech prediction is. Larger values create more variation in the predicted speech.
    
    How random the duration prediction is. Larger values create more variation in the predicted durations.
    """
    )
    mms_input = gr.Textbox(lines=2, label="Input Text")
    with gr.Row():
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

    mms_generate_button = gr.Button("Generate")

    mms_output = gr.Audio(label="Output Audio")

    mms_generate_button.click(
        fn=generate_audio_with_mms,
        inputs=[
            mms_input,
            mms_language,
            speaking_rate,
            noise_scale,
            noise_scale_duration,
        ],
        outputs=[mms_output],
        api_name="mms",
    )


def mms_tab():
    with gr.Tab(label="MMS Demo"):
        mms_ui()


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()
    with gr.Blocks() as demo:
        mms_tab()
    demo.launch()
