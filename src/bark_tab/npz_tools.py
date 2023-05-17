import glob
import numpy as np


def npz_tools():
    return None


def save_npz(filename, full_generation):
    np.savez(filename, **full_generation)


def load_npz(filename):
    with np.load(filename, allow_pickle=True) as data:
        return {key: data[key] for key in data}


def get_npz_files():
    return glob.glob("voices/*.npz") + glob.glob("favorites/*.npz") + glob.glob("outputs/*.npz")
