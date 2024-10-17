import json
from tts_webui.musicgen.audio_array_to_sha256 import audio_array_to_sha256
from tts_webui.utils.outputs.path import get_relative_output_path_ext


def decorator_save_metadata(fn):
    def wrapper(*args, **kwargs):
        result_dict = fn(*args, **kwargs)
        path = get_relative_output_path_ext(result_dict, ".json")
        print("Saving metadata to", path)

        metadata = {
            "_version": "0.0.1",
            "_hash_version": "0.0.2",
            **kwargs,
            "outputs": None,
            "date": str(result_dict["date"]),
            "hash": audio_array_to_sha256(result_dict["audio_out"][1]),
            # **result_dict,
        }
        with open(path, "w") as outfile:
            json.dump(
                metadata,
                outfile,
                indent=2,
                skipkeys=True,
                default=lambda o: f"<<non-serializable: {type(o).__qualname__}>>",
            )

        result_dict["metadata"] = metadata
        return result_dict

    return wrapper
