import os
import shutil

import numpy as np
import gradio as gr
from bark import SAMPLE_RATE
from scipy.io.wavfile import write as write_wav
from bark.generation import SUPPORTED_LANGS

from src.bark.ICON_ELEM_CLASS import ICON_ELEM_CLASS
from src.bark.setup_seed_ui_bark import setup_seed_ui_bark
from src.bark.BarkParams import BarkParams
from src.extensions_loader.ext_callback_save_generation import (
    ext_callback_save_generation,
)
from src.utils.create_base_filename import create_base_filename
from src.history_tab.save_to_favorites import save_to_favorites
from src.bark.generate_and_save_metadata import generate_and_save_metadata
from src.bark.generate_choice_string import generate_choice_string
from src.bark.get_filenames import get_filenames
from src.bark.get_history_prompt import get_history_prompt
from src.bark.log_generation import middleware_log_generation
from src.bark.npz_tools import get_npz_files, load_npz, save_npz
from src.bark.split_text_functions import split_by_length_simple, split_by_lines
from src.bark.extended_generate import custom_generate_audio
from src.utils.date import get_date_string
from src.model_manager import model_manager
from src.config.config import config
from src.bark.generation_settings import (
    HistorySettings,
    PromptSplitSettings,
    LongPromptHistorySettings,
)
from src.magnet.utils import Timer
from src.utils.prompt_to_title import prompt_to_title

FREEZE_SEMANTIC = False


def generate(params: BarkParams):
    if not model_manager.models_loaded:
        model_manager.reload_models(config)

    with Timer():
        full_generation, audio_array = custom_generate_audio(
            **params,
            cache_semantic=FREEZE_SEMANTIC,
        )

    return [audio_array, full_generation]


def save_generation(
    full_generation,
    audio_array,
    bark_params: BarkParams,
    long_generation=False,
):
    date = get_date_string()
    base_filename = create_base_filename(
        prompt_to_title(bark_params["text"]) + ("_long" if long_generation else ""),
        "outputs",
        model="bark",
        date=date,
    )

    filename, filename_png, filename_json, filename_npz = get_filenames(base_filename)
    write_wav(filename, SAMPLE_RATE, audio_array)
    # plot = middleware_save_waveform_plot(audio_array, filename_png)
    filename_ogg = filename.replace(".wav", ".ogg")

    metadata = generate_and_save_metadata(
        date=date,
        filename_json=filename_json,
        full_generation=full_generation,
        final_gen_params=bark_params,
    )
    save_npz(filename_npz, full_generation, metadata)

    ext_callback_save_generation(
        full_generation,
        audio_array,
        {
            "wav": filename,
            "png": filename_png,
            "npz": filename_npz,
            "ogg": filename_ogg,
        },
        metadata,
    )

    return filename, filename_npz, metadata


def yield_generation(
    audio,
    npz,
    json_text,
    history_bundle_name_data,
):
    return [
        audio,
        npz,
        json_text,
        history_bundle_name_data,
    ]


def gen_helper(
    burn_in_prompt,
    prompt,
    history_setting,
    language=None,
    speaker_id=0,
    useV2=False,
    text_temp=0.7,
    waveform_temp=0.7,
    long_prompt_radio=PromptSplitSettings.NONE,
    long_prompt_history_radio=LongPromptHistorySettings.CONTINUE,
    old_generation_filename=None,
    seed=-1,
    history_prompt_semantic=None,
    max_gen_duration_s=15,
):
    history_prompt = None
    if prompt is None or prompt == "":
        raise ValueError("Prompt is empty")

    if history_setting == HistorySettings.NPZ_FILE:
        history_prompt_semantic = (
            load_npz(history_prompt_semantic) if history_prompt_semantic else None
        )
        history_prompt = (
            load_npz(old_generation_filename) if old_generation_filename else None
        )

    if history_setting == HistorySettings.VOICE:
        history_prompt = get_history_prompt(
            language,
            speaker_id,
            useV2,
            history_prompt,
            use_voice=True,
        )

        history_prompt_semantic = None

    if long_prompt_radio == PromptSplitSettings.NONE:
        prompts = [prompt]
    else:
        prompts = (
            split_by_lines(prompt)
            if long_prompt_radio == PromptSplitSettings.LINES
            else split_by_length_simple(prompt)
        )

    pieces = []
    original_history_prompt = history_prompt
    # This will work when HistorySettings.NPZ_FILE is selected
    # last_generation = (
    #     history_prompt if history_setting == HistorySettings.NPZ_FILE else None
    # )
    last_generation = history_prompt
    for prompt_piece in prompts:
        history_prompt = get_long_gen_history_prompt(
            long_prompt_history_radio,
            last_generation,
            original_history_prompt,
        )

        bark_params: BarkParams = {
            "burn_in_prompt": burn_in_prompt,
            "text": prompt_piece,
            "history_prompt": history_prompt,
            "history_prompt_semantic": history_prompt_semantic,
            "text_temp": text_temp,
            "waveform_temp": waveform_temp,
            "output_full": True,
            "seed": int(seed),
            "max_gen_duration_s": max_gen_duration_s,
        }

        middleware_log_generation(bark_params)

        audio_array, last_generation = generate(bark_params)
        pieces += [audio_array]

        filename, filename_npz, metadata = save_generation(
            full_generation=last_generation,
            audio_array=audio_array,
            bark_params=bark_params,
        )

        yield yield_generation(
            audio=gr.Audio.update(
                value=filename,
                label=f"Generated audio fragment... `{prompt_piece}`",
            ),
            npz=filename_npz,
            json_text=metadata,
            history_bundle_name_data=os.path.dirname(filename),
        )

    if len(pieces) == 1:
        return

    audio_array = np.concatenate(pieces)

    filename, filename_npz, metadata = save_generation(
        full_generation=last_generation,
        audio_array=audio_array,
        bark_params={
            **bark_params,
            "history_prompt": original_history_prompt,
        },  # type: ignore
        long_generation=True,
    )

    yield yield_generation(
        audio=gr.Audio.update(value=filename, label="Generated audio"),
        npz=filename_npz,
        json_text=metadata,
        history_bundle_name_data=os.path.dirname(filename),
    )
    return


def get_long_gen_history_prompt(
    long_prompt_history_radio,
    last_piece_history,
    original_history_prompt,
):
    if long_prompt_history_radio == LongPromptHistorySettings.CONTINUE:
        return last_piece_history
    elif long_prompt_history_radio == LongPromptHistorySettings.CONSTANT:
        return original_history_prompt
    elif long_prompt_history_radio == LongPromptHistorySettings.EMPTY:
        return None
    return None


def generation_tab_bark():
    with gr.Tab(label="Bark", id="generation_bark"):
        bark_ui()


def bark_ui():
    with gr.Row():
        history_setting = gr.Radio(
            HistorySettings.choices,  # type: ignore
            value=HistorySettings.EMPTY,
            type="value",
            label="History Prompt (voice) setting:",
        )

        def unload_models():
            model_manager.unload_models()
            return gr.Button.update(value="Unloaded")

        unload_models_button = gr.Button("Unload models")
        unload_models_button.click(
            fn=unload_models,
            outputs=[unload_models_button],
        )

    (
        useV2,
        languageRadio,
        speakerIdRadio,
        column,
    ) = setup_bark_voice_prompt_ui()

    # Show the language and speakerId radios only when useHistory is checked
    history_setting.change(
        fn=lambda choice: gr.Column.update(visible=(choice == HistorySettings.VOICE)),
        inputs=[history_setting],
        outputs=[column],  # type: ignore
    )

    (
        history_prompt_semantic_dropdown,
        copy_history_prompt_semantic_button,
        reload_history_prompt_semantic_dropdown,
    ) = old_generation_dropdown_ui("Semantic Voice (Optional)")

    (
        old_generation_dropdown,
        copy_old_generation_button,
        reload_old_generation_dropdown,
    ) = old_generation_dropdown_ui("Audio Voice")

    history_setting.change(
        fn=lambda choice: [
            gr.Dropdown.update(visible=(choice == HistorySettings.NPZ_FILE)),
            gr.Button.update(visible=(choice == HistorySettings.NPZ_FILE)),
            gr.Button.update(visible=(choice == HistorySettings.NPZ_FILE)),
        ],
        inputs=[history_setting],
        outputs=[
            old_generation_dropdown,
            copy_old_generation_button,
            reload_old_generation_dropdown,
        ],
    )

    history_setting.change(
        fn=lambda choice: [
            gr.Dropdown.update(visible=(choice == HistorySettings.NPZ_FILE)),
            gr.Button.update(visible=(choice == HistorySettings.NPZ_FILE)),
            gr.Button.update(visible=(choice == HistorySettings.NPZ_FILE)),
        ],
        inputs=[history_setting],
        outputs=[
            history_prompt_semantic_dropdown,
            copy_history_prompt_semantic_button,
            reload_history_prompt_semantic_dropdown,
        ],
    )

    with gr.Row():
        with gr.Column():
            long_prompt_radio = gr.Radio(
                PromptSplitSettings.choices,  # type: ignore
                type="value",
                label="Prompt type",
                value=PromptSplitSettings.NONE,
                show_label=False,
            )
            long_prompt_history_radio = gr.Radio(
                LongPromptHistorySettings.choices,  # type: ignore
                type="value",
                label="For each subsequent generation:",
                value=LongPromptHistorySettings.CONTINUE,
            )

            max_length = gr.Slider(
                label="Max length",
                value=15,
                minimum=0.1,
                maximum=18,
                step=0.1,
            )

            # freeze_cache_button = gr.Checkbox(
            #     label="Freeze semantic",
            #     value=False,
            # )

            # # def freeze_cache():
            # #     global FREEZE_CACHE
            # #     FREEZE_CACHE = True
            # def freeze_cache(value):
            #     global FREEZE_SEMANTIC
            #     FREEZE_SEMANTIC = value

            # freeze_cache_button.change(
            #     fn=freeze_cache,
            #     inputs=[freeze_cache_button],
            # )

            # clear_cache_button = gr.Button(
            #     "Clear cache",
            #     size="sm",
            # )

            # def clear_cache():
            #     from src.bark.extended_generate import semantic_cache

            #     semantic_cache.clear()

            # clear_cache_button.click(
            #     fn=clear_cache,
            # )
        with gr.Column():
            # TODO: Add gradient temperature options (requires model changes)
            text_temp = gr.Slider(
                label="Text temperature",
                value=0.7,
                minimum=0.0,
                maximum=1.2,
                step=0.05,
            )
            waveform_temp = gr.Slider(
                label="Waveform temperature",
                value=0.7,
                minimum=0.0,
                maximum=1.2,
                step=0.05,
            )
            with gr.Column():
                seed_input = gr.Textbox(label="Seed", value="-1")

                CUSTOM_randomize_seed_checkbox = gr.Checkbox(
                    label="Randomize seed", value=True
                )


                def randomize_seed(seed, randomize_seed):
                    if randomize_seed:
                        return np.random.randint(0, 2**32 - 1, dtype=np.uint32)
                    else:
                        return int(seed)

    burn_in_prompt = gr.Textbox(
        label="Burn In Prompt (Optional)", lines=3, placeholder="Enter text here..."
    )
    prompt = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")

    inputs = [
        burn_in_prompt,
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
        history_prompt_semantic_dropdown,
        max_length,
    ]

    with gr.Column():
        audio = gr.Audio(
            type="filepath", label="Generated audio", elem_classes="tts-audio"
        )
        with gr.Row():
            save_button = gr.Button("Save", size="sm")
            continue_button = gr.Button("Use as history", size="sm")
            continue_semantic_button = gr.Button("Use as semantic history", size="sm")
        npz = gr.Textbox(visible=False)
        json_text = gr.JSON(visible=False)
        history_bundle_name_data = gr.Textbox(visible=False)

        save_button.click(
            fn=save_to_favorites,
            inputs=[history_bundle_name_data],
            outputs=[save_button],
            api_name="bark_favorite",
        )

        continue_button.click(
            fn=insert_npz_file,
            inputs=[npz],
            outputs=[old_generation_dropdown, history_setting],
        )

        continue_semantic_button.click(
            fn=insert_npz_file,
            inputs=[npz],
            outputs=[history_prompt_semantic_dropdown, history_setting],
        )

        # fix the bug where selecting No history does not work with burn in prompt

        output_components = [audio, npz, json_text, history_bundle_name_data]

        # yield yield_generation(
        #     audio=None,
        #     save_button=gr.Button.update(value="Save"),
        #     continue_button=gr.Button.update(),
        #     buttons_row=gr.Row.update(visible=False),
        #     npz=None,
        #     json_text=None,
        #     history_bundle_name_data=None,
        # )

    with gr.Row():
        btn = gr.Button("Generate", variant="primary")

        btn.click(
            fn=randomize_seed,
            inputs=[seed_input, CUSTOM_randomize_seed_checkbox],
            outputs=[seed_input],
        ).then(
            fn=gen_helper,
            inputs=inputs,
            outputs=output_components,
            api_name="bark_legacy_1",
        )

    prompt.submit(
        fn=randomize_seed,
        inputs=[seed_input, CUSTOM_randomize_seed_checkbox],
        outputs=[seed_input],
    ).then(
        fn=gen_helper,
        inputs=inputs,
        outputs=output_components,
        api_name="bark",
    )


def old_generation_dropdown_ui(label):
    with gr.Row():
        old_generation_dropdown = gr.Dropdown(
            label=label,
            choices=get_npz_files(),  # type: ignore
            type="value",
            value=None,
            allow_custom_value=True,
            visible=False,
            # container=False,
            show_label=True,
        )
        copy_old_generation_button = gr.Button(
            "save",
            visible=False,
            elem_classes="btn-sm material-symbols-outlined",
            size="sm",
        )
        copy_old_generation_button.click(
            fn=lambda x: [
                shutil.copy(x, os.path.join("voices", os.path.basename(x))),
            ],
            inputs=[old_generation_dropdown],
        )

        reload_old_generation_dropdown = gr.Button(
            "refresh",
            visible=False,
            elem_classes=ICON_ELEM_CLASS,
            size="sm",
        )

        reload_old_generation_dropdown.click(
            fn=lambda: gr.Dropdown.update(choices=get_npz_files()),  # type: ignore
            outputs=old_generation_dropdown,
            api_name=f"reload_old_generation_dropdown{ '' if label == 'Audio Voice' else '_semantic'}",
        )

    return (
        old_generation_dropdown,
        copy_old_generation_button,
        reload_old_generation_dropdown,
    )


def setup_bark_voice_prompt_ui():
    with gr.Column(visible=False) as column:
        with gr.Row():
            useV2 = gr.Checkbox(label="Use V2", value=False)
            choice_string = gr.Markdown(
                "Chosen voice: en_speaker_0, Gender: Unknown",
            )

        languageRadio = gr.Radio(
            [lang[0] for lang in SUPPORTED_LANGS],
            type="index",
            show_label=False,
            value="English",
        )

        speakerIdRadio = gr.Radio(
            ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
            type="value",
            label="Speaker ID",
            value="0",
        )

        voice_inputs = [useV2, languageRadio, speakerIdRadio]

        for i in voice_inputs:
            i.change(
                fn=generate_choice_string, inputs=voice_inputs, outputs=[choice_string]
            )

    return useV2, languageRadio, speakerIdRadio, column


def insert_npz_file(npz_filename):
    return [
        gr.Dropdown.update(value=npz_filename),
        gr.Radio.update(value=HistorySettings.NPZ_FILE),
    ]
