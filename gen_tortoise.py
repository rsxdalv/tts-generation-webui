import datetime
import os
from create_base_filename import create_base_filename

from src.get_date import get_date
from src.save_waveform_plot import save_waveform_plot

import torchaudio

from models.tortoise.tortoise.api import TextToSpeech, MODELS_DIR
from models.tortoise.tortoise.utils.audio import load_voices

SAMPLE_RATE = 24_000
OUTPUT_PATH='outputs/'

def generate_tortoise(text="The expressiveness of autoregressive transformers is literally nuts! I absolutely adore them.",
                      voice='random',
                      preset='fast',
                      model_dir=MODELS_DIR,
                      candidates=3,
                      seed=None,
                      cvvp_amount=.0):

    os.makedirs(OUTPUT_PATH, exist_ok=True)

    tts = TextToSpeech(models_dir=model_dir)

    filenames = []
    voice_sel = voice.split('&') if '&' in voice else [voice]
    voice_samples, conditioning_latents = load_voices(voice_sel)

    gen, state = tts.tts_with_preset(text,
                                     k=candidates,
                                     voice_samples=voice_samples,
                                     conditioning_latents=conditioning_latents,
                                     preset=preset,
                                     use_deterministic_seed=seed,
                                     return_deterministic_state=True,
                                     cvvp_amount=cvvp_amount)

    seed, _, _, _ = state

    if isinstance(gen, list):
        for j, g in enumerate(gen):
            process_gen(text, voice, preset, candidates, seed, cvvp_amount, filenames, g, j)
    else:
        process_gen(text, voice, preset, candidates, seed, cvvp_amount, filenames, gen)
    return filenames

def process_gen(text, voice, preset, candidates, seed, cvvp_amount, filenames, gen, j = 0):
    audio_tensor = gen.squeeze(0).cpu()

    model = "tortoise"
    date = get_date()

    base_filename = f"{create_base_filename(voice, OUTPUT_PATH, model, date)}__n{j}"
    filename = f'{base_filename}.wav'
    torchaudio.save(filename, audio_tensor, SAMPLE_RATE)
    audio_array = audio_tensor.t().numpy()
    filename_png = f'{base_filename}.png'
    save_waveform_plot(audio_array, filename_png)

    filename_json = f'{base_filename}.json'

    metadata = {
            "text": text,
            "voice": voice,
            "preset": preset,
            "candidates": candidates,
            "seed": seed,
            "cvvp_amount": cvvp_amount,
            "filename": filename,
            "filename_png": filename_png,
            "filename_json": filename_json,
        }
    import json
    with open(filename_json, 'w') as f:
        json.dump(metadata, f)

    filenames.extend((filename, filename_png))

def generate_tortoise_n(n):
    def gen(prompt, voice="random", preset="ultra_fast", seed=None, cvvp_amount=.0):
        return generate_tortoise(text=prompt,
                        voice=voice,
                        preset=preset,
                        candidates=n,
                        seed=seed if seed != "None" else None,
                        cvvp_amount=cvvp_amount,
                        )
    return gen
