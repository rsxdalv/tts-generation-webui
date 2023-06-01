import glob
import numpy as np

from .FullGeneration import FullGeneration


def npz_tools():
    return None


def compress_history(full_generation):
    full_generation["semantic_prompt"] = full_generation["semantic_prompt"].astype(np.int16)
    full_generation["coarse_prompt"] = full_generation["coarse_prompt"].astype(np.int16)
    full_generation["fine_prompt"] = full_generation["fine_prompt"].astype(np.int16)
    return full_generation


def save_npz(filename, full_generation: FullGeneration):
    full_generation = compress_history(full_generation)
    np.savez(filename, **full_generation)


def load_npz(filename):
    with np.load(filename, allow_pickle=True) as data:
        return {key: data[key] for key in data}


def get_npz_files():
    return glob.glob("voices/*.npz") + glob.glob("favorites/*.npz") + glob.glob("outputs/*.npz")
