import datetime
import os
from src.utils.create_base_filename import create_base_filename

from src.utils.date import get_date_string
from src.utils.save_waveform_plot import save_waveform_plot

import torchaudio

from models.tortoise.tortoise.api import TextToSpeech, MODELS_DIR
from models.tortoise.tortoise.utils.audio import load_voices
import gradio as gr

SAMPLE_RATE = 24_000
OUTPUT_PATH = "outputs/"

MODEL = None


def get_tts():
    global MODEL
    if MODEL is None:
        MODEL = TextToSpeech(models_dir=MODELS_DIR)
    return MODEL


def generate_tortoise(
    text="The expressiveness of autoregressive transformers is literally nuts! I absolutely adore them.",
    voice="random",
    preset="fast",
    candidates=3,
    seed=None,
    cvvp_amount=0.0,
):
    os.makedirs(OUTPUT_PATH, exist_ok=True)

    datas = []
    voice_sel = voice.split("&") if "&" in voice else [voice]
    voice_samples, conditioning_latents = load_voices(voice_sel)

    if seed == -1:
        seed = None

    tts = get_tts()
    gen, state = tts.tts_with_preset(
        text,
        k=candidates,
        voice_samples=voice_samples,
        conditioning_latents=conditioning_latents,
        preset=preset,
        use_deterministic_seed=seed,
        return_deterministic_state=True,
        cvvp_amount=cvvp_amount,
    )

    seed, _, _, _ = state

    if isinstance(gen, list):
        for j, g in enumerate(gen):
            process_gen(text, voice, preset, candidates, seed, cvvp_amount, datas, g, j)
    else:
        process_gen(text, voice, preset, candidates, seed, cvvp_amount, datas, gen)
    return datas


def process_gen(
    text, voice, preset, candidates, seed, cvvp_amount, datas, gen, j=0
):
    audio_tensor = gen.squeeze(0).cpu()

    model = "tortoise"
    date = get_date_string()

    base_filename = (
        f"{create_base_filename(f'{voice}__n{j}', OUTPUT_PATH, model, date)}"
    )
    filename = f"{base_filename}.wav"
    torchaudio.save(filename, audio_tensor, SAMPLE_RATE)
    audio_array = audio_tensor.t().numpy()
    filename_png = f"{base_filename}.png"
    save_waveform_plot(audio_array, filename_png)

    filename_json = f"{base_filename}.json"

    metadata = {
        "_version": "0.0.1",
        "_type": model,
        "date": date,
        "text": text,
        "voice": voice,
        "preset": preset,
        "candidates": candidates,
        "seed": str(seed),
        "cvvp_amount": cvvp_amount,
    }
    import json

    with open(filename_json, "w") as f:
        json.dump(metadata, f)

    history_bundle_name_data = os.path.dirname(filename)

    datas.extend(
        (
            filename,
            filename_png,
            gr.Button.update(value="Save to favorites", visible=True),
            seed,
            history_bundle_name_data,
        )
    )


def generate_tortoise_n(n):
    def gen(prompt, voice="random", preset="ultra_fast", seed=None, cvvp_amount=0.0):
        return generate_tortoise(
            text=prompt,
            voice=voice,
            preset=preset,
            candidates=n,
            seed=seed if seed != "None" else None,
            cvvp_amount=cvvp_amount,
        )

    return gen
