import torch
import gradio as gr
from typing import Any, List, Optional, TypedDict, Literal
import numpy as np
import os
from src.magnet.utils import Seed, Timer
from src.bark.npz_tools import save_npz_musicgen
from src.musicgen.setup_seed_ui_musicgen import setup_seed_ui_musicgen
from src.musicgen.audio_array_to_sha256 import audio_array_to_sha256

from src.extensions_loader.ext_callback_save_generation import (
    ext_callback_save_generation_musicgen,
)
from src.history_tab.save_to_favorites import save_to_favorites
from src.bark.get_filenames import get_filenames
from src.utils.date import get_date_string
from scipy.io.wavfile import write as write_wav
from src.utils.save_waveform_plot import middleware_save_waveform_plot

import json
from importlib.metadata import version
from audiocraft.models.magnet import MAGNeT

from src.utils.get_path_from_root import get_path_from_root
from src.tortoise.gr_reload_button import gr_open_button_simple, gr_reload_button
from src.utils.torch_clear_memory import torch_clear_memory

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
    date: str
    base_filename: str

    _version: str
    _hash_version: str
    _type: str
    _audiocraft_version: str
    model_hash: str
    hash: str


def just_generation(full_params_instance):
    return MagnetGenerationParams(
        **{
            key: value
            for key, value in full_params_instance.items()
            if key in MagnetGenerationParams.__required_keys__
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


def unload_model():
    global MODEL
    del MODEL
    MODEL = None
    torch_clear_memory()


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
    params = MagnetParams(
        _version="0.0.1",
        _hash_version="0.0.3",
        _type="magnet",
        _audiocraft_version=AUDIOCRAFT_VERSION,
        model_hash="",
        hash="",
        model=model,
        text=text,
        seed=seed,
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
        date=get_date_string(),
        base_filename="",
    )

    def add_base_filename_to_params(params: dict | MagnetParams):
        from src.utils.create_base_filename import create_base_filename
        from src.utils.prompt_to_title import prompt_to_title

        params["base_filename"] = create_base_filename(
            prompt_to_title(params["text"]),
            "outputs",
            model=params["_type"],
            date=params["date"],
        )

    add_base_filename_to_params(params)

    log_generation_musicgen(params)
    MODEL = get_model(model)
    MODEL.set_generation_params(**just_generation(params))

    with Timer(), Seed(seed):
        output, tokens = MODEL.generate(
            descriptions=[text],
            progress=True,
            return_tokens=True,
        )

    output = output.detach().cpu().numpy().squeeze()

    audio = (MODEL.sample_rate, output.transpose())

    audio_array = output
    SAMPLE_RATE = MODEL.sample_rate
    params = params
    tokens = tokens

    base_filename = params["base_filename"]
    stereo = audio_array.shape[0] == 2
    if stereo:
        audio_array = np.transpose(audio_array)
    write_wav(base_filename + ".wav", SAMPLE_RATE, audio_array)

    def convert_seed_to_str(params: dict | Any):
        params["seed"] = str(params["seed"])

    convert_seed_to_str(params)
    params["hash"] = audio_array_to_sha256(audio_array)

    with open(params["base_filename"] + ".json", "w") as outfile:
        json.dump(params, outfile, indent=2)

    if tokens is not None:
        save_npz_musicgen(base_filename + ".npz", tokens, params)

    # make into a plugin
    plot = middleware_save_waveform_plot(audio_array, base_filename + ".png")
    ext_callback_save_generation_musicgen(
        audio_array=audio_array,
        files={
            "wav": base_filename + ".wav",
            "png": base_filename + ".png",
            "ogg": base_filename + ".ogg",
        },
        metadata=params,
        SAMPLE_RATE=SAMPLE_RATE,
    )

    return [
        audio,
        os.path.dirname(base_filename),
        params,
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
    _version="0.0.1",
    _hash_version="0.0.3",
    _type="magnet",
    _audiocraft_version=AUDIOCRAFT_VERSION,
    model_hash="",
    hash="",
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
    date=get_date_string(),
    base_filename="",
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
                unload_model_button = gr.Button("Unload Model", visible=False)
                unload_model_button.click(
                    fn=unload_model,
                    api_name="magnet_unload_model",
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
                # gr.Markdown("Seed")
                # with gr.Row():
                #     seed_input = gr.Number(value=-1, show_label=False, container=False)
                #     set_random_seed_button = gr.Button(
                #         "backspace", elem_classes="btn-sm material-symbols-outlined", size="sm"
                #     )

                #     set_random_seed_button.click(
                #         fn=lambda: gr.Number.update(value=-1), outputs=[seed_input]
                #     )

                #     set_old_seed_button = gr.Button(
                #         "repeat", elem_classes="btn-sm material-symbols-outlined", size="sm"
                #     )

                #     def link_seed_cache(seed_cache):
                #         set_old_seed_button.click(
                #             fn=lambda x: gr.Number.update(value=x),
                #             inputs=seed_cache,
                #             outputs=seed_input,
                #         )

        with gr.Column():
            output = gr.Audio(
                label="Generated Music",
                type="numpy",
                interactive=False,
                elem_classes="tts-audio",
            )
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

    result_json = gr.JSON(
        visible=False,
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
        outputs=[output, history_bundle_name_data, result_json],
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
