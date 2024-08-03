# %%

# Made for tts-generation-webui

# Adapted from Hugginface Demo by 🤗 Sylvain Filoni

# Copyright 2022 Hayk Martiros and Seth Forsgren

# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
# associated documentation files (the "Software"), to deal in the Software without restriction,
# including without limitation the rights to use, copy, modify, merge, publish, distribute,
# sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all copies or substantial
# portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
# NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
# OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


import gradio as gr
import torch

from PIL import Image
import numpy as np

# from spectro import wav_bytes_from_spectrogram_image
# from spectro2 import convert as spectro_from_wav
# from extension_riffusion.spectro import wav_bytes_from_spectrogram_image
# from extension_riffusion.spectro2 import convert as spectro_from_wav
from extensions.builtin.extension_riffusion.spectro import (
    wav_bytes_from_spectrogram_image,
)
from extensions.builtin.extension_riffusion.spectro2 import convert as spectro_from_wav

from diffusers import StableDiffusionPipeline
from diffusers import StableDiffusionImg2ImgPipeline


def extension__tts_generation_webui():
    riffusion_ui()
    return {
        "package_name": "extension_riffusion",
        "name": "Riffusion",
        "version": "0.0.1",
        "requirements": "git+https://github.com/rsxdalv/extension_riffusion@main",
        "description": "Riffusion allows generating music from text.",
        "extension_type": "interface",
        "extension_class": "audio-music-generation",
        "author": "rsxdalv",
        "extension_author": "rsxdalv",
        "license": "MIT",
        "website": "https://github.com/rsxdalv/extension_riffusion",
        "extension_website": "https://github.com/rsxdalv/extension_riffusion",
        "extension_platform_version": "0.0.1",
    }


MODEL_ID = "riffusion/riffusion-model-v1"

_pipe = None
_pipe2 = None
_last_model_id = None


def unload_models():
    import gc

    global _pipe, _pipe2, _last_model_id
    _pipe = None
    _pipe2 = None
    _last_model_id = None
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    return "Unloaded"


def get_pipe(model_id, device="cuda:0"):
    global _pipe, _last_model_id
    if _pipe is not None:
        if model_id == _last_model_id:
            _pipe = _pipe.to(device)
            return _pipe
    unload_models()
    _pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
    _pipe = _pipe.to(device)
    _last_model_id = model_id
    return _pipe


def get_pipe2(model_id, device="cuda:0"):
    global _pipe2, _last_model_id
    if _pipe2 is not None:
        if model_id == _last_model_id:
            _pipe2 = _pipe2.to(device)
            return _pipe2

    unload_models()
    _pipe2 = StableDiffusionImg2ImgPipeline.from_pretrained(
        model_id, torch_dtype=torch.float16
    )
    _pipe2 = _pipe2.to(device)
    _last_model_id = model_id
    return _pipe2


def predict(prompt, negative_prompt, audio_input, duration, device):
    if audio_input == None:
        return classic(prompt, negative_prompt, duration, device)
    else:
        return style_transfer(prompt, negative_prompt, audio_input, device)


def classic(prompt, negative_prompt, duration, device):
    if duration == 5:
        width_duration = 512
    else:
        width_duration = 512 + ((int(duration) - 5) * 128)
    pipe = get_pipe(MODEL_ID, device)
    spec = pipe(
        prompt, negative_prompt=negative_prompt, height=512, width=width_duration
    ).images[0]
    print(spec)
    wav = wav_bytes_from_spectrogram_image(spec)
    with open("output.wav", "wb") as f:
        f.write(wav[0].getbuffer())
    return spec, "output.wav"


def style_transfer(prompt, negative_prompt, audio_input, device):
    spec = spectro_from_wav(audio_input)
    print(spec)
    # Open the image
    im = Image.open(spec)

    # Open the image
    im = image_from_spectrogram(im, 1)

    pipe2 = get_pipe2(MODEL_ID, device)
    new_spectro = pipe2(prompt=prompt, image=im, strength=0.5, guidance_scale=7).images
    wav = wav_bytes_from_spectrogram_image(new_spectro[0])
    with open("output.wav", "wb") as f:
        f.write(wav[0].getbuffer())
    return new_spectro[0], "output.wav"


def image_from_spectrogram(
    spectrogram: np.ndarray, max_volume: float = 50, power_for_image: float = 0.25
) -> Image.Image:
    """
    Compute a spectrogram image from a spectrogram magnitude array.
    """
    # Apply the power curve
    data = np.power(spectrogram, power_for_image)

    # Rescale to 0-255
    data = data * 255 / max_volume

    # Invert
    data = 255 - data

    # Convert to a PIL image
    image = Image.fromarray(data.astype(np.uint8))

    # Flip Y
    image = image.transpose(Image.FLIP_TOP_BOTTOM)

    # Convert to RGB
    image = image.convert("RGB")

    return image


title = """
    <div style="text-align: center; max-width: 500px; margin: 0 auto;">
        <div
        style="
            display: inline-flex;
            align-items: center;
            gap: 0.8rem;
            font-size: 1.75rem;
            margin-bottom: 10px;
            line-height: 1em;
        "
        >
        <h1 style="font-weight: 600; margin-bottom: 7px;">
            Riffusion real-time music generation
        </h1>
        </div>
        <p style="margin-bottom: 10px;font-size: 94%;font-weight: 100;line-height: 1.5em;">
        Describe a musical prompt, generate music by getting a spectrogram image & sound.
        </p>
    </div>
"""

article = """
    <p style="font-size: 0.8em;line-height: 1.2em;border: 1px solid #374151;border-radius: 8px;padding: 20px;">
    About the model: Riffusion is a latent text-to-image diffusion model capable of generating spectrogram images given any text input. These spectrograms can be converted into audio clips.
    <br />—
    <br />The Riffusion model was created by fine-tuning the Stable-Diffusion-v1-5 checkpoint.
    <br />—
    <br />The model is intended for research purposes only. Possible research areas and tasks include 
    generation of artworks, audio, and use in creative processes, applications in educational or creative tools, research on generative models.
    </p>
    
    <div class="footer">
        <p>
        <a href="https://huggingface.co/riffusion/riffusion-model-v1" target="_blank">Riffusion model</a> by Seth Forsgren and Hayk Martiros - 
        Demo by 🤗 <a href="https://twitter.com/fffiloni" target="_blank">Sylvain Filoni</a>
        </p>
    </div>
"""


def riffusion_ui():
    with gr.Column(elem_id="col-container"):

        gr.HTML(title)

        prompt_input = gr.Textbox(
            placeholder="a cat diva singing in a New York jazz club",
            label="Musical prompt",
            elem_id="prompt-in",
        )
        # audio_input = gr.Audio(sources=["upload"], type="filepath", visible=False)
        audio_input = gr.Audio(type="filepath", visible=False)
        with gr.Row():
            negative_prompt = gr.Textbox(label="Negative prompt")
            duration_input = gr.Slider(
                label="Duration in seconds",
                minimum=5,
                maximum=10,
                step=1,
                value=8,
                elem_id="duration-slider",
            )
            device_input = gr.Dropdown(
                label="Device",
                choices=["cuda:0", "cpu", "mps"],
                value="cuda:0",
            )

        send_btn = gr.Button(value="Get a new spectrogram ! ", elem_id="submit-btn")

        with gr.Column(elem_id="col-container-2"):

            spectrogram_output = gr.Image(
                label="spectrogram image result", elem_id="img-out"
            )
            sound_output = gr.Audio(
                type="filepath", label="spectrogram sound", elem_id="music-out"
            )

            gr.HTML(article)

        send_btn.click(
            predict,
            inputs=[
                prompt_input,
                negative_prompt,
                audio_input,
                duration_input,
                device_input,
            ],
            outputs=[spectrogram_output, sound_output],
        )

        unload_models_button = gr.Button("Unload models")

        unload_models_button.click(
            fn=unload_models,
        )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        riffusion_ui()

    demo.queue(max_size=250).launch(debug=True)

# %%
