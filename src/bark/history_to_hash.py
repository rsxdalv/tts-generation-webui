import hashlib

from src.bark.FullGeneration import FullGeneration


def history_to_hash(npz: FullGeneration):
    npz_str = str(npz)
    return hashlib.md5(npz_str.encode('utf-8')).hexdigest()
