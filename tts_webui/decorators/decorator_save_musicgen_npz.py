from tts_webui.utils.outputs.path import get_relative_output_path_ext
from tts_webui.bark.npz_tools import save_npz_musicgen


def decorator_save_musicgen_npz(fn):
    def wrapper(*args, **kwargs):
        result_dict = fn(*args, **kwargs)
        tokens = result_dict["tokens"]

        if tokens is not None:
            path = get_relative_output_path_ext(result_dict, ".npz")

            save_npz_musicgen(path, tokens, result_dict["metadata"])

        return result_dict

    return wrapper
