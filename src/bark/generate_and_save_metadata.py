import json
from models.bark.bark.generation import models
from typing import Optional


def generate_and_save_metadata(
    prompt: str,
    language: Optional[str],
    speaker_id: Optional[int],
    text_temp: float,
    waveform_temp: float,
    seed: int,
    filename: str,
    date: str,
    filename_png: str,
    filename_json: str,
    history_prompt_npz: Optional[str],
    filename_npz: str,
    history_prompt: str,
    history_hash: str,
):
    is_big_semantic_model = models["text"]["model"].config.n_embd > 768
    is_big_coarse_model = models["coarse"].config.n_embd > 768
    is_big_fine_model = models["fine"].config.n_embd > 768
    metadata = {
        "_version": "0.0.1",
        "_hash_version": "0.0.2",
        # "id": generation_hash, # generation_hash is the same as history_hash but for current generation
        # "model_semantic_hash": model_semantic_hash,
        "is_big_semantic_model": is_big_semantic_model,
        # "model_coarse_hash": model_coarse_hash,
        "is_big_coarse_model": is_big_coarse_model,
        # "model_fine_hash": model_fine_hash,
        "is_big_fine_model": is_big_fine_model,
        "prompt": prompt,
        "language": language,
        "speaker_id": speaker_id,
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
