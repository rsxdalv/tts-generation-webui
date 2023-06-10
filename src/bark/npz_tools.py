import glob
from typing import Any
import numpy as np
from src.bark.FullGeneration import FullGeneration
import json


def compress_history(full_generation: FullGeneration):
    return {
        "semantic_prompt": full_generation["semantic_prompt"].astype(np.int16),
        "coarse_prompt": full_generation["coarse_prompt"].astype(np.int16),
        "fine_prompt": full_generation["fine_prompt"].astype(np.int16),
    }


def save_npz(filename: str, full_generation: FullGeneration, metadata: dict[str, Any]):
    def pack_metadata(metadata: dict[str, Any]):
        return list(json.dumps(metadata))

    np.savez(
        filename,
        **{
            **compress_history(full_generation),
            "metadata": pack_metadata(metadata),
        },
    )


def load_npz(filename):
    def unpack_metadata(metadata: np.ndarray):
        def join_list(x: list | np.ndarray):
            return "".join(x)

        return json.loads(join_list(metadata))

    with np.load(filename, allow_pickle=True) as data:
        result = {key: data[key] for key in data}
        if "metadata" in result:
            result["metadata"] = unpack_metadata(result["metadata"])
        return result


def get_npz_files():
    return (
        glob.glob("voices/*.npz")
        + glob.glob("favorites/*.npz")
        + glob.glob("outputs/*.npz")
    )


if __name__ == "__main__":
    in_npz = load_npz("./temp/ogg-vs-npz/audio__bark__None__2023-05-29_10-12-46.npz")

    metadata_in = {
        "_version": "0.0.1",
        "_hash_version": "0.0.2",
        "_type": "bark",
        "is_big_semantic_model": True,
        "is_big_coarse_model": False,
        "is_big_fine_model": False,
        "prompt": "test",
        "language": None,
        "speaker_id": None,
        "hash": "98b14851692f09df5e89c68f0a8e2013",
        "history_prompt": "continued_generation",
        "history_prompt_npz": None,
        "history_hash": "98b14851692f09df5e89c68f0a8e2013",
        "text_temp": 0.7,
        "waveform_temp": 0.7,
        "date": "2023-06-07_16-56-09",
        "seed": "2039063546",
    }

    save_npz(
        "./npz_reencode_test_new_list.npz",
        {
            "semantic_prompt": in_npz["semantic_prompt"],
            "coarse_prompt": in_npz["coarse_prompt"],
            "fine_prompt": in_npz["fine_prompt"],
        },
        metadata_in,
    )

    out_npz = load_npz("./npz_reencode_test_new_list.npz")

    assert out_npz["metadata"] == metadata_in
