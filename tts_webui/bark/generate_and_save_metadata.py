from tts_webui.bark.FullGeneration import FullGeneration
from tts_webui.bark.BarkParams import BarkParams
from bark.generation import models

from tts_webui.history_tab.get_hash_memoized import get_hash_memoized


def _is_big_model(model):
    return model.config.n_embd > 768


def generate_bark_metadata(
    date: str,
    full_generation: FullGeneration,
    params: BarkParams,
):
    history_prompt = params["history_prompt"]
    metadata = {
        "_version": "0.0.3",
        "_hash_version": "0.0.2",
        "_type": params["_type"],
        "text": params["text"],
        "text_temp": params["text_temp"],
        "seed": params["seed"],
        "max_length": params["max_length"],
        "waveform_temp": params["waveform_temp"],
        "is_big_semantic_model": _is_big_model(models["text"]["model"]),
        "is_big_coarse_model": _is_big_model(models["coarse"]),
        "is_big_fine_model": _is_big_model(models["fine"]),
        "date": date,
        "hash": get_hash_memoized(full_generation),
        "history_prompt": history_prompt if isinstance(history_prompt, str) else None,
        "history_prompt_npz": (
            history_prompt if isinstance(history_prompt, str) else None
        ),
        "history_hash": get_hash_memoized(history_prompt),
    }
    return metadata
