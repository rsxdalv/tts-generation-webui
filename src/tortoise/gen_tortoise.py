import os
from src.bark.split_text_functions import split_by_lines
import numpy as np
from src.utils.create_base_filename import create_base_filename
from src.utils.date import get_date_string
from src.utils.save_waveform_plot import save_waveform_plot
from models.tortoise.tortoise.api import TextToSpeech, MODELS_DIR
from models.tortoise.tortoise.utils.audio import load_voices
import gradio as gr
from src.tortoise.TortoiseOutputRow import TortoiseOutputRow, TortoiseOutputUpdate
from src.tortoise.save_json import save_json
from scipy.io.wavfile import write as write_wav


SAMPLE_RATE = 24_000
OUTPUT_PATH = "outputs/"

MODEL = None


def save_wav_tortoise(audio_array, filename):
    write_wav(filename, SAMPLE_RATE, audio_array)


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

    voice_sel = voice.split("&") if "&" in voice else [voice]
    voice_samples, conditioning_latents = load_voices(voice_sel)

    if seed == -1:
        seed = None

    tts = get_tts()
    result, state = tts.tts_with_preset(
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

    gen_list = result if isinstance(result, list) else [result]
    audio_arrays = [tensor_to_audio_array(x) for x in gen_list]
    return [
        _process_gen(text, voice, preset, candidates, seed, cvvp_amount, audio_array, j)
        for j, audio_array in enumerate(audio_arrays)
    ]


def _process_gen(text, voice, preset, candidates, seed, cvvp_amount, audio_array, j):
    model = "tortoise"
    date = get_date_string()

    filename, filename_png, filename_json = get_filenames(
        create_base_filename_tortoise(voice, j, model, date)
    )
    save_wav_tortoise(audio_array, filename)
    save_waveform_plot(audio_array, filename_png)

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

    save_json(filename_json, metadata)

    history_bundle_name_data = os.path.dirname(filename)

    return TortoiseOutputUpdate(
        audio=(SAMPLE_RATE, audio_array),
        image=filename_png,
        save_button=gr.Button.update(value="Save to favorites", visible=True),
        seed=seed,
        bundle_name=history_bundle_name_data,
    )


def create_base_filename_tortoise(voice, j, model, date):
    return f"{create_base_filename(f'{voice}__n{j}', OUTPUT_PATH, model, date)}"


def tensor_to_audio_array(gen):
    return gen.squeeze(0).cpu().t().numpy()


def get_filenames(base_filename):
    filename = f"{base_filename}.wav"
    filename_png = f"{base_filename}.png"
    filename_json = f"{base_filename}.json"
    return filename, filename_png, filename_json


def generate_tortoise_long(outs: list[TortoiseOutputRow], count: int):
    def gen(
            prompt_raw,
            voice="random",
            preset="ultra_fast",
            seed=None,
            cvvp_amount=0.0,
            split_prompt=False,
        ):
        prompts = split_by_lines(prompt_raw) if split_prompt else [prompt_raw]
        audio_pieces = [[] for _ in range(count)]

        for prompt in prompts:
            datas = generate_tortoise(
                text=prompt,
                voice=voice,
                preset=preset,
                seed=seed,
                cvvp_amount=cvvp_amount,
                candidates=count,
            )
            for i, data in enumerate(datas):
                yield {
                    outs[i].audio: data.audio,
                    outs[i].image: data.image,
                    outs[i].save_button: data.save_button,
                    outs[i].seed: data.seed,
                    outs[i].bundle_name: data.bundle_name,
                }

            for i in range(count):
                audio_array = datas[i].audio[1]
                audio_pieces[i].append(audio_array)

        # if there is only one prompt, then we don't need to concatenate
        if len(prompts) == 1:
            return {}

        for i in range(count):
            res = _process_gen(
                prompt_raw,
                voice,
                preset,
                count,
                seed,
                cvvp_amount,
                np.concatenate(audio_pieces[i]),
                j=f"_long_{str(i)}",
            )
            yield {
                outs[i].audio: res.audio,
                outs[i].image: res.image,
                outs[i].save_button: res.save_button,
                outs[i].seed: res.seed,
                outs[i].bundle_name: res.bundle_name,
            }

        return {}

    return gen
