import datetime
import os

from matplotlib import pyplot as plt

import torchaudio

from models.tortoise.tortoise.api import TextToSpeech, MODELS_DIR
from models.tortoise.tortoise.utils.audio import load_voices

SAMPLE_RATE = 24_000

def generate_tortoise(text="The expressiveness of autoregressive transformers is literally nuts! I absolutely adore them.", 
                      voice='random', 
                      preset='fast', 
                      output_path='results/', 
                      model_dir=MODELS_DIR, 
                      candidates=3, 
                      seed=None, 
                      cvvp_amount=.0):
    
    os.makedirs(output_path, exist_ok=True)

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
            filename = os.path.join(output_path, f'{voice}_{j}.wav')
            torchaudio.save(filename, g.squeeze(0).cpu(), SAMPLE_RATE)
            filenames.append(filename)
    else:
        audio_tensor = gen.squeeze(0).cpu()

        # get current date for file
        now = datetime.datetime.now()
        date = now.strftime("%Y-%m-%d_%H-%M-%S")

        model = "tortoise"
        base_filename = os.path.join(output_path, f"audio__{model}__{voice}__{date}")
        filename = f'{base_filename}.wav'
        torchaudio.save(filename, audio_tensor, SAMPLE_RATE)
        audio_array = audio_tensor.t().numpy()
        # Plot the waveform using matplotlib
        plt.figure(figsize=(10, 3))
        plt.style.use('dark_background')
        plt.plot(audio_array, color='orange')
        plt.axis("off")
        filename_png = f'{base_filename}.png'
        plt.savefig(filename_png)

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
    return filenames

def generate_tortoise_(prompt):
    return generate_tortoise(text=prompt,
                      voice="random",
                      output_path="outputs/",
                      preset="ultra_fast",
                      candidates=1,
                      cvvp_amount=.0)
