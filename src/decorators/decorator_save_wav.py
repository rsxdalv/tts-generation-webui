from scipy.io.wavfile import write as write_wav
from src.utils.outputs.path import get_relative_output_path_ext


def decorator_save_wav(fn):
    def wrapper(*args, **kwargs):
        result_dict = fn(*args, **kwargs)
        path = get_relative_output_path_ext(result_dict, ".wav")
        print("Saving generation to", path)

        SAMPLE_RATE, audio_array = result_dict["audio_out"]

        write_wav(path, SAMPLE_RATE, audio_array)

        return result_dict

    return wrapper
