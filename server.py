from models.bark.bark import SAMPLE_RATE, generate_audio
from scipy.io.wavfile import write as write_wav
from models.bark.bark.generation import preload_models
from scipy.io.wavfile import write as write_wav
import gradio as gr

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


def generate(prompt, noHistory, history_prompt):
    # generate audio from text
    history_prompt = None if noHistory else history_prompt

    audio_array = generate_audio(prompt, history_prompt=history_prompt)

    # To save audio_array as a WAV file:
    filename = f"outputs/audio_{history_prompt}.wav"
    write_wav(filename, SAMPLE_RATE, audio_array)
    return filename


def test():
    text_prompt = """
        Hello, my name is Suno. And, uh — and I like pizza. [laughs] 
        But I also have other interests such as playing tic tac toe.
    """

    history_prompt = "en_speaker_0"
    generate(text_prompt, False, history_prompt)
    generate(text_prompt, True, history_prompt)


# Define the Gradio interface
inputs = [
    gr.inputs.Textbox(label="Prompt"),
    gr.inputs.Checkbox(label="No History Prompt", default=True),
    gr.inputs.Textbox(label="History Prompt (optional)")
]
outputs = gr.outputs.Audio(type="filepath", label="Generated audio")
title = "TTS Generation WebUI (Bark)"
description = "Enter a prompt to generate audio."
examples = [
    ["The quick brown fox jumps over the lazy dog."],
    ["To be or not to be, that is the question."],
    ["In a hole in the ground there lived a hobbit."],
    ["This text uses a history prompt, resulting in a more predictable voice.", False, "en_speaker_0"],
]
interface = gr.Interface(fn=generate, inputs=inputs, outputs=outputs,
                         title=title, description=description, examples=examples)

# Launch the interface
interface.launch()
