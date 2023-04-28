import gradio as gr
from models.bark.bark.generation import SUPPORTED_LANGS, preload_models
from scipy.io.wavfile import write as write_wav
from models.bark.bark import SAMPLE_RATE, generate_audio
import json
import os
import glob
import datetime
from dotenv import load_dotenv
load_dotenv()


config = None


def setup_or_recover():
    if not os.path.exists('config.json'):
        print("Config file not found. Creating default config.")
        with open('config.json', 'w') as outfile:
            json.dump({
                "model": {
                    "text_use_gpu": True,
                    "text_use_small": True,
                    "coarse_use_gpu": True,
                    "coarse_use_small": True,
                    "fine_use_gpu": True,
                    "fine_use_small": False,
                    "codec_use_gpu": True,
                    "load_models_on_startup": True
                },
                "load_models_on_startup": True
            }, outfile, indent=2)
    if not os.path.exists('outputs'):
        os.makedirs('outputs')
    if not os.path.exists('.env'):
        print("Env file not found. Creating default env.")
        with open('.env', 'w') as outfile:
            outfile.write(
                "SUNO_USE_SMALL_MODELS=False\nSUNO_ENABLE_MPS=False\nSUNO_OFFLOAD_CPU=False\n")


setup_or_recover()


def load_config():
    global config
    with open('config.json', 'r') as infile:
        config = json.load(infile)


load_config()


def save_config(text_use_gpu,
                text_use_small,
                coarse_use_gpu,
                coarse_use_small,
                fine_use_gpu,
                fine_use_small,
                codec_use_gpu,
                load_models_on_startup=False
                ):
    global config
    config["model"]["text_use_gpu"] = text_use_gpu
    config["model"]["text_use_small"] = text_use_small
    config["model"]["coarse_use_gpu"] = coarse_use_gpu
    config["model"]["coarse_use_small"] = coarse_use_small
    config["model"]["fine_use_gpu"] = fine_use_gpu
    config["model"]["fine_use_small"] = fine_use_small
    config["model"]["codec_use_gpu"] = codec_use_gpu
    config["load_models_on_startup"] = load_models_on_startup
    with open('config.json', 'w') as outfile:
        json.dump(config, outfile, indent=2)

    return "Saved: " + str(config)


def reload_models():
    preload_models(
        text_use_gpu=config["model"]["text_use_gpu"],
        text_use_small=config["model"]["text_use_small"],
        coarse_use_gpu=config["model"]["coarse_use_gpu"],
        coarse_use_small=config["model"]["coarse_use_small"],
        fine_use_gpu=config["model"]["fine_use_gpu"],
        fine_use_small=config["model"]["fine_use_small"],
        codec_use_gpu=config["model"]["codec_use_gpu"],
        force_reload=True,
    )


if config["load_models_on_startup"]:
    reload_models()


def load_models(
    text_use_gpu,
    text_use_small,
    coarse_use_gpu,
    coarse_use_small,
    fine_use_gpu,
    fine_use_small,
    codec_use_gpu
):

    save_config(text_use_gpu,
                text_use_small,
                coarse_use_gpu,
                coarse_use_small,
                fine_use_gpu,
                fine_use_small,
                codec_use_gpu)
    # download and load all models
    reload_models()
    return gr.Button.update(value="Reload models", interactive=True)


def open_outputs_folder():
    os.startfile("outputs")


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

        with gr.Row():
            button_output = gr.Button(value="Open outputs folder")
        button_output.click(open_outputs_folder)

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

    with gr.Tab("Settings") as settings_tab:
        with gr.Row():
            with gr.Column():
                load_models_on_startup = gr.Checkbox(
                    label="Load models on startup", value=config["load_models_on_startup"])

                text_use_gpu = gr.Checkbox(
                    label="Use GPU for text generation", value=config["model"]["text_use_gpu"])
                text_use_small = gr.Checkbox(
                    label="Use small model for text generation", value=config["model"]["text_use_small"])
                coarse_use_gpu = gr.Checkbox(
                    label="Use GPU for coarse-to-fine inference", value=config["model"]["coarse_use_gpu"])
                coarse_use_small = gr.Checkbox(
                    label="Use small model for coarse-to-fine inference", value=config["model"]["coarse_use_small"])
                fine_use_gpu = gr.Checkbox(
                    label="Use GPU for fine-tuning", value=config["model"]["fine_use_gpu"])
                fine_use_small = gr.Checkbox(
                    label="Use small model for fine-tuning", value=config["model"]["fine_use_small"])
                codec_use_gpu = gr.Checkbox(
                    label="Use GPU for codec", value=config["model"]["codec_use_gpu"])

                save_beacon = gr.Markdown("")

                gr.Markdown("""
                    ## Environment variables
                    (Requires restart)
                """)
                ENV_SMALL_MODELS = os.environ.get("SUNO_USE_SMALL_MODELS", "").lower() in ("true", "1")
                ENV_ENABLE_MPS = os.environ.get("SUNO_ENABLE_MPS", "").lower() in ("true", "1")
                ENV_OFFLOAD_CPU = os.environ.get("SUNO_OFFLOAD_CPU", "").lower() in ("true", "1")
                environment_suno_use_small_models = gr.Checkbox(
                    label="Use small models", value=ENV_SMALL_MODELS)

                environment_suno_enable_mps = gr.Checkbox(
                    label="Enable MPS", value=ENV_ENABLE_MPS)

                environment_suno_offload_cpu = gr.Checkbox(
                    label="Offload GPU models to CPU", value=ENV_OFFLOAD_CPU)

                save_environment_button = gr.Button(
                    value="Save Environment Variables and Exit")

                def save_environment_variables(
                    environment_suno_use_small_models,
                    environment_suno_enable_mps,
                    environment_suno_offload_cpu
                ):
                    os.environ["SUNO_USE_SMALL_MODELS"] = str(
                        environment_suno_use_small_models)
                    os.environ["SUNO_ENABLE_MPS"] = str(
                        environment_suno_enable_mps)
                    os.environ["SUNO_OFFLOAD_CPU"] = str(
                        environment_suno_offload_cpu)
                    with open('.env', 'w') as outfile:
                        outfile.write(f"""
                            SUNO_USE_SMALL_MODELS={environment_suno_use_small_models}  # Duplicates small models checkboxes
                            SUNO_ENABLE_MPS={environment_suno_enable_mps}  # Use MPS when CUDA is unavailable
                            SUNO_OFFLOAD_CPU={environment_suno_offload_cpu}  # Offload GPU models to CPU
                        """)
                    os._exit(0)

                save_environment_button.click(fn=save_environment_variables,
                                              inputs=[
                                                  environment_suno_use_small_models,
                                                  environment_suno_enable_mps,
                                                  environment_suno_offload_cpu
                                              ])

                inputs = [
                    text_use_gpu,
                    text_use_small,
                    coarse_use_gpu,
                    coarse_use_small,
                    fine_use_gpu,
                    fine_use_small,
                    codec_use_gpu,
                    load_models_on_startup
                ]

                for input in inputs:
                    input.change(fn=save_config, inputs=inputs,
                                 outputs=[save_beacon])

                def sync_ui():
                    return [
                        gr.Checkbox.update(
                            value=config["model"]["text_use_gpu"]),
                        gr.Checkbox.update(
                            value=config["model"]["text_use_small"]),
                        gr.Checkbox.update(
                            value=config["model"]["coarse_use_gpu"]),
                        gr.Checkbox.update(
                            value=config["model"]["coarse_use_small"]),
                        gr.Checkbox.update(
                            value=config["model"]["fine_use_gpu"]),
                        gr.Checkbox.update(
                            value=config["model"]["fine_use_small"]),
                        gr.Checkbox.update(
                            value=config["model"]["codec_use_gpu"]),
                        gr.Checkbox.update(
                            value=config["load_models_on_startup"]),
                    ]
                settings_tab.select(fn=sync_ui, outputs=inputs)

                def set_to_reload():
                    return gr.Button.update(value="Loading...", interactive=False)



            with gr.Column():
                gr.Markdown(
                    """
                    # Recommended settings
                    For VRAM >= 10GB, use large models.
                    For VRAM < 10GB, use small models.
                    For VRAM < 4GB, use CPU offloading (requires restart).
                """
                )
                
                load_button = gr.Button(
                    value="Reload models" if config["load_models_on_startup"] else "Load models")

                load_button.click(fn=set_to_reload, inputs=[],
                                  outputs=[load_button])
                load_button.click(fn=load_models, inputs=[
                    text_use_gpu,
                    text_use_small,
                    coarse_use_gpu,
                    coarse_use_small,
                    fine_use_gpu,
                    fine_use_small,
                    codec_use_gpu
                ], outputs=[load_button], show_progress=True)

    history_tab.select(fn=update_history_tab, inputs=[],
                       outputs=[history_list])

    block.launch(server_name='0.0.0.0')
