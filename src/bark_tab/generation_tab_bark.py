import os
import shutil

import numpy as np
from create_base_filename import create_base_filename
from ..history_tab.save_to_favorites import save_to_favorites
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

bark_css = """
.generating {
    pointer-events: none;
}
.tts-audio > .empty.small.unpadded_box {
    padding: var(--size-2);
    width: var(--size-full);
    height: var(--size-14);
    min-height: var(--size-14);
}
.tts-image > .empty.large.unpadded_box {
    height: 150px;
    min-height: 150px;
}
"""


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

    filename, filename_png, filename_npz, metadata = save_generation(
        prompt, language, speaker_id, text_temp, waveform_temp, history_prompt, seed, use_voice, history_prompt_verbal, full_generation, audio_array)

    return [filename, filename_png, audio_array, full_generation, filename_npz, seed, metadata]


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

    metadata = generate_and_save_metadata(prompt, language, speaker_id, text_temp, waveform_temp, seed, filename,
                                          date, filename_png, filename_json, history_prompt_npz, filename_npz, history_prompt)

    return filename, filename_png, filename_npz, metadata


def save_long_generation(prompt, history_setting, language, speaker_id, text_temp, waveform_temp, seed, filename, pieces, full_generation=None):
    base_filename = filename.replace(".wav", "_long")
    audio_array = np.concatenate(pieces)

    date = get_date()
    filename, filename_png, filename_json, filename_npz = get_filenames(base_filename)
    save_npz(filename_npz, full_generation)
    write_wav(filename, SAMPLE_RATE, audio_array)
    save_waveform_plot(audio_array, filename_png)

    # Generate metadata for the audio file
    language = SUPPORTED_LANGS[language][0]
    history_prompt_npz = None
    history_prompt = history_setting

    metadata = generate_and_save_metadata(prompt, language, speaker_id, text_temp, waveform_temp, seed, filename,
                                          date, filename_png, filename_json, history_prompt_npz, filename_npz, history_prompt)

    return filename, filename_png, filename_npz, metadata


def generate_multi(count=1, outputs_ref=None):
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

        for i in range(count):
            yield {
                outputs_ref[i][0]: None,
                outputs_ref[i][1]: None,
                outputs_ref[i][2]: gr.Button.update(value="Save to favorites", visible=False),
                outputs_ref[i][3]: gr.Button.update(visible=False),
                outputs_ref[i][4]: None,
                outputs_ref[i][5]: None,
                outputs_ref[i][6]: None
            }

        if long_prompt_radio == value_short_prompt:
            outputs = []
            for i in range(count):
                filename, filename_png, _, _, filename_npz, seed, metadata = generate(
                    prompt, history_setting, language, speaker_id, useV2, text_temp=text_temp, waveform_temp=waveform_temp, history_prompt=history_prompt, seed=seed, index=i)
                outputs.extend((filename, filename_png, gr.Button.update(
                    value="Save to favorites", visible=True), gr.Button.update(visible=True), filename_npz, seed, metadata))
                yield {
                    outputs_ref[i][0]: filename,
                    outputs_ref[i][1]: filename_png,
                    outputs_ref[i][2]: gr.Button.update(value="Save to favorites", visible=True),
                    outputs_ref[i][3]: gr.Button.update(visible=True),
                    outputs_ref[i][4]: filename_npz,
                    outputs_ref[i][5]: seed,
                    outputs_ref[i][6]: metadata
                }
            return {}

        prompts = split_by_lines(
            prompt) if long_prompt_radio == value_split_lines else split_by_length_simple(prompt)
        outputs = []

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

                filename, filename_png, audio_array, last_piece_history, filename_npz, seed, _metadata = generate(
                    prompt_piece, history_setting, language, speaker_id, useV2, text_temp=text_temp, waveform_temp=waveform_temp, history_prompt=history_prompt, seed=seed, index=i)
                pieces += [audio_array]
                yield {
                    outputs_ref[i][0]: gr.Audio.update(value=filename, label=f"Generated audio fragment... `{prompt_piece}`"),
                    outputs_ref[i][1]: filename_png,
                    outputs_ref[i][2]: gr.Button.update(value="Save to favorites", visible=True),
                    outputs_ref[i][3]: gr.Button.update(visible=True),
                    outputs_ref[i][4]: filename_npz,
                    outputs_ref[i][5]: seed,
                    outputs_ref[i][6]: _metadata
                }

            filename, filename_png, filename_npz, metadata = save_long_generation(
                prompt, history_setting, language, speaker_id, text_temp, waveform_temp, seed, filename, pieces, full_generation=last_piece_history)

            outputs.extend((filename, filename_png, gr.Button.update(
                value="Save to favorites", visible=True), gr.Button.update(visible=True), filename_npz, seed, metadata))
            yield {
                outputs_ref[i][0]: gr.Audio.update(value=filename, label="Generated audio"),
                outputs_ref[i][1]: filename_png,
                outputs_ref[i][2]: gr.Button.update(value="Save to favorites", visible=True),
                outputs_ref[i][3]: gr.Button.update(visible=True),
                outputs_ref[i][4]: filename_npz,
                outputs_ref[i][5]: seed,
                outputs_ref[i][6]: metadata
            }
        return {}
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
                    seed_input, set_old_seed_button = setup_seed_ui()

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

        MAX_OUTPUTS = 9

        with gr.Row():
            output_components, output_cols, seeds = map(list, zip(
                *[create_components(old_generation_dropdown, history_setting, index) for index in range(MAX_OUTPUTS)]
            ))

        seed_1 = seeds[0]

        all_outputs_flat = [
            item for sublist in output_components for item in sublist]

        total_columns = len(output_cols)

        def show(count):
            return [gr.Column.update(visible=count > i) for i in range(total_columns)]

        def generate_button(text, count, variant=None):
            button = gr.Button(text, variant=variant)
            button.click(fn=lambda: show(count), outputs=output_cols)
            button.click(fn=generate_multi(count, output_components),
                         inputs=inputs, outputs=all_outputs_flat)
            return button

        with gr.Row():
            for i in range(total_columns):
                num_columns = total_columns - i
                generate_button(f"Generate {num_columns if num_columns > 1 else ''}",
                                num_columns,
                                variant="primary" if num_columns == 1 else None)

        prompt.submit(fn=lambda: show(1), outputs=output_cols)
        prompt.submit(fn=generate_multi(1, output_components),
                      inputs=inputs, outputs=all_outputs_flat)

        set_old_seed_button.click(fn=lambda x: gr.Textbox.update(value=str(x)),
                                  inputs=[seed_1],
                                  outputs=[seed_input])

    def register_use_as_history_button(button, source):
        button.click(fn=lambda value: {
            old_generation_dropdown: value,
            history_setting: value_use_old_generation,
            tabs: gr.Tabs.update(selected="generation_bark"),
        }, inputs=[source],
            outputs=[old_generation_dropdown, history_setting, tabs])

    return register_use_as_history_button


def setup_seed_ui():
    gr.Markdown("Seed")
    with gr.Row():
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
    return seed_input, set_old_seed_button


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

    return useV2, choice_string, languageRadio, speakerIdRadio


def insert_npz_file(npz_filename):
    return [
        gr.Dropdown.update(value=npz_filename),
        gr.Radio.update(value=value_use_old_generation),
    ]


def create_components(old_generation_dropdown, history_setting, index):
    with gr.Column(visible=index == 0) as col:
        audio = gr.Audio(type="filepath", label="Generated audio", elem_classes="tts-audio")
        image = gr.Image(label="Waveform", shape=(None, 100), elem_classes="tts-image")
        with gr.Row():
            save_button = gr.Button("Save to favorites", visible=False)
            continue_button = gr.Button("Use as history", visible=False)
        npz = gr.State()
        seed = gr.State()
        json_text = gr.State()

        continue_button.click(fn=insert_npz_file, inputs=[npz], outputs=[
                              old_generation_dropdown, history_setting])
        save_button.click(fn=save_to_favorites, inputs=[
                          json_text], outputs=[save_button])

        return [audio, image, save_button, continue_button, npz, seed, json_text], col, seed
