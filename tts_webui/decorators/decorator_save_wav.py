from scipy.io.wavfile import write as write_wav
from tts_webui.utils.outputs.path import get_relative_output_path_ext


def _save_wav(result_dict):
    SAMPLE_RATE, audio_array = result_dict["audio_out"]

    path = get_relative_output_path_ext(result_dict, ".wav")
    print("Saving generation to", path)
    write_wav(path, SAMPLE_RATE, audio_array)


def decorator_save_wav(fn):
    def wrapper(*args, **kwargs):
        result_dict = fn(*args, **kwargs)
        _save_wav(result_dict)
        return result_dict

    return wrapper


def decorator_save_wav_generator(fn):
    def wrapper(*args, **kwargs):
        for result_dict in fn(*args, **kwargs):
            if result_dict is None:
                continue
            _save_wav(result_dict)
            yield result_dict

    return wrapper
