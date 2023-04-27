from models.bark.bark import SAMPLE_RATE, generate_audio
from scipy.io.wavfile import write as write_wav
from models.bark.bark.generation import preload_models
from scipy.io.wavfile import write as write_wav

# download and load all models
def init_models():
    preload_models(
        text_use_gpu=True,
        text_use_small=True,
        # text_use_small=False,
        coarse_use_gpu=True,
        coarse_use_small=True,
        # coarse_use_small=False,
        fine_use_gpu=True,
        fine_use_small=False,
        codec_use_gpu=True,
        force_reload=False,
    )

init_models()

# generate audio from text
text_prompt = """
     Hello, my name is Suno. And, uh — and I like pizza. [laughs] 
     But I also have other interests such as playing tic tac toe.
"""
audio_array = generate_audio(text_prompt)

# To save audio_array as a WAV file:
write_wav("outputs/audio.wav", SAMPLE_RATE, audio_array)
