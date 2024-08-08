import gradio as gr
from transformers import Pipeline, pipeline
import gc
import torch
import os


def extension__tts_generation_webui():
    transcribe_ui()
    return {
        "package_name": "extension_whisper",
        "name": "Whisper",
        "version": "0.0.1",
        "requirements": "git+https://github.com/rsxdalv/extension_whisper@main",
        "description": "Whisper allows transcribing audio files.",
        "extension_type": "interface",
        "extension_class": "tools",
        "author": "rsxdalv",
        "extension_author": "rsxdalv",
        "license": "MIT",
        "website": "https://github.com/rsxdalv/extension_whisper",
        "extension_website": "https://github.com/rsxdalv/extension_whisper",
        "extension_platform_version": "0.0.1",
    }


local_dir = os.path.join("data", "models", "whisper")
local_cache_dir = os.path.join(local_dir, "cache")

pipe = None
last_model_name = None


def unload_models():
    global pipe, last_model_name
    pipe = None
    last_model_name = None
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    return "Unloaded"


def get_pipe(model_name, device="cuda:0") -> Pipeline:
    global pipe, last_model_name
    if pipe is not None:
        if model_name == last_model_name:
            return pipe
    unload_models()
    pipe = pipeline(
        "automatic-speech-recognition",
        model_name,
        torch_dtype=torch.float16,
        model_kwargs={"cache_dir": local_cache_dir},
        device=device,
    )
    last_model_name = model_name
    return pipe


def transcribe(inputs, model_name="openai/whisper-large-v3"):
    if inputs is None:
        raise gr.Error(
            "No audio file submitted! Please record an audio before submitting your request."
        )

    pipe = get_pipe(model_name)

    generate_kwargs = (
        {"task": "transcribe"} if model_name == "openai/whisper-large-v3" else {}
    )

    result = pipe(
        inputs,
        generate_kwargs=generate_kwargs,
        return_timestamps=True,
    )
    return result["text"]


def transcribe_ui():
    gr.Markdown(
        "Transcribe long-form microphone or audio inputs with the click of a button! Demo uses the"
        " checkpoint [openai/whisper-large-v3](https://huggingface.co/openai/whisper-large-v3) and 🤗 Transformers to transcribe audio files"
        " of arbitrary length."
    )

    with gr.Row():
        with gr.Column():
            audio = gr.Audio(
                label="Audio",
                type="filepath",
                sources="upload",
                elem_classes="tts-audio",
            )
            model_dropdown = gr.Dropdown(
                choices=[
                    "openai/whisper-tiny.en",
                    "openai/whisper-small.en",
                    "openai/whisper-medium.en",
                    "openai/whisper-large-v3",
                ],
                label="Model",
                value="openai/whisper-large-v3",
            )
        with gr.Column():
            text = gr.Textbox(label="Transcription", interactive=False)

    with gr.Row():
        unload_models_button = gr.Button("Unload models")

        transcribe_button = gr.Button("Transcribe", variant="primary")

    transcribe_button.click(
        fn=transcribe,
        inputs=[audio, model_dropdown],
        outputs=[text],
        api_name="whisper_transcribe",
    ).then(
        fn=lambda: gr.Button(value="Unload models"),
        outputs=[unload_models_button],
    )

    unload_models_button.click(
        fn=unload_models,
        outputs=[unload_models_button],
        api_name="whisper_unload_models",
    )


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()

    with gr.Blocks() as demo:
        with gr.Tab("Whisper"):
            transcribe_ui()

    demo.queue().launch()
