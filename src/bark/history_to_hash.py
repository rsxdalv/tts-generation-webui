import hashlib
import json
from typing import Optional
from src.bark.FullGeneration import FullGeneration


def history_to_hash(npz: Optional[FullGeneration]):
    if npz is None:
        return get_md5_hex(b"None")
    npz_str = json.dumps({
        "semantic_prompt": npz["semantic_prompt"].tolist(),
        "coarse_prompt": npz["coarse_prompt"].tolist(),
        "fine_prompt": npz["fine_prompt"].tolist(),
    })
    npz_as_str = npz_str.encode("utf-8")
    return get_md5_hex(npz_as_str)

def get_md5_hex(npz_as_str: bytes):
    return hashlib.md5(npz_as_str).hexdigest()
