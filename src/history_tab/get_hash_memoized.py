from src.bark.history_to_hash import history_to_hash
from src.bark.npz_tools import load_npz


def memoize(func, file_path):
    if not hasattr(memoize, "cache"):
        memoize.cache = {}
    if file_path not in memoize.cache:
        memoize.cache[file_path] = func(file_path)
    return memoize.cache[file_path]


def get_hash(file_path):
    full_generation = load_npz(file_path)
    return history_to_hash(full_generation)


def get_hash_memoized(file_path: str):
    return memoize(get_hash, file_path)
