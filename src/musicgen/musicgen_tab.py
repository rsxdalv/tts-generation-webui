"""
Copyright (c) Meta Platforms, Inc. and affiliates.
All rights reserved.

This source code is licensed under the MIT license found in 
https://github.com/facebookresearch/audiocraft/blob/main/LICENSE
"""

import torch
import gradio as gr
from audiocraft.models.musicgen import MusicGen
from typing import Optional, Tuple, TypedDict
import numpy as np

from src.utils.set_seed import set_seed

# import all
from src.bark.FinalGenParams import FinalGenParams
from src.bark.history_to_hash import history_to_hash
from src.extensions_loader.ext_callback_save_generation import (
    ext_callback_save_generation,
)
from src.utils.create_base_filename import create_base_filename
from src.history_tab.save_to_favorites import save_to_favorites
from src.bark.generate_and_save_metadata import generate_and_save_metadata
from src.bark.generate_choice_string import generate_choice_string
from src.bark.get_filenames import get_filenames
from src.bark.get_history_prompt import get_history_prompt
from src.bark.log_generation import log_generation
from src.bark.npz_tools import get_npz_files, load_npz, save_npz
from src.bark.parse_or_set_seed import parse_or_set_seed
from src.bark.split_text_functions import split_by_length_simple, split_by_lines
from src.utils.date import get_date_string
from models.bark.bark import SAMPLE_RATE, generate_audio
from scipy.io.wavfile import write as write_wav
from models.bark.bark.generation import SUPPORTED_LANGS
from src.utils.save_waveform_plot import save_waveform_plot
from src.model_manager import model_manager
from src.config.config import config
from src.utils.set_seed import set_seed
from src.bark.generation_settings import (
    HistorySettings,
    PromptSplitSettings,
    LongPromptHistorySettings,
)


import json
from src.bark.history_to_hash import history_to_hash
from src.bark.FullGeneration import FullGeneration
from models.bark.bark.generation import models
from typing import Optional


def generate_and_save_metadata(
    prompt: str,
    language: Optional[str],
    speaker_id: Optional[int],
    text_temp: float,
    waveform_temp: float,
    seed: int,
    date: str,
    filename_json: str,
    history_prompt_npz: Optional[str],
    history_prompt: str,
    history_hash: str,
    full_generation: FullGeneration,
):
    metadata = {
        "_version": "0.0.1",
        "_hash_version": "0.0.2",
        "_type": "musicgen",
        # "id": generation_hash, # generation_hash is the same as history_hash but for current generation
        "models": {},
        "prompt": prompt,
        "language": language,
        "speaker_id": speaker_id,
        "hash": None, # TODO: add hash
        "history_prompt": history_prompt,
        "history_prompt_npz": history_prompt_npz,
        "history_hash": history_hash,
        "text_temp": text_temp,
        "waveform_temp": waveform_temp,
        "date": date,
        "seed": str(seed),
        # "files": {
        #     "wav": filename,
        #     "png": filename_png,
        #     "json": filename_json,
        #     "npz": filename_npz,
        # },
    }
    with open(filename_json, "w") as outfile:
        json.dump(metadata, outfile, indent=2)

    return metadata


def save_generation(
    prompt,
    language,
    speaker_id,
    text_temp,
    waveform_temp,
    history_prompt,
    seed,
    use_voice,
    history_prompt_verbal,
    full_generation,
    audio_array,
    SAMPLE_RATE,
):
    date = get_date_string()
    base_filename = create_base_filename(
        history_prompt_verbal, "outputs", model="musicgen", date=date
    )

    filename, filename_png, filename_json, filename_npz = get_filenames(base_filename)
    # save_wav(audio_array, filename)
    write_wav(filename, SAMPLE_RATE, audio_array)
    plot = save_waveform_plot(audio_array, filename_png)

    # Generate metadata for the audio file
    language = SUPPORTED_LANGS[language][0] if use_voice else None
    history_hash = history_to_hash(history_prompt)
    history_prompt_npz = history_prompt if isinstance(history_prompt, str) else None
    speaker_id = speaker_id if use_voice else None
    history_prompt = history_prompt_verbal

    metadata = generate_and_save_metadata(
        prompt=prompt,
        language=language,
        speaker_id=speaker_id,
        text_temp=text_temp,
        waveform_temp=waveform_temp,
        seed=seed,
        date=date,
        filename_json=filename_json,
        history_prompt_npz=history_prompt_npz,
        history_prompt=history_prompt,
        history_hash=history_hash,
        full_generation=full_generation,
    )
    # save_npz(filename_npz, full_generation, metadata)

    return filename, plot, filename_npz, metadata


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


MODEL = None


def load_model(version):
    print("Loading model", version)
    return MusicGen.get_pretrained(version)


def predict(params: MusicGenGeneration):
    model = params["model"]
    melody = params["melody"]
    duration = params["duration"]
    text = params["text"]

    global MODEL
    if MODEL is None or MODEL.name != model:
        MODEL = load_model(model)

    if duration > MODEL.lm.cfg.dataset.segment_duration:  # type: ignore
        raise gr.Error("MusicGen currently supports durations of up to 30 seconds!")
    MODEL.set_generation_params(
        use_sampling=True,
        top_k=params["topk"],
        top_p=params["topp"],
        temperature=params["temperature"],
        cfg_coef=params["cfg_coef"],
        duration=params["duration"],
    )

    print("Generating...")
    import time

    start = time.time()
    set_seed(params["seed"])
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
        )
    else:
        output = MODEL.generate(descriptions=[text], progress=True)
    set_seed(-1)

    elapsed = time.time() - start
    # print time taken
    print("Generated in", elapsed, "seconds")

    output = output.detach().cpu().numpy().squeeze()

    save_generation(
        prompt=text,
        language="en",
        speaker_id=None,
        text_temp=None,
        waveform_temp=None,
        history_prompt=None,
        seed=params["seed"],
        use_voice=False,
        history_prompt_verbal=None,
        full_generation=output,
        audio_array=output,
        SAMPLE_RATE=MODEL.sample_rate,
    )

    return MODEL.sample_rate, output


musicgen_atom = gr.JSON(
    visible=True,
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
    with gr.Tab("Generation (MusicGen) Demo") as tab:
        musicgen_atom.render()
        gr.Markdown(
            """
            This is the demo for MusicGen, a simple and controllable model for music generation presented at: "Simple and Controllable Music Generation".

            Below we present 3 model variations:
            1. Melody -- a music generation model capable of generating music condition on text and melody inputs. **Note**, you can also use text only.
            2. Small -- a 300M transformer decoder conditioned on text only.
            3. Medium -- a 1.5B transformer decoder conditioned on text only.
            4. Large -- a 3.3B transformer decoder conditioned on text only (might OOM for the longest sequences.)

            When the optional melody conditioning wav is provided, the model will extract
            a broad melody and try to follow it in the generated samples.

            See [github.com/facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft)
            for more details.
            """
        )
        with gr.Row():
            with gr.Column():
                with gr.Row():
                    text = gr.Text(label="Input Text", interactive=True)
                    melody = gr.Audio(
                        source="upload",
                        type="numpy",
                        label="Melody Condition (optional)",
                        interactive=True,
                    )
                with gr.Row():
                    submit = gr.Button("Submit")
                with gr.Row():
                    model = gr.Radio(
                        ["melody", "medium", "small", "large"],
                        label="Model",
                        value="melody",
                        interactive=True,
                    )
                with gr.Row():
                    duration = gr.Slider(
                        minimum=1,
                        maximum=30,
                        value=10,
                        label="Duration",
                        interactive=True,
                    )
                with gr.Row():
                    topk = gr.Number(label="Top-k", value=250, interactive=True)
                    topp = gr.Number(label="Top-p", value=0, interactive=True)
                    temperature = gr.Number(
                        label="Temperature", value=1.0, interactive=True
                    )
                    cfg_coef = gr.Number(
                        label="Classifier Free Guidance", value=3.0, interactive=True
                    )
            with gr.Column():
                output = gr.Audio(label="Generated Music", type="numpy")

    seed = gr.Number(label="Seed", value=-1, interactive=True)

    outputs = [text, melody, model, duration, topk, topp, temperature, cfg_coef, seed]

    def update_components(x):
        return {
            text: x["text"],
            melody: x["melody"],
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
        outputs=outputs,
    )

    def update_json(
        text, melody, model, duration, topk, topp, temperature, cfg_coef, seed
    ):
        return {
            "text": text,
            "melody": melody,
            "model": model,
            "duration": float(duration),
            "topk": int(topk),
            "topp": float(topp),
            "temperature": float(temperature),
            "cfg_coef": float(cfg_coef),
            "seed": int(seed),
        }

    submit.click(
        fn=update_json,
        inputs=outputs,
        outputs=[musicgen_atom],
    ).then(
        fn=predict,
        inputs=musicgen_atom,
        outputs=[output],
    )

    return tab, musicgen_atom
