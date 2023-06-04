from typing import Tuple
from models.bark.bark.generation import (
    SAMPLE_RATE,
    codec_decode,
    models,
    load_codec_model,
)
from src.bark.npz_tools import load_npz
from src.config.config import config
import numpy as np


def get_audio_from_npz(file_path: str) -> Tuple[int, np.ndarray]:
    full_generation = load_npz(file_path)
    fine_prompt = full_generation["fine_prompt"]
    if "codec" not in models:
        codec_use_gpu = config["model"]["codec_use_gpu"]
        load_codec_model(use_gpu=codec_use_gpu)
    audio_array: np.ndarray = codec_decode(fine_prompt.astype(np.int64))
    return (SAMPLE_RATE, audio_array)
