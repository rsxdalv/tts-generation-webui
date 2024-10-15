import os
import numpy as np
import gradio as gr
from scipy.io.wavfile import write as write_wav

from tts_webui.tortoise.save_json import save_json
from tts_webui.bark.split_text_functions import split_by_lines
from tts_webui.utils.create_base_filename import create_base_filename
from tts_webui.utils.date import get_date_string
from tts_webui.utils.save_waveform_plot import middleware_save_waveform_plot
from tts_webui.tortoise.TortoiseParameters import TortoiseParameters
from tts_webui.utils.get_path_from_root import get_path_from_root
from tts_webui.utils.torch_clear_memory import torch_clear_memory


SAMPLE_RATE = 24_000
OUTPUT_PATH = "outputs/"

MODEL = None
TORTOISE_VOICE_DIR = "voices-tortoise"

TORTOISE_VOICE_DIR_ABS = get_path_from_root("voices-tortoise")
TORTOISE_LOCAL_MODELS_DIR = get_path_from_root("data", "models", "tortoise")


class TortoiseOutputUpdate:
    def __init__(
        self,
        audio,
        bundle_name,
        params,
    ):
        self.audio = audio
        self.bundle_name = bundle_name
        self.params = params


def get_model_list():
    try:
        return ["Default"] + [
            x for x in os.listdir(TORTOISE_LOCAL_MODELS_DIR) if x != ".gitkeep"
        ]
    except FileNotFoundError as e:
        print(e)
        return ["Default"]


def get_full_model_dir(model_dir: str):
    return os.path.join(TORTOISE_LOCAL_MODELS_DIR, model_dir)


def switch_model(
    model_dir: str,
    kv_cache=False,
    use_deepspeed=False,
    half=False,
    tokenizer=None,
    use_basic_cleaners=False,
):
    from tortoise.api import MODELS_DIR

    get_tts(
        models_dir=(
            MODELS_DIR if model_dir == "Default" else get_full_model_dir(model_dir)
        ),
        force_reload=True,
        kv_cache=kv_cache,
        use_deepspeed=use_deepspeed,
        half=half,
        tokenizer_path=tokenizer.name if tokenizer else None,
        tokenizer_basic=use_basic_cleaners,
    )
    return gr.Dropdown()


def get_voice_list():
    from tortoise.utils.audio import get_voices

    return ["random"] + list(get_voices(extra_voice_dirs=[TORTOISE_VOICE_DIR]))


def save_wav_tortoise(audio_array, filename):
    write_wav(filename, SAMPLE_RATE, audio_array)


def unload_tortoise_model():
    global MODEL
    if MODEL is not None:
        del MODEL
        torch_clear_memory()
        MODEL = None


def get_tts(
    models_dir=None,
    force_reload=False,
    kv_cache=False,
    use_deepspeed=False,
    half=False,
    device=None,
    tokenizer_path=None,
    tokenizer_basic=False,
):
    from tortoise.api import MODELS_DIR, TextToSpeech

    if models_dir is None:
        models_dir = MODELS_DIR
    global MODEL
    if MODEL is None or force_reload:
        print("Loading tortoise model: ", models_dir)
        print("Clearing memory...")
        unload_tortoise_model()
        print("Memory cleared")
        print("Loading model...")
        MODEL = TextToSpeech(
            models_dir=models_dir,
            kv_cache=kv_cache,
            use_deepspeed=use_deepspeed,
            half=half,
            device=device,
            tokenizer_vocab_file=tokenizer_path,
            tokenizer_basic=tokenizer_basic,
        )
        print("Model loaded")
    return MODEL


last_voices = None
voice_samples = None
conditioning_latents = None


def get_voices_cached(voice):
    from tortoise.utils.audio import load_voices

    global last_voices, voice_samples, conditioning_latents

    if voice == last_voices:
        last_voices = voice
        return voice_samples, conditioning_latents

    voices = voice.split("&") if "&" in voice else [voice]

    voice_samples, conditioning_latents = load_voices(
        voices, extra_voice_dirs=[TORTOISE_VOICE_DIR]
    )
    last_voices = voices
    return voice_samples, conditioning_latents


def generate_tortoise(
    params: TortoiseParameters,
    text: str,
    candidates: int,
):
    os.makedirs(OUTPUT_PATH, exist_ok=True)

    voice_samples, conditioning_latents = get_voices_cached(params.voice)

    tts = get_tts()
    result, state = tts.tts_with_preset(
        text,
        return_deterministic_state=True,
        k=candidates,
        voice_samples=voice_samples,
        conditioning_latents=conditioning_latents,
        use_deterministic_seed=get_seed(params),
        **{
            k: v
            for k, v in params.to_dict().items()
            if k not in ["text", "voice", "split_prompt", "seed", "model", "name"]
        },
    )

    seed, _, _, _ = state
    params.seed = seed  # type: ignore

    gen_list = result if isinstance(result, list) else [result]
    audio_arrays = [tensor_to_audio_array(x) for x in gen_list]
    return [
        _process_gen(candidates, audio_array, id, params)
        for id, audio_array in enumerate(audio_arrays)
    ]


def get_seed(params):
    return params.seed if params.seed != -1 else None


def _process_gen(candidates, audio_array, id, params: TortoiseParameters):
    model = "tortoise"
    date = get_date_string()

    name = params.name or params.voice
    filename, filename_png, filename_json = get_filenames(
        create_base_filename_tortoise(name, id, model, date)
    )
    save_wav_tortoise(audio_array, filename)
    middleware_save_waveform_plot(audio_array, filename_png)

    metadata = {
        "_version": "0.0.1",
        "_type": model,
        "date": date,
        "candidates": candidates,
        "index": id if isinstance(id, int) else 0,
        **params.to_metadata(),
    }

    save_json(filename_json, metadata)

    folder_root = os.path.dirname(filename)

    return TortoiseOutputUpdate(
        audio=(SAMPLE_RATE, audio_array),
        bundle_name=folder_root,
        params=gr.JSON(value=metadata),  # broken because gradio returns only __type__
    )


def create_base_filename_tortoise(name, j, model, date):
    return f"{create_base_filename(f'{name}__n{j}', OUTPUT_PATH, model, date)}"


def tensor_to_audio_array(gen):
    return gen.squeeze(0).cpu().t().numpy()


def get_filenames(base_filename):
    filename = f"{base_filename}.wav"
    filename_png = f"{base_filename}.png"
    filename_json = f"{base_filename}.json"
    return filename, filename_png, filename_json


def generate_tortoise_long(count: int, params: TortoiseParameters):
    print("Generating tortoise with params:")
    print(params)
    prompt_raw = params.text
    split_prompt = params.split_prompt

    prompts = split_by_lines(prompt_raw) if split_prompt else [prompt_raw]
    audio_pieces = [[] for _ in range(count)]

    for prompt in prompts:
        datas = generate_tortoise(
            params,
            text=prompt,
            candidates=count,
        )
        for data in datas:
            yield [data.audio, data.bundle_name, data.params]

        for i in range(count):
            audio_array = datas[i].audio[1]
            audio_pieces[i].append(audio_array)

    # if there is only one prompt, then we don't need to concatenate
    if len(prompts) == 1:
        # return [None, None, None]
        return {}

    for i in range(count):
        res = _process_gen(
            count, np.concatenate(audio_pieces[i]), id=f"_long_{str(i)}", params=params
        )
        yield [res.audio, res.bundle_name, res.params]

    # return [None, None, None]
    return {}
