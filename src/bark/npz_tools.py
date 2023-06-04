import glob
import numpy as np

from src.bark.FullGeneration import FullGeneration


def compress_history(full_generation: FullGeneration):
    return {
        "semantic_prompt": full_generation["semantic_prompt"].astype(np.int16),
        "coarse_prompt": full_generation["coarse_prompt"].astype(np.int16),
        "fine_prompt": full_generation["fine_prompt"].astype(np.int16),
    }


def save_npz(filename: str, full_generation: FullGeneration):
    np.savez(filename, **compress_history(full_generation))


def load_npz(filename: str) -> FullGeneration:
    with np.load(filename, allow_pickle=True) as data:
        return {key: data[key] for key in data} # type: ignore
        # return FullGeneration(**data)


def get_npz_files():
    return (
        glob.glob("voices/*.npz")
        + glob.glob("favorites/*.npz")
        + glob.glob("outputs/*.npz")
    )
