from tts_webui.bark.history_to_hash import history_to_hash


def memoize(func, file_path):
    if not hasattr(memoize, "cache"):
        memoize.cache = {}
    if isinstance(file_path, dict):
        return func(file_path)
    if file_path not in memoize.cache:
        memoize.cache[file_path] = func(file_path)
    return memoize.cache[file_path]


def get_hash_memoized(file_path):
    return memoize(history_to_hash, file_path)
