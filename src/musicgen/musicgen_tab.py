import torch
import gradio as gr
from audiocraft.models.musicgen import MusicGen
from typing import Optional, Tuple, TypedDict
import numpy as np
import os
from src.musicgen.setup_seed_ui_musicgen import setup_seed_ui_musicgen
from src.bark.parse_or_set_seed import parse_or_set_seed
from src.musicgen.audio_array_to_sha256 import audio_array_to_sha256
from src.utils.set_seed import set_seed

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
from typing import Optional
from importlib.metadata import version

AUDIOCRAFT_VERSION = version("audiocraft")


class MusicGenGeneration(TypedDict):
    model: str
    text: str
    melody: Optional[Tuple[int, np.ndarray]]
    duration: float
    topk: int
    topp: float
    temperature: float
    cfg_coef: float
    seed: int


def melody_to_sha256(melody: Optional[Tuple[int, np.ndarray]]) -> Optional[str]:
    if melody is None:
        return None
    sr, audio_array = melody
    return audio_array_to_sha256(audio_array)


def generate_and_save_metadata(
    prompt: str,
    date: str,
    filename_json: str,
    params: MusicGenGeneration,
    audio_array: np.ndarray,
):
    metadata = {
        "_version": "0.0.1",
        "_hash_version": "0.0.3",
        "_type": "musicgen",
        "_audiocraft_version": AUDIOCRAFT_VERSION,
        "models": {},
        "prompt": prompt,
        "hash": audio_array_to_sha256(audio_array),
        "date": date,
        **params,
        "seed": str(params["seed"]),
        "melody": melody_to_sha256(params.get("melody", None)),
    }
    with open(filename_json, "w") as outfile:
        json.dump(metadata, outfile, indent=2)

    return metadata


def save_generation(
    audio_array: np.ndarray,
    SAMPLE_RATE: int,
    params: MusicGenGeneration,
):
    prompt = params["text"]
    date = get_date_string()
    title = prompt[:20].replace(" ", "_")
    base_filename = create_base_filename(title, "outputs", model="musicgen", date=date)

    filename, filename_png, filename_json, _ = get_filenames(base_filename)
    write_wav(filename, SAMPLE_RATE, audio_array)
    plot = save_waveform_plot(audio_array, filename_png)

    metadata = generate_and_save_metadata(
        prompt=prompt,
        date=date,
        filename_json=filename_json,
        params=params,
        audio_array=audio_array,
    )

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

    return filename, plot, _, metadata


MODEL = None


def load_model(version):
    print("Loading model", version)
    return MusicGen.get_pretrained(version)


def log_generation_musicgen(
    params: MusicGenGeneration,
):
    print("Generating: '''", params["text"], "'''")
    print("Parameters:")
    for key, value in params.items():
        print(key, ":", value)


def predict(params: MusicGenGeneration, melody_in: Optional[Tuple[int, np.ndarray]]):
    model = params["model"]
    text = params["text"]
    # due to JSON serialization limitations
    params["melody"] = None if model != "melody" else melody_in
    melody = params["melody"]

    global MODEL
    if MODEL is None or MODEL.name != model:
        MODEL = load_model(model)

    # if duration > MODEL.lm.cfg.dataset.segment_duration:  # type: ignore
    #     raise gr.Error("MusicGen currently supports durations of up to 30 seconds!")
    MODEL.set_generation_params(
        use_sampling=True,
        top_k=params["topk"],
        top_p=params["topp"],
        temperature=params["temperature"],
        cfg_coef=params["cfg_coef"],
        duration=params["duration"],
    )

    import time

    start = time.time()

    params["seed"] = parse_or_set_seed(params["seed"], 0)
    # generator = torch.Generator(device=MODEL.device).manual_seed(params["seed"])
    log_generation_musicgen(params)
    if melody:
        sr, melody = melody[0], torch.from_numpy(melody[1]).to(
            MODEL.device
        ).float().t().unsqueeze(0)
        print(melody.shape)
        if melody.dim() == 2:
            melody = melody[None]
        melody = melody[..., : int(sr * MODEL.lm.cfg.dataset.segment_duration)]  # type: ignore
        output = MODEL.generate_with_chroma(
            descriptions=[text],
            melody_wavs=melody,
            melody_sample_rate=sr,
            progress=False,
            # generator=generator,
        )
    else:
        output = MODEL.generate(
            descriptions=[text],
            progress=True,
            # generator=generator,
        )
    set_seed(-1)

    elapsed = time.time() - start
    # print time taken
    print("Generated in", "{:.3f}".format(elapsed), "seconds")

    output = output.detach().cpu().numpy().squeeze()

    filename, plot, filename_npz, metadata = save_generation(
        audio_array=output,
        SAMPLE_RATE=MODEL.sample_rate,
        params=params,
    )

    return [
        (MODEL.sample_rate, output),
        os.path.dirname(filename),
        plot,
        params["seed"],
    ]


musicgen_atom = gr.JSON(
    # visible=True,
    visible=False,
    value={
        "text": "",
        "melody": None,
        "model": "melody",
        "duration": 10,
        "topk": 250,
        "topp": 0,
        "temperature": 1.0,
        "cfg_coef": 3.0,
        "seed": -1,
    },
)


def generation_tab_musicgen():
    with gr.Tab("MusicGen") as tab:
        musicgen_atom.render()
        gr.Markdown(f"""Audiocraft version: {AUDIOCRAFT_VERSION}""")
        with gr.Row():
            with gr.Column():
                text = gr.Textbox(
                    label="Prompt", lines=3, placeholder="Enter text here..."
                )
                model = gr.Radio(
                    ["melody", "medium", "small", "large"],
                    label="Model",
                    value="melody",
                )
                melody = gr.Audio(
                    source="upload",
                    type="numpy",
                    label="Melody (optional)",
                    elem_classes="tts-audio",
                )
                submit = gr.Button("Generate", variant="primary")
            with gr.Column():
                duration = gr.Slider(
                    minimum=1,
                    maximum=360,
                    value=10,
                    label="Duration",
                )
                with gr.Row():
                    topk = gr.Number(label="Top-k", value=250, interactive=True)
                    topp = gr.Slider(
                        minimum=0.0,
                        maximum=1.5,
                        value=0.0,
                        label="Top-p",
                        interactive=True,
                        step=0.05,
                    )
                    temperature = gr.Slider(
                        minimum=0.0,
                        maximum=1.5,
                        value=1.0,
                        label="Temperature",
                        interactive=True,
                        step=0.05,
                    )
                    cfg_coef = gr.Slider(
                        minimum=0.0,
                        maximum=10.0,
                        value=3.0,
                        label="Classifier Free Guidance",
                        interactive=True,
                        step=0.1,
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
                history_bundle_name_data = gr.State()  # type: ignore
                save_button = gr.Button("Save to favorites", visible=True)
                melody_button = gr.Button("Use as melody", visible=True)
            save_button.click(
                fn=save_to_favorites,
                inputs=[history_bundle_name_data],
                outputs=[save_button],
            )

            melody_button.click(
                fn=lambda melody_in: melody_in,
                inputs=[output],
                outputs=[melody],
            )

    inputs = [text, melody, model, duration, topk, topp, temperature, cfg_coef, seed]

    def update_components(x):
        return {
            text: x["text"],
            # melody: None,  # due to JSON serialization limitations
            model: x["model"],
            duration: x["duration"],
            topk: x["topk"],
            topp: x["topp"],
            temperature: x["temperature"],
            cfg_coef: x["cfg_coef"],
            seed: x["seed"],
        }

    musicgen_atom.change(
        fn=update_components,
        inputs=musicgen_atom,
        outputs=inputs,
    )

    def update_json(
        text, _melody, model, duration, topk, topp, temperature, cfg_coef, seed
    ):
        return {
            "text": text,
            "melody": "exists" if _melody else "None",  # due to JSON limits
            "model": model,
            "duration": float(duration),
            "topk": int(topk),
            "topp": float(topp),
            "temperature": float(temperature),
            "cfg_coef": float(cfg_coef),
            "seed": int(seed),
        }

    seed_cache = gr.State()  # type: ignore

    set_old_seed_button.click(
        fn=lambda x: gr.Number.update(value=x),
        inputs=seed_cache,
        outputs=seed,
    )

    submit.click(
        fn=update_json,
        inputs=inputs,
        outputs=[musicgen_atom],
    ).then(
        fn=predict,
        inputs=[musicgen_atom, melody],
        outputs=[output, history_bundle_name_data, image, seed_cache],
        api_name="MusicGen",
    )

    return tab, musicgen_atom


if __name__ == "__main__":
    with gr.Blocks() as demo:
        generation_tab_musicgen()

    demo.launch()
