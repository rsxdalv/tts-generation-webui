import datetime
import glob
import os
from models.bark.bark import SAMPLE_RATE, generate_audio
from scipy.io.wavfile import write as write_wav
from models.bark.bark.generation import SUPPORTED_LANGS, preload_models
from scipy.io.wavfile import write as write_wav
import gradio as gr


def init_models(
    text_use_gpu,
    text_use_small,
    coarse_use_gpu,
    coarse_use_small,
    fine_use_gpu,
    fine_use_small,
    codec_use_gpu
):
    # download and load all models
    preload_models(
        text_use_gpu=text_use_gpu,
        text_use_small=text_use_small,
        coarse_use_gpu=coarse_use_gpu,
        coarse_use_small=coarse_use_small,
        fine_use_gpu=fine_use_gpu,
        fine_use_small=fine_use_small,
        codec_use_gpu=codec_use_gpu,
        force_reload=True,
    )
    return gr.Button.update(value="Reload models", interactive=True)


def generate(prompt, useHistory, language=None, speaker_id=0):
    # generate audio from text
    history_prompt = None if not useHistory else f"{SUPPORTED_LANGS[language][1]}_speaker_{speaker_id}"

    print("Generating:", prompt, "history_prompt:", history_prompt)
    audio_array = generate_audio(prompt, history_prompt=history_prompt)

    # get current date for file
    now = datetime.datetime.now()
    date = now.strftime("%Y-%m-%d_%H-%M-%S")

    # To save audio_array as a WAV file:
    filename = f"outputs/audio_{history_prompt}_{date}.wav"
    # See if metadata can be added to the file
    write_wav(filename, SAMPLE_RATE, audio_array)
    return filename


def test():
    text_prompt = """
        Hello, my name is Suno. And, uh — and I like pizza. [laughs] 
        But I also have other interests such as playing tic tac toe.
    """

    history_prompt = "en_speaker_0"
    generate(text_prompt, True, history_prompt)
    generate(text_prompt, False, history_prompt)


# Define the Gradio interface
def toggleHistory(choice):
    if choice == True:
        return [gr.Radio.update(visible=True), gr.Radio.update(visible=True)]
    else:
        return [gr.Radio.update(visible=False), gr.Radio.update(visible=False)]


with gr.Blocks() as block:
    gr.Markdown("# TTS Generation WebUI (Bark)")
    with gr.Tab("Models"):
        with gr.Row():
            with gr.Column():
                text_use_gpu = gr.Checkbox(
                    label="Use GPU for text generation", value=True)
                text_use_small = gr.Checkbox(
                    label="Use small model for text generation", value=True)
                coarse_use_gpu = gr.Checkbox(
                    label="Use GPU for coarse-to-fine inference", value=True)
                coarse_use_small = gr.Checkbox(
                    label="Use small model for coarse-to-fine inference", value=True)
                fine_use_gpu = gr.Checkbox(
                    label="Use GPU for fine-tuning", value=True)
                fine_use_small = gr.Checkbox(
                    label="Use small model for fine-tuning", value=False)
                codec_use_gpu = gr.Checkbox(
                    label="Use GPU for codec", value=True)

                load_button = gr.Button(value="Load models")

                def set_to_reload():
                    return gr.Button.update(value="Loading...", interactive=False)

                load_button.click(fn=set_to_reload, inputs=[],
                                  outputs=[load_button])
                load_button.click(fn=init_models, inputs=[
                    text_use_gpu,
                    text_use_small,
                    coarse_use_gpu,
                    coarse_use_small,
                    fine_use_gpu,
                    fine_use_small,
                    codec_use_gpu
                ], outputs=[load_button], show_progress=True)

            with gr.Column():
                gr.Markdown(
                    """
                    # Recommended settings
                    For VRAM >= 10GB, use large models.
                    For VRAM < 10GB, use small models.
                    For VRAM < 4GB, use CPU offloading (unavailable in the UI)
                    `SUNO_OFFLOAD_CPU=1 python server.py`
                """
                )

    with gr.Tab("Generation"):
        useHistory = gr.Checkbox(
            label="Use a voice (History Prompt):", value=False)

        languages = [lang[0] for lang in SUPPORTED_LANGS]
        languageRadio = gr.Radio(languages, type="index", show_label=False,
                                 value="English", visible=False)

        speaker_ids = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        speakerIdRadio = gr.Radio(speaker_ids, type="value",
                                  label="Speaker ID", value="0", visible=False)

        # Show the language and speakerId radios only when useHistory is checked
        useHistory.change(fn=toggleHistory, inputs=[useHistory], outputs=[
            languageRadio, speakerIdRadio])

        prompt = gr.Textbox(label="Prompt", lines=3,
                            placeholder="Enter text here...")

        inputs = [
            prompt,
            useHistory,
            languageRadio,
            speakerIdRadio
        ]
        outputs = gr.Audio(type="filepath", label="Generated audio")
        examples = [
            ["The quick brown fox jumps over the lazy dog."],
            ["To be or not to be, that is the question."],
            ["In a hole in the ground there lived a hobbit."],
            ["This text uses a history prompt, resulting in a more predictable voice.",
                True, "English", "0"],
        ]

        generate_button = gr.Button("Generate", variant="primary")

        prompt.submit(fn=generate, inputs=inputs, outputs=outputs)
        generate_button.click(fn=generate, inputs=inputs, outputs=outputs)

    with gr.Tab("History") as history_tab:
        wav_file_list = []
        def get_wav_files():
            wav_files = glob.glob("outputs/*.wav")
            global wav_file_list
            wav_file_list = wav_files
            return [[file] for file in wav_files]

        _audio_component = gr.Audio(visible=False)
        history_list = gr.Dataset(components=[_audio_component],
                                  samples=get_wav_files(), label="History", samples_per_page=20)
        history_audio = gr.Audio(
            visible=True, type="filepath", label="History")

        def select_audio(selection):
            print("selection", selection)
            print("wav_file_list", wav_file_list)
            filename = wav_file_list[selection]
            return gr.Audio.update(value=filename, label=filename)

        history_list.select(fn=select_audio, inputs=[history_list], outputs=[
                            history_audio], preprocess=False)

        def update_history_tab():
            return gr.Dataset.update(samples=get_wav_files())

    history_tab.select(fn=update_history_tab, inputs=[],
                       outputs=[history_list])

    block.launch(server_name='0.0.0.0')
