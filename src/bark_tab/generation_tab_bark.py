import os
import shutil

import numpy as np
from create_base_filename import create_base_filename
from src.bark_tab.create_voice_string import create_voice_string
from src.bark_tab.generate_and_save_metadata import generate_and_save_metadata
from src.bark_tab.generate_choice_string import generate_choice_string
from src.bark_tab.get_filenames import get_filenames
from src.bark_tab.get_history_prompt import get_history_prompt
from src.bark_tab.log_generation import log_generation
from src.bark_tab.npz_tools import get_npz_files, load_npz, save_npz
from src.bark_tab.parse_or_set_seed import parse_or_set_seed
from src.bark_tab.split_text_functions import split_by_length_simple, split_by_lines
from src.get_date import get_date
from models.bark.bark import SAMPLE_RATE, generate_audio
from scipy.io.wavfile import write as write_wav
from models.bark.bark.generation import SUPPORTED_LANGS
import gradio as gr
from src.save_waveform_plot import save_waveform_plot
from model_manager import model_manager
from config import config
from src.set_seed import set_seed
from src.bark_tab.generate_random_seed import generate_random_seed


value_empty_history = "Empty history"
value_use_voice = "or Use a voice:"
value_use_old_generation = "or Use old generation as history:"
history_settings = [value_empty_history,
                    value_use_voice, value_use_old_generation]

value_short_prompt = "Short prompt (<15s)"
value_split_lines = "Split prompt by lines"
value_split_length = "Split prompt by length"
long_prompt_choices = [value_short_prompt,
                       value_split_lines,
                       #   value_split_length
                       ]

value_reuse_history = "Reuse history"
value_use_voice_history = "Use voice history"
value_empty_history = "Empty history (not recommended)"
long_prompt_history_choices = [
    value_reuse_history, value_use_voice_history, value_empty_history
]


def generate(prompt, history_setting, language=None, speaker_id=0, useV2=False, text_temp=0.7, waveform_temp=0.7, history_prompt=None, seed=None, index=0):
    if not model_manager.models_loaded:
        model_manager.reload_models(config)

    use_voice = history_setting == value_use_voice
    history_prompt, history_prompt_verbal = get_history_prompt(
        language, speaker_id, useV2, history_prompt, use_voice)

    log_generation(prompt, useV2, text_temp, waveform_temp,
                   use_voice, history_prompt_verbal)

    seed = parse_or_set_seed(seed, index)
    full_generation, audio_array = generate_audio(
        prompt, history_prompt=history_prompt, text_temp=text_temp, waveform_temp=waveform_temp, output_full=True)
    set_seed(-1)

    filename, filename_png, filename_npz = save_generation(
        prompt, language, speaker_id, text_temp, waveform_temp, history_prompt, seed, use_voice, history_prompt_verbal, full_generation, audio_array)

    return [filename, filename_png, audio_array, full_generation, filename_npz, seed]


def save_generation(prompt, language, speaker_id, text_temp, waveform_temp, history_prompt, seed, use_voice, history_prompt_verbal, full_generation, audio_array):
    date = get_date()
    base_filename = create_base_filename(
        history_prompt_verbal, "outputs", model="bark", date=date)


    filename, filename_png, filename_json, filename_npz = get_filenames(base_filename)
    save_npz(filename_npz, full_generation)
    write_wav(filename, SAMPLE_RATE, audio_array)
    save_waveform_plot(audio_array, filename_png)

    # Generate metadata for the audio file
    language = SUPPORTED_LANGS[language][0] if use_voice else None
    history_prompt_npz = history_prompt if isinstance(
        history_prompt, str) else None
    speaker_id = speaker_id if use_voice else None
    history_prompt = history_prompt_verbal

    generate_and_save_metadata(prompt, language, speaker_id, text_temp, waveform_temp, seed, filename,
                               date, filename_png, filename_json, history_prompt_npz, filename_npz, history_prompt)

    return filename, filename_png, filename_npz

def save_long_generation(prompt, history_setting, language, speaker_id, text_temp, waveform_temp, seed, filename, pieces):
    base_filename = filename.replace(".wav", "_long")
    audio_array = np.concatenate(pieces)

    date = get_date()
    filename, filename_png, filename_json = get_filenames(base_filename)
    write_wav(filename, SAMPLE_RATE, audio_array)
    save_waveform_plot(audio_array, filename_png)

    # Generate metadata for the audio file
    language = SUPPORTED_LANGS[language][0]
    history_prompt_npz = None
    filename_npz = None
    history_prompt = history_setting

    generate_and_save_metadata(prompt, language, speaker_id, text_temp, waveform_temp, seed, filename,
                               date, filename_png, filename_json, history_prompt_npz, filename_npz, history_prompt)

    return filename, filename_png


def generate_multi(count=1):
    def gen(prompt,
            history_setting,
            language=None,
            speaker_id=0,
            useV2=False,
            text_temp=0.7,
            waveform_temp=0.7,
            long_prompt_radio=value_short_prompt,
            long_prompt_history_radio=value_reuse_history,
            old_generation_filename=None,
            seed=None,
            ):
        history_prompt = None
        print("gen", "old_generation_filename", old_generation_filename)
        if history_setting == value_use_old_generation:
            history_prompt = load_npz(old_generation_filename)

        if long_prompt_radio == value_short_prompt:
            filenames = []
            for i in range(count):
                filename, filename_png, _, _, filename_npz, seed = generate(
                    prompt, history_setting, language, speaker_id, useV2, text_temp=text_temp, waveform_temp=waveform_temp, history_prompt=history_prompt, seed=seed, index=i)
                filenames.extend((filename, filename_png, filename_npz, seed))
                # yield filenames
            return filenames

        prompts = split_by_lines(
            prompt) if long_prompt_radio == value_split_lines else split_by_length_simple(prompt)
        filenames = []

        for i in range(count):
            pieces = []
            last_piece_history = None
            # This will work when value_reuse_history is selected
            if history_setting == value_use_old_generation:
                last_piece_history = history_prompt
            for prompt_piece in prompts:
                if long_prompt_history_radio == value_reuse_history:
                    history_prompt = last_piece_history
                elif long_prompt_history_radio == value_use_voice_history:
                    history_prompt = create_voice_string(
                        language, speaker_id, useV2)
                elif long_prompt_history_radio == value_empty_history:
                    history_prompt = None

                filename, filename_png, audio_array, last_piece_history, filename_npz, seed = generate(
                    prompt_piece, history_setting, language, speaker_id, useV2, text_temp=text_temp, waveform_temp=waveform_temp, history_prompt=history_prompt, seed=seed, index=i)
                pieces += [audio_array]

            filename, filename_png = save_long_generation(
                prompt, history_setting, language, speaker_id, text_temp, waveform_temp, seed, filename, pieces)

            filenames.extend((filename, filename_png, filename_npz, seed))
        return filenames
    return gen


def generation_tab_bark(tabs):
    with gr.Tab(label="Generation (Bark)", id="generation_bark") as tab_bark:
        history_setting = gr.Radio(
            history_settings,
            value="Empty history",
            type="value",
            label="History Prompt (voice) setting:"
        )

        useV2, choice_string, languageRadio, speakerIdRadio = setup_bark_voice_prompt_ui()

        # Show the language and speakerId radios only when useHistory is checked
        history_setting.change(
            fn=lambda choice: [
                gr.Radio.update(visible=(choice == value_use_voice)),
                gr.Radio.update(visible=(choice == value_use_voice)),
                gr.Checkbox.update(visible=(choice == value_use_voice)),
                gr.Markdown.update(visible=(choice == value_use_voice)),
            ],
            inputs=[history_setting],
            outputs=[languageRadio, speakerIdRadio, useV2, choice_string])

        with gr.Row():
            old_generation_dropdown = gr.Dropdown(
                label="Old generation",
                choices=get_npz_files(),
                type="value",
                show_label=False,
                value=None,
                allow_custom_value=True,
                visible=False
            )
            old_generation_dropdown.style(container=False)
            copy_old_generation_button = gr.Button(
                "save", visible=False, elem_classes="btn-sm material-symbols-outlined")
            copy_old_generation_button.style(size="sm")
            copy_old_generation_button.click(fn=lambda x: [
                shutil.copy(x, os.path.join("voices", os.path.basename(x))),
            ], inputs=[old_generation_dropdown])

            reload_old_generation_dropdown = gr.Button(
                "refresh", visible=False, elem_classes="btn-sm material-symbols-outlined")
            reload_old_generation_dropdown.style(size="sm")

            reload_old_generation_dropdown.click(fn=lambda: gr.Dropdown.update(choices=get_npz_files()),
                                                 outputs=old_generation_dropdown)

        history_setting.change(
            fn=lambda choice: [
                gr.Dropdown.update(
                    visible=(choice == value_use_old_generation)),
                gr.Button.update(visible=(choice == value_use_old_generation)),
                gr.Button.update(visible=(choice == value_use_old_generation)),
            ],
            inputs=[history_setting],
            outputs=[old_generation_dropdown, copy_old_generation_button, reload_old_generation_dropdown])

        with gr.Row():
            with gr.Column():
                long_prompt_radio = gr.Radio(
                    long_prompt_choices, type="value", label="Prompt type", value=value_short_prompt, show_label=False)
                long_prompt_history_radio = gr.Radio(
                    long_prompt_history_choices, type="value", label="For each subsequent generation:", value=value_reuse_history)
            with gr.Column():
                text_temp = gr.Slider(label="Text temperature",
                                      value=0.7, minimum=0.0, maximum=1.2, step=0.05)
                waveform_temp = gr.Slider(
                    label="Waveform temperature", value=0.7, minimum=0.0, maximum=1.2, step=0.05)
                with gr.Column():
                    gr.Markdown("Seed")
                    with gr.Row():
                        last_seed_1 = gr.State()
                        last_seed_2 = gr.State()
                        last_seed_3 = gr.State()

                        seed_input = gr.Textbox(value="-1", show_label=False)
                        seed_input.style(container=False)
                        set_random_seed_button = gr.Button(
                            "backspace", elem_classes="btn-sm material-symbols-outlined")

                        set_random_seed_button.style(size="sm")
                        set_random_seed_button.click(
                            fn=lambda: gr.Textbox.update(value="-1"), outputs=[seed_input])

                        set_old_seed_button = gr.Button(
                            "repeat", elem_classes="btn-sm material-symbols-outlined")

                        set_old_seed_button.style(size="sm")
                        set_old_seed_button.click(fn=lambda x: gr.Textbox.update(value=str(x)),
                                                  inputs=[last_seed_1],
                                                  outputs=[seed_input])

        prompt = gr.Textbox(label="Prompt", lines=3,
                            placeholder="Enter text here...")

        inputs = [
            prompt,
            history_setting,
            languageRadio,
            speakerIdRadio,
            useV2,
            text_temp,
            waveform_temp,
            long_prompt_radio,
            long_prompt_history_radio,
            old_generation_dropdown,
            seed_input,
        ]

        voice_inputs = [
            useV2,
            languageRadio,
            speakerIdRadio
        ]

        for i in voice_inputs:
            i.change(
                fn=generate_choice_string,
                inputs=voice_inputs,
                outputs=[choice_string])

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

        with gr.Row():
            continue_button_1 = gr.Button("Use as history", visible=False)
            continue_button_2 = gr.Button("Use as history", visible=False)
            continue_button_3 = gr.Button("Use as history", visible=False)

        continue_button_1_data = gr.State()
        continue_button_2_data = gr.State()
        continue_button_3_data = gr.State()

        continue_button_1.click(fn=insert_npz_file, inputs=[
                                continue_button_1_data], outputs=[old_generation_dropdown, history_setting])
        continue_button_2.click(fn=insert_npz_file, inputs=[
                                continue_button_2_data], outputs=[old_generation_dropdown, history_setting])
        continue_button_3.click(fn=insert_npz_file, inputs=[
                                continue_button_3_data], outputs=[old_generation_dropdown, history_setting])

        def register_use_as_history_button(button, source):
            button.click(fn=lambda value: {
                old_generation_dropdown: value,
                history_setting: value_use_old_generation,
                tabs: gr.Tabs.update(selected="generation_bark"),
            }, inputs=[source],
                outputs=[old_generation_dropdown, history_setting, tabs])

        outputs = [audio_1, image_1, continue_button_1_data, last_seed_1]
        outputs2 = [audio_2, image_2, continue_button_2_data, last_seed_2]
        outputs3 = [audio_3, image_3, continue_button_3_data, last_seed_3]

        with gr.Row():
            generate3_button = gr.Button("Generate 3")
            generate2_button = gr.Button("Generate 2")
            generate1_button = gr.Button("Generate", variant="primary")

        prompt.submit(fn=generate_multi(1), inputs=inputs, outputs=outputs)
        generate1_button.click(fn=generate_multi(1), inputs=inputs,
                               outputs=outputs)
        generate2_button.click(fn=generate_multi(2), inputs=inputs,
                               outputs=outputs + outputs2)
        generate3_button.click(fn=generate_multi(3), inputs=inputs,
                               outputs=outputs + outputs2 + outputs3)


        setup_show_hide_outputs(audio_1, audio_2, audio_3, image_1, image_2, image_3, continue_button_1, continue_button_2, continue_button_3, generate3_button, generate2_button, generate1_button)

    return register_use_as_history_button

def setup_bark_voice_prompt_ui():
    with gr.Row():
        useV2 = gr.Checkbox(
                label="Use V2", value=False, visible=False)
        choice_string = gr.Markdown(
                "Chosen voice: en_speaker_0, Gender: Unknown", visible=False)

    languages = [lang[0] for lang in SUPPORTED_LANGS]
    languageRadio = gr.Radio(languages, type="index", show_label=False,
                                 value="English", visible=False)

    speaker_ids = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
    speakerIdRadio = gr.Radio(speaker_ids, type="value",
                                  label="Speaker ID", value="0", visible=False)
                              
    return useV2,choice_string,languageRadio,speakerIdRadio

def setup_show_hide_outputs(audio_1, audio_2, audio_3, image_1, image_2, image_3, continue_button_1, continue_button_2, continue_button_3, generate3_button, generate2_button, generate1_button):
    def show(count): return [
        gr.Audio.update(visible=True),
        gr.Image.update(visible=True),
        gr.Button.update(visible=True),
        gr.Audio.update(visible=count > 1),
        gr.Image.update(visible=count > 1),
        gr.Button.update(visible=count > 1),
        gr.Audio.update(visible=count > 2),
        gr.Image.update(visible=count > 2),
        gr.Button.update(visible=count > 2),
    ]

    view_outputs = [audio_1, image_1, continue_button_1]
    view_outputs2 = [audio_2, image_2, continue_button_2]
    view_outputs3 = [audio_3, image_3, continue_button_3]
    all_viw_outputs = view_outputs + view_outputs2 + view_outputs3

    generate1_button.click(fn=lambda: show(1), outputs=all_viw_outputs)
    generate2_button.click(fn=lambda: show(2), outputs=all_viw_outputs)
    generate3_button.click(fn=lambda: show(3), outputs=all_viw_outputs)


def insert_npz_file(npz_filename):
    return [
        gr.Dropdown.update(value=npz_filename),
        gr.Radio.update(value=value_use_old_generation),
    ]

