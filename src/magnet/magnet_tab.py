import torch
import gradio as gr
from typing import List, Optional, TypedDict, Literal
import numpy as np
import os
from src.magnet.utils import Seed, Timer
from src.bark.npz_tools import save_npz_musicgen
from src.musicgen.setup_seed_ui_musicgen import setup_seed_ui_musicgen
from src.bark.parse_or_set_seed import parse_or_generate_seed
from src.musicgen.audio_array_to_sha256 import audio_array_to_sha256

from src.extensions_loader.ext_callback_save_generation import (
    ext_callback_save_generation_musicgen,
)
from src.utils.create_base_filename import create_base_filename
from src.history_tab.save_to_favorites import save_to_favorites
from src.bark.get_filenames import get_filenames
from src.utils.date import get_date_string
from scipy.io.wavfile import write as write_wav
from src.utils.save_waveform_plot import save_waveform_plot

import json
from importlib.metadata import version
from audiocraft.models.magnet import MAGNeT

from src.utils.get_path_from_root import get_path_from_root
from src.tortoise.gr_reload_button import gr_open_button_simple, gr_reload_button

AUDIOCRAFT_VERSION = version("audiocraft")


class MagnetGenerationParams(TypedDict):
    use_sampling: bool
    top_k: int
    top_p: float
    temperature: float
    max_cfg_coef: float
    min_cfg_coef: float
    decoding_steps: List[int]
    span_arrangement: Literal["nonoverlap", "stride1"]


class MagnetParams(MagnetGenerationParams):
    model: str
    text: str
    seed: int


def just_generation(full_params_instance):
    return MagnetGenerationParams(
        **{
            key: value
            for key, value in full_params_instance.items()
            if key not in ["text", "seed", "model"]
        }
    )


MODEL = None


def get_model(model):
    def load_model(repo_or_local):
        path = (
            get_full_model_dir(repo_or_local)
            if not "facebook" in repo_or_local
            else repo_or_local
        )
        print("Loading model from", path)
        return MAGNeT.get_pretrained(path)

    global MODEL
    if MODEL is None or MODEL.name != model:
        MODEL = load_model(model)
    return MODEL


def generate_and_save_metadata(
    prompt: str,
    date: str,
    filename_json: str,
    params: MagnetParams,
    audio_array: np.ndarray,
):
    metadata = {
        "_version": "0.0.1",
        "_hash_version": "0.0.3",
        "_type": "magnet",
        "_audiocraft_version": AUDIOCRAFT_VERSION,
        "models": {},
        "prompt": prompt,
        "hash": audio_array_to_sha256(audio_array),
        "date": date,
        **params,
        "seed": str(params["seed"]),
    }
    with open(filename_json, "w") as outfile:
        json.dump(metadata, outfile, indent=2)

    return metadata


def save_generation(
    audio_array: np.ndarray,
    SAMPLE_RATE: int,
    params: MagnetParams,
    tokens: Optional[torch.Tensor] = None,
):
    prompt = params["text"]
    date = get_date_string()
    title = prompt[:20].replace(" ", "_")
    base_filename = create_base_filename(title, "outputs", model="musicgen", date=date)

    filename, filename_png, filename_json, filename_npz = get_filenames(base_filename)
    stereo = audio_array.shape[0] == 2
    if stereo:
        audio_array = np.transpose(audio_array)
    write_wav(filename, SAMPLE_RATE, audio_array)
    plot = save_waveform_plot(audio_array, filename_png)

    metadata = generate_and_save_metadata(
        prompt=prompt,
        date=date,
        filename_json=filename_json,
        params=params,
        audio_array=audio_array,
    )
    if tokens is not None:
        save_npz_musicgen(filename_npz, tokens, metadata)

    filename_ogg = filename.replace(".wav", ".ogg")
    ext_callback_save_generation_musicgen(
        audio_array=audio_array,
        files={
            "wav": filename,
            "png": filename_png,
            "ogg": filename_ogg,
        },
        metadata=metadata,
        SAMPLE_RATE=SAMPLE_RATE,
    )

    return filename, plot, metadata


def log_generation_musicgen(
    params: MagnetParams,
):
    print("Generating: '''", params["text"], "'''")
    print("Parameters:")
    for key, value in params.items():
        print(key, ":", value)


def generate(
    model: str,
    text: str,
    seed: int,
    use_sampling: bool,
    top_k: int,
    top_p: float,
    temperature: float,
    max_cfg_coef: float,
    min_cfg_coef: float,
    decoding_step_1: int,
    decoding_step_2: int,
    decoding_step_3: int,
    decoding_step_4: int,
    span_arrangement: Literal["nonoverlap", "stride1"],
):
    MODEL = get_model(model)

    seed2 = parse_or_generate_seed(seed, 0)

    params = MagnetParams(
        model=model,
        text=text,
        seed=seed2,
        use_sampling=use_sampling,
        top_k=top_k,
        top_p=top_p,
        temperature=temperature,
        max_cfg_coef=max_cfg_coef,
        min_cfg_coef=min_cfg_coef,
        decoding_steps=[
            decoding_step_1,
            decoding_step_2,
            decoding_step_3,
            decoding_step_4,
        ],
        span_arrangement=span_arrangement,
    )

    MODEL.set_generation_params(
        **just_generation(params),
    )

    tokens = None

    with Timer(), Seed(seed2):
        log_generation_musicgen(params)
        output, tokens = MODEL.generate(
            descriptions=[text],
            progress=True,
            return_tokens=True,
        )

    output = output.detach().cpu().numpy().squeeze()

    filename, plot, _metadata = save_generation(
        audio_array=output,
        SAMPLE_RATE=MODEL.sample_rate,
        params=params,
        tokens=tokens,
    )

    return [
        (MODEL.sample_rate, output.transpose()),
        os.path.dirname(filename),
        plot,
        params["seed"],
        _metadata,
    ]


MAGNET_LOCAL_MODELS_DIR = get_path_from_root("data", "models", "magnet")


def get_model_list():
    try:
        return [x for x in os.listdir(MAGNET_LOCAL_MODELS_DIR) if x != ".gitkeep"]
    except FileNotFoundError as e:
        print(e)
        return []


def get_full_model_dir(model_dir: str):
    return os.path.join(MAGNET_LOCAL_MODELS_DIR, model_dir)


def get_models():
    custom_models = get_model_list()
    return [
        "facebook/magnet-small-10secs",
        "facebook/magnet-medium-10secs",
        "facebook/magnet-small-30secs",
        "facebook/magnet-medium-30secs",
        "facebook/audio-magnet-small",
        "facebook/audio-magnet-medium",
    ] + custom_models


initial_params = MagnetParams(
    model="facebook/magnet-small-10secs",
    text="",
    seed=0,
    use_sampling=True,
    top_k=0,
    top_p=0.95,
    temperature=1.0,
    max_cfg_coef=20.0,
    min_cfg_coef=1.0,
    decoding_steps=[
        80,
        40,
        40,
        20,
    ],
    span_arrangement="nonoverlap",
)


def generation_tab_magnet():
    with gr.Tab("Magnet"):
        gr.Markdown(f"""Audiocraft version: {AUDIOCRAFT_VERSION}""")
        with gr.Row(equal_height=False):
            with gr.Column():
                text = gr.Textbox(
                    label="Prompt", lines=3, placeholder="Enter text here..."
                )
                model = gr.Radio(
                    get_models(),  # type: ignore
                    label="Model",
                    value=initial_params["model"],
                )
                gr_reload_button().click(
                    fn=lambda: gr.Radio.update(choices=get_models()),  # type: ignore
                    outputs=[model],
                    api_name="magnet_get_models",
                )
                gr_open_button_simple(
                    MAGNET_LOCAL_MODELS_DIR, api_name="magnet_open_model_dir"
                )
                submit = gr.Button("Generate", variant="primary")
            with gr.Column():
                with gr.Row():
                    top_k = gr.Number(label="Top-k", value=initial_params["top_k"])
                    top_p = gr.Slider(
                        minimum=0.0,
                        maximum=1.5,
                        value=initial_params["top_p"],
                        label="Top-p",
                        step=0.05,
                    )
                    temperature = gr.Slider(
                        minimum=0.0,
                        maximum=10,
                        value=initial_params["temperature"],
                        label="Temperature",
                        step=0.05,
                    )
                with gr.Row():
                    min_cfg_coef = gr.Slider(
                        label="Min CFG coefficient",
                        value=initial_params["min_cfg_coef"],
                        minimum=0,
                        step=0.5,
                    )
                    max_cfg_coef = gr.Slider(
                        label="Max CFG coefficient",
                        value=initial_params["max_cfg_coef"],
                        minimum=0,
                        step=0.5,
                    )
                with gr.Row():
                    gr.Markdown("Decoding Steps:")
                    decoding_steps_1 = gr.Slider(
                        label="Stage 1", value=initial_params["decoding_steps"][0]
                    )
                    decoding_steps_2 = gr.Slider(
                        label="Stage 2", value=initial_params["decoding_steps"][1]
                    )
                    decoding_steps_3 = gr.Slider(
                        label="Stage 3", value=initial_params["decoding_steps"][2]
                    )
                    decoding_steps_4 = gr.Slider(
                        label="Stage 4", value=initial_params["decoding_steps"][3]
                    )
                with gr.Row():
                    span_arrangement = gr.Radio(
                        ["nonoverlap", "stride1"],
                        label="Span Scoring",
                        value=initial_params["span_arrangement"],
                    )
                    use_sampling = gr.Checkbox(
                        label="Use Sampling", value=initial_params["use_sampling"]
                    )
                seed, set_old_seed_button, _ = setup_seed_ui_musicgen()

        with gr.Column():
            output = gr.Audio(
                label="Generated Music",
                type="numpy",
                interactive=False,
                elem_classes="tts-audio",
            )
            image = gr.Image(label="Waveform", shape=(None, 100), elem_classes="tts-image")  # type: ignore
            with gr.Row():
                history_bundle_name_data = gr.Textbox(
                    visible=False,
                )
                save_button = gr.Button("Save to favorites", visible=True)
            save_button.click(
                fn=save_to_favorites,
                inputs=[history_bundle_name_data],
                outputs=[save_button],
            )

    seed_cache = gr.State()  # type: ignore
    result_json = gr.JSON(
        visible=False,
    )

    set_old_seed_button.click(
        fn=lambda x: gr.Number.update(value=x),
        inputs=seed_cache,
        outputs=seed,
    )

    submit.click(
        fn=generate,
        inputs=[
            model,
            text,
            seed,
            use_sampling,
            top_k,
            top_p,
            temperature,
            max_cfg_coef,
            min_cfg_coef,
            decoding_steps_1,
            decoding_steps_2,
            decoding_steps_3,
            decoding_steps_4,
            span_arrangement,
        ],
        outputs=[output, history_bundle_name_data, image, seed_cache, result_json],
        api_name="magnet",
    )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        generation_tab_magnet()

    demo.launch()

    generate(
        model="facebook/musicgen-melody",
        text="I am a robot",
        seed=0,
        use_sampling=True,
        top_k=250,
        top_p=0.0,
        temperature=1.0,
        max_cfg_coef=10.0,
        min_cfg_coef=1.0,
        decoding_step_1=20,
        decoding_step_2=10,
        decoding_step_3=10,
        decoding_step_4=10,
        span_arrangement="nonoverlap",
    )
