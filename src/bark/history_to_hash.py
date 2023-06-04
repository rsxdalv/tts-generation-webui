import hashlib
from typing import Optional

from src.bark.FullGeneration import FullGeneration


def history_to_hash(npz: Optional[FullGeneration]):
    npz_str = str(npz)
    return hashlib.md5(npz_str.encode("utf-8")).hexdigest()
