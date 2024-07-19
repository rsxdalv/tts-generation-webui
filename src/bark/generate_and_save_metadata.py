import json
from src.bark.history_to_hash import history_to_hash
from src.bark.FullGeneration import FullGeneration
from src.bark.BarkParams import BarkParams
from bark.generation import models


def generate_and_save_metadata(
    date: str,
    filename_json: str,
    full_generation: FullGeneration,
    final_gen_params: BarkParams,
):
    prompt = final_gen_params["text"]
    text_temp = final_gen_params["text_temp"]
    waveform_temp = final_gen_params["waveform_temp"]
    seed = final_gen_params["seed"]
    history_prompt = final_gen_params["history_prompt"]

    history_hash = history_to_hash(history_prompt)
    history_prompt_npz = history_prompt if isinstance(history_prompt, str) else None
    history_prompt = history_prompt if isinstance(history_prompt, str) else None

    is_big_semantic_model = models["text"]["model"].config.n_embd > 768
    is_big_coarse_model = models["coarse"].config.n_embd > 768
    is_big_fine_model = models["fine"].config.n_embd > 768

    metadata = {
        "_version": "0.0.2",
        "_hash_version": "0.0.2",
        "_type": "bark",
        "is_big_semantic_model": is_big_semantic_model,
        "is_big_coarse_model": is_big_coarse_model,
        "is_big_fine_model": is_big_fine_model,
        # "model_semantic_hash": model_semantic_hash,
        # "model_coarse_hash": model_coarse_hash,
        # "model_fine_hash": model_fine_hash,
        "prompt": prompt,
        "hash": history_to_hash(full_generation),
        "history_prompt": history_prompt,
        "history_prompt_npz": history_prompt_npz,
        "history_hash": history_hash,
        "text_temp": text_temp,
        "waveform_temp": waveform_temp,
        "date": date,
        "seed": str(seed),
        "max_gen_duration_s": final_gen_params["max_gen_duration_s"],
    }
    with open(filename_json, "w") as outfile:
        json.dump(metadata, outfile, indent=2)

    return metadata
