import shutil
import dotenv_init
import matplotlib
import matplotlib.pyplot as plt
import gradio as gr
from models.bark.bark.generation import SUPPORTED_LANGS, preload_models
from scipy.io.wavfile import write as write_wav
from models.bark.bark import SAMPLE_RATE, generate_audio
import json
import os
import glob
import datetime

dotenv_init.init()
matplotlib.use('agg')
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
    if not os.path.exists('favorites'):
        os.makedirs('favorites')
    if not os.path.exists('.env'):
        print("Env file not found. Creating default env.")
        with open('.env', 'w') as outfile:
            outfile.write(f"""
# Due to implementation, only empty string is False,
#  everything else is True
# Duplicates small models checkboxes
SUNO_USE_SMALL_MODELS=
# Use MPS when CUDA is unavailable
SUNO_ENABLE_MPS=
# Offload GPU models to CPU
SUNO_OFFLOAD_CPU=
""")


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


are_models_loaded = False


def reload_models():
    global are_models_loaded
    are_models_loaded = True
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

def open_favorites_folder():
    os.startfile("favorites")

def delete_generation_cb(refresh):
    def delete_generation(json):
        os.remove(json["filename"])
        os.remove(json["filename_png"])
        os.remove(json["filename_json"])

        return refresh()

    return delete_generation

def generate(prompt, useHistory, language=None, speaker_id=0, text_temp=0.7, waveform_temp=0.7):
    if not are_models_loaded:
        reload_models()

    # generate audio from text
    history_prompt = f"{SUPPORTED_LANGS[language][1]}_speaker_{speaker_id}" if useHistory else None

    print("Generating:", prompt, "history_prompt:", history_prompt, "text_temp:", text_temp, "waveform_temp:", waveform_temp)
    audio_array = generate_audio(prompt, history_prompt=history_prompt, text_temp=text_temp, waveform_temp=waveform_temp)

    # get current date for file
    now = datetime.datetime.now()
    date = now.strftime("%Y-%m-%d_%H-%M-%S")

    base_filename = f"outputs/audio__{history_prompt}__{date}"
    # To save audio_array as a WAV file:
    filename = f"{base_filename}.wav"
    # See if metadata can be added to the file
    write_wav(filename, SAMPLE_RATE, audio_array)
    # Plot the waveform using matplotlib
    plt.figure(figsize=(10, 3))
    plt.plot(audio_array)
    plt.axis("off")
    # Return the plot as an image
    filename_png = f"{base_filename}.png"
    plt.savefig(filename_png)

    filename_json = f"{base_filename}.json"
    # Generate metadata for the audio file
    metadata = {
        "prompt": prompt,
        "language": SUPPORTED_LANGS[language][0] if useHistory else None,
        "speaker_id": speaker_id if useHistory else None,
        "history_prompt": history_prompt,
        "text_temp": text_temp,
        "waveform_temp": waveform_temp,
        "date": date,
        "filename": filename,
        "filename_png": filename_png,
        "filename_json": filename_json,
    }
    with open(filename_json, "w") as outfile:
        json.dump(metadata, outfile, indent=2)

    return [filename, filename_png]


def generate_multi(count=1):
    def gen(prompt, useHistory, language=None, speaker_id=0, text_temp=0.7, waveform_temp=0.7):
        filenames = []
        for i in range(count):
            filename, filename_png = generate(prompt, useHistory, language, speaker_id, text_temp=text_temp, waveform_temp=waveform_temp)
            filenames.append(filename)
            filenames.append(filename_png)
        return filenames
    return gen

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

        with gr.Row():
            text_temp = gr.Slider(label="Text temperature", value=0.7, minimum=0.0, maximum=1.0, step=0.1)
            waveform_temp = gr.Slider(label="Waveform temperature", value=0.7, minimum=0.0, maximum=1.0, step=0.1)

        prompt = gr.Textbox(label="Prompt", lines=3,
                            placeholder="Enter text here...")

        inputs = [
            prompt,
            useHistory,
            languageRadio,
            speakerIdRadio,
            text_temp,
            waveform_temp
        ]

        with gr.Row():
            audio_1 = gr.Audio(type="filepath", label="Generated audio")
            audio_2 = gr.Audio(
                type="filepath", label="Generated audio", visible=False)
            audio_3 = gr.Audio(
                type="filepath", label="Generated audio", visible=False)

        with gr.Row():
            image_1 = gr.Image(label="Waveform")
            image_2 = gr.Image(label="Waveform", visible=False)
            image_3 = gr.Image(label="Waveform", visible=False)

        outputs = [audio_1, image_1]
        outputs2 = [audio_2, image_2]
        outputs3 = [audio_3, image_3]
        examples = [
            ["The quick brown fox jumps over the lazy dog."],
            ["To be or not to be, that is the question."],
            ["In a hole in the ground there lived a hobbit."],
            ["This text uses a history prompt, resulting in a more predictable voice.",
                True, "English", "0"],
        ]

        with gr.Row():
            generate3_button = gr.Button("Generate 3")
            generate2_button = gr.Button("Generate 2")
            generate1_button = gr.Button("Generate", variant="primary")

        prompt.submit(fn=generate, inputs=inputs, outputs=outputs)
        generate1_button.click(fn=generate, inputs=inputs, outputs=outputs)
        generate2_button.click(fn=generate_multi(2), inputs=inputs,
                               outputs=outputs + outputs2)
        generate3_button.click(fn=generate_multi(3), inputs=inputs,
                               outputs=outputs + outputs2 + outputs3)

        def show_closure(count):
            def show():
                return [
                    gr.Audio.update(visible=True),
                    gr.Image.update(visible=True),
                    gr.Audio.update(visible=count > 1),
                    gr.Image.update(visible=count > 1),
                    gr.Audio.update(visible=count > 2),
                    gr.Image.update(visible=count > 2),
                ]
            return show

        generate1_button.click(fn=show_closure(1), outputs=outputs + outputs2 + outputs3)
        generate2_button.click(fn=show_closure(2), outputs=outputs + outputs2 + outputs3)
        generate3_button.click(fn=show_closure(3), outputs=outputs + outputs2 + outputs3)

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
        history_image = gr.Image()
        history_json = gr.JSON()
        
        def save_to_favorites(json_text):
            shutil.copy(json_text["filename"], "favorites/")
            shutil.copy(json_text["filename_png"], "favorites/")
            # write new json file with new filename
            json_text["filename"] = json_text["filename"].replace("outputs/", "favorites/")
            json_text["filename_png"] = json_text["filename_png"].replace("outputs/", "favorites/")
            json_text["filename_json"] = json_text["filename_json"].replace("outputs/", "favorites/")
            with open(json_text["filename_json"].replace("outputs/", "favorites/"), "w") as f:
                json.dump(json_text, f, indent=2)
            return gr.Button.update(value="Saved")

        with gr.Row():
            delete_from_history = gr.Button(value="Delete", variant="stop", visible=False)
            save_to_favorites_history = gr.Button(value="Save to favorites", variant="primary", visible=False)

        save_to_favorites_history.click(fn=save_to_favorites, inputs=history_json, outputs=save_to_favorites_history)

        def select_audio(selection):
            filename = wav_file_list[selection]
            with open(filename.replace(".wav", ".json")) as f:
                json_text = json.load(f)
            return [
                gr.Audio.update(value=filename, label=filename),
                gr.Image.update(value=filename.replace(".wav", ".png")),
                gr.JSON.update(value=json_text),
                gr.Button.update(visible=True),
                gr.Button.update(visible=True, value="Save to favorites"),
            ]

        history_list.select(fn=select_audio, inputs=[history_list], outputs=[
                            history_audio, history_image, history_json, delete_from_history, save_to_favorites_history], preprocess=False)

        def update_history_tab():
            return gr.Dataset.update(samples=get_wav_files())

        delete_from_history.click(fn=delete_generation_cb(update_history_tab), inputs=history_json, outputs=[history_list])
        history_tab.select(fn=update_history_tab, outputs=[history_list])

    with gr.Tab("Favorites") as favorites_tab:

        with gr.Row():
            button_output = gr.Button(value="Open favorites folder")
        button_output.click(open_favorites_folder)

        wav_file_list_favorites = []

        def get_wav_files_favorites():
            wav_files = glob.glob("favorites/*.wav")
            global wav_file_list_favorites
            wav_file_list_favorites = wav_files
            return [[file] for file in wav_files]

        _audio_component = gr.Audio(visible=False)
        favorites_list = gr.Dataset(components=[_audio_component],
                                  samples=get_wav_files_favorites(), label="Favorites", samples_per_page=20)
        favorites_audio = gr.Audio(
            visible=True, type="filepath", label="Favorites")
        favorites_image = gr.Image()
        favorites_json = gr.JSON()
        
        with gr.Row():
            delete_from_favorites = gr.Button(value="Delete", variant="stop", visible=False)

        def select_audio(selection):
            filename = wav_file_list_favorites[selection]
            with open(filename.replace(".wav", ".json")) as f:
                json_text = json.load(f)
            return [
                gr.Audio.update(value=filename, label=filename),
                gr.Image.update(value=filename.replace(".wav", ".png")),
                gr.JSON.update(value=json_text),
                gr.Button.update(visible=True),
            ]

        def clear_audio():
            return [
                gr.Audio.update(value=None, label=""),
                gr.Image.update(value=None),
                gr.JSON.update(value=None),
                gr.Button.update(visible=False),
            ]

        favorites_list.select(fn=select_audio, inputs=[favorites_list], outputs=[
                            favorites_audio, favorites_image, favorites_json, delete_from_favorites], preprocess=False)

        def update_favorites_tab():
            return gr.Dataset.update(samples=get_wav_files_favorites())

        delete_from_favorites.click(fn=clear_audio, outputs=[favorites_audio, favorites_image, favorites_json, delete_from_favorites])
        delete_from_favorites.click(fn=delete_generation_cb(update_favorites_tab), inputs=favorites_json, outputs=[favorites_list])
        favorites_tab.select(fn=update_favorites_tab, outputs=[favorites_list])

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
                ENV_SMALL_MODELS = os.environ.get(
                    "SUNO_USE_SMALL_MODELS", "").lower() in ("true", "1")
                ENV_ENABLE_MPS = os.environ.get(
                    "SUNO_ENABLE_MPS", "").lower() in ("true", "1")
                ENV_OFFLOAD_CPU = os.environ.get(
                    "SUNO_OFFLOAD_CPU", "").lower() in ("true", "1")
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
# Due to implementation, only empty string is False,
#  everything else is True
# Duplicates small models checkboxes
SUNO_USE_SMALL_MODELS={"" if not environment_suno_use_small_models else environment_suno_use_small_models}
# Use MPS when CUDA is unavailable
SUNO_ENABLE_MPS={"" if not environment_suno_enable_mps else environment_suno_enable_mps}
# Offload GPU models to CPU
SUNO_OFFLOAD_CPU={"" if not environment_suno_offload_cpu else environment_suno_offload_cpu}
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

    block.launch(server_name='0.0.0.0')
