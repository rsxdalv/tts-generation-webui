import hashlib
import json
from typing import Union
from tts_webui.bark.get_bark_voice_hash import get_hash_from_voice_name
from tts_webui.bark.FullGeneration import FullGeneration
from tts_webui.bark.npz_tools import load_npz


def history_to_hash(voice_name: Union[None, str, FullGeneration]):
    if voice_name is None:
        return get_md5_hex(b"None")
    if isinstance(voice_name, str):
        candidate = get_hash_from_voice_name(voice_name)
        if candidate is not None:
            return candidate
        else:
            npz = load_npz(voice_name)
    else:
        npz = voice_name
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
