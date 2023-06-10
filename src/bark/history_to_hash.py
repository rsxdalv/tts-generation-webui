import hashlib
import json
from typing import Union
from src.bark.get_bark_voice_hash import get_hash_from_voice_name
from src.bark.FullGeneration import FullGeneration


def history_to_hash(npz: Union[None, str, FullGeneration]):
    if npz is None:
        return get_md5_hex(b"None")
    if isinstance(npz, str):
        return get_hash_from_voice_name(npz)
    npz_str = json.dumps(
        {
            "semantic_prompt": npz["semantic_prompt"].tolist(),
            "coarse_prompt": npz["coarse_prompt"].tolist(),
            "fine_prompt": npz["fine_prompt"].tolist(),
        }
    )
    npz_as_str = npz_str.encode("utf-8")
    return get_md5_hex(npz_as_str)


def get_md5_hex(npz_as_str: bytes):
    return hashlib.md5(npz_as_str).hexdigest()
