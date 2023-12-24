import os
import shutil

import numpy as np
import gradio as gr
from src.bark.ICON_ELEM_CLASS import ICON_ELEM_CLASS
from src.Joutai import Joutai
from src.bark.setup_seed_ui_bark import setup_seed_ui_bark
from src.bark.FinalGenParams import FinalGenParams
from src.bark.history_to_hash import history_to_hash
from src.extensions_loader.ext_callback_save_generation import (
    ext_callback_save_generation,
)
from src.utils.create_base_filename import create_base_filename
from src.history_tab.save_to_favorites import save_to_favorites
from src.bark.generate_and_save_metadata import generate_and_save_metadata
from src.bark.generate_choice_string import generate_choice_string
from src.bark.get_filenames import get_filenames
from src.bark.get_history_prompt import get_history_prompt
from src.bark.log_generation import log_generation
from src.bark.npz_tools import get_npz_files, load_npz, save_npz
from src.bark.parse_or_set_seed import parse_or_set_seed
from src.bark.split_text_functions import split_by_length_simple, split_by_lines
from src.bark.extended_generate import custom_generate_audio
from src.utils.date import get_date_string
from bark import SAMPLE_RATE, generate_audio
from scipy.io.wavfile import write as write_wav
from bark.generation import SUPPORTED_LANGS
from src.utils.save_waveform_plot import save_waveform_plot
from src.model_manager import model_manager
from src.config.config import config
from src.utils.set_seed import set_seed
from src.bark.generation_settings import (
    HistorySettings,
    PromptSplitSettings,
    LongPromptHistorySettings,
)

MAX_LENGTH_GLOBAL = 15
FREEZE_SEMANTIC = False


def generate(
    burn_in_prompt,
    prompt,
    history_setting,
    language=None,
    speaker_id=0,
    useV2=False,
    text_temp=0.7,
    waveform_temp=0.7,
    history_prompt=None,
    history_prompt_semantic=None,
    seed=None,
    index=0,
):
    if not model_manager.models_loaded:
        model_manager.reload_models(config)

    use_voice = history_setting == HistorySettings.VOICE
    history_prompt, history_prompt_verbal = get_history_prompt(
        language, speaker_id, useV2, history_prompt, use_voice
    )

    final_gen_params: FinalGenParams = {
        "burn_in_prompt": burn_in_prompt,
        "text": prompt,
        "history_prompt": history_prompt,
        "history_prompt_semantic": history_prompt_semantic,
        "text_temp": text_temp,
        "waveform_temp": waveform_temp,
        "output_full": True,
    }

    log_generation(
        **final_gen_params,
        history_prompt_verbal=history_prompt_verbal,
    )

    indexed_seed = parse_or_set_seed(seed, index)
    full_generation, audio_array = custom_generate_audio(
        **final_gen_params,
        max_gen_duration_s=MAX_LENGTH_GLOBAL,
        cache_semantic=FREEZE_SEMANTIC,
    )
    set_seed(-1)

    filename, filename_png, filename_npz, metadata = save_generation(
        prompt=prompt,
        language=language,
        speaker_id=speaker_id,
        text_temp=text_temp,
        waveform_temp=waveform_temp,
        history_prompt=history_prompt,
        seed=indexed_seed,
        use_voice=use_voice,
        history_prompt_verbal=history_prompt_verbal,
        full_generation=full_generation,
        audio_array=audio_array,
        final_gen_params=final_gen_params,
    )

    return [
        filename,
        filename_png,
        audio_array,
        full_generation,
        filename_npz,
        indexed_seed,
        metadata,
    ]


def save_generation(
    prompt,
    language,
    speaker_id,
    text_temp,
    waveform_temp,
    history_prompt,
    seed,
    use_voice,
    history_prompt_verbal,
    full_generation,
    audio_array,
    final_gen_params,
):
    date = get_date_string()
    base_filename = create_base_filename(
        history_prompt_verbal, "outputs", model="bark", date=date
    )

    filename, filename_png, filename_json, filename_npz = get_filenames(base_filename)
    save_wav(audio_array, filename)
    plot = save_waveform_plot(audio_array, filename_png)
    filename_ogg = filename.replace(".wav", ".ogg")

    # Generate metadata for the audio file
    language = SUPPORTED_LANGS[language][0] if use_voice else None
    history_hash = history_to_hash(history_prompt)
    history_prompt_npz = history_prompt if isinstance(history_prompt, str) else None
    speaker_id = speaker_id if use_voice else None
    history_prompt = history_prompt_verbal

    metadata = generate_and_save_metadata(
        prompt=prompt,
        language=language,
        speaker_id=speaker_id,
        text_temp=text_temp,
        waveform_temp=waveform_temp,
        seed=seed,
        date=date,
        filename_json=filename_json,
        history_prompt_npz=history_prompt_npz,
        history_prompt=history_prompt,
        history_hash=history_hash,
        full_generation=full_generation,
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

    return filename, plot, filename_npz, metadata


def save_wav(audio_array, filename):
    write_wav(filename, SAMPLE_RATE, audio_array)


def save_long_generation(
    prompt,
    history_setting,
    language,
    speaker_id,
    text_temp,
    waveform_temp,
    seed,
    filename,
    pieces,
    full_generation,
    history_prompt=None,
):
    base_filename = create_base_filename(
        "long", "outputs", model="bark", date=get_date_string()
    )
    audio_array = np.concatenate(pieces)

    date = get_date_string()
    filename, filename_png, filename_json, filename_npz = get_filenames(base_filename)
    write_wav(filename, SAMPLE_RATE, audio_array)
    plot = save_waveform_plot(audio_array, filename_png)
    filename_ogg = filename.replace(".wav", ".ogg")

    # Generate metadata for the audio file
    language = SUPPORTED_LANGS[language][0]
    history_hash = history_to_hash(history_prompt)
    history_prompt_npz = None
    history_prompt = history_setting

    metadata = generate_and_save_metadata(
        prompt=prompt,  # indicate how prompt is split, maybe as an array
        language=language,
        speaker_id=speaker_id,
        text_temp=text_temp,
        waveform_temp=waveform_temp,
        seed=seed,
        date=date,
        filename_json=filename_json,
        history_prompt_npz=history_prompt_npz,
        history_prompt=history_prompt,
        history_hash=history_hash,
        full_generation=full_generation,
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

    return filename, plot, filename_npz, metadata


def yield_generation(outputs_ref, i):
    output_for_yield = outputs_ref[i]
    (
        audio_,
        image_,
        save_button_,
        continue_button_,
        buttons_row_,
        npz_,
        seed_,
        json_text_,
        history_bundle_name_data_,
    ) = output_for_yield

    def return_for_yield(
        audio,
        image,
        save_button,
        continue_button,
        buttons_row,
        npz,
        seed,
        json_text,
        history_bundle_name_data,
    ):
        return {
            audio_: audio,
            image_: image,
            save_button_: save_button,
            continue_button_: continue_button,
            buttons_row_: buttons_row,
            npz_: npz,
            seed_: seed,
            json_text_: json_text,
            history_bundle_name_data_: history_bundle_name_data,
        }

    return return_for_yield


def generate_multi(count, outputs_ref):
    def gen(
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
        seed=None,
        history_prompt_semantic=None,
    ):
        history_prompt = None
        if prompt is None or prompt == "":
            raise ValueError("Prompt is empty")

        print(
            "gen",
            "old_generation_filename",
            old_generation_filename,
            "semantic",
            history_prompt_semantic,
        )
        if history_prompt_semantic == "":
            history_prompt_semantic = None
        if history_prompt_semantic is not None:
            history_prompt_semantic = load_npz(history_prompt_semantic)

        if history_setting == HistorySettings.NPZ_FILE:
            if old_generation_filename is None:
                raise ValueError("old_generation_filename is None")
            history_prompt = load_npz(old_generation_filename)

        _original_history_prompt = history_prompt

        for i in range(count):
            yield yield_generation(outputs_ref, i)(
                audio=None,
                image=None,
                save_button=gr.Button.update(value="Save"),
                continue_button=gr.Button.update(),
                buttons_row=gr.Row.update(visible=False),
                npz=None,
                seed=None,
                json_text=None,
                history_bundle_name_data=None,
            )

        _original_seed = seed
        if long_prompt_radio == PromptSplitSettings.NONE:
            for i in range(count):
                filename, filename_png, _, _, filename_npz, seed, metadata = generate(
                    burn_in_prompt,
                    prompt,
                    history_setting,
                    language,
                    speaker_id,
                    useV2,
                    text_temp=text_temp,
                    waveform_temp=waveform_temp,
                    history_prompt=history_prompt,
                    history_prompt_semantic=history_prompt_semantic,
                    seed=_original_seed,
                    index=i,
                )

                yield yield_generation(outputs_ref, i)(
                    audio=filename,
                    image=filename_png,
                    save_button=gr.Button.update(value="Save"),
                    continue_button=gr.Button.update(),
                    buttons_row=gr.Row.update(visible=True),
                    npz=filename_npz,
                    seed=seed,
                    json_text=metadata,
                    history_bundle_name_data=os.path.dirname(filename),
                )
            return {}

        prompts = (
            split_by_lines(prompt)
            if long_prompt_radio == PromptSplitSettings.LINES
            else split_by_length_simple(prompt)
        )

        for i in range(count):
            pieces = []
            last_piece_history = None
            # This will work when HistorySettings.NPZ_FILE is selected
            if history_setting == HistorySettings.NPZ_FILE:
                last_piece_history = history_prompt
            for prompt_piece in prompts:
                history_prompt = get_long_gen_history_prompt(
                    history_setting,
                    language,
                    speaker_id,
                    useV2,
                    long_prompt_history_radio,
                    last_piece_history,
                    history_prompt,
                )

                (
                    filename,
                    filename_png,
                    audio_array,
                    last_piece_history,
                    filename_npz,
                    seed,
                    _metadata,
                ) = generate(
                    burn_in_prompt,
                    prompt_piece,
                    history_setting,
                    language,
                    speaker_id,
                    useV2,
                    text_temp=text_temp,
                    waveform_temp=waveform_temp,
                    history_prompt=history_prompt,
                    history_prompt_semantic=history_prompt_semantic,
                    seed=_original_seed,
                    index=i,
                )
                pieces += [audio_array]
                yield yield_generation(outputs_ref, i)(
                    audio=gr.Audio.update(
                        value=filename,
                        label=f"Generated audio fragment... `{prompt_piece}`",
                    ),
                    image=filename_png,
                    save_button=gr.Button.update(value="Save", visible=True),
                    continue_button=gr.Button.update(visible=True),
                    buttons_row=gr.Row.update(visible=True),
                    npz=filename_npz,
                    seed=seed,
                    json_text=_metadata,
                    history_bundle_name_data=os.path.dirname(filename),
                )

            filename_long, filename_png, filename_npz, metadata = save_long_generation(
                prompt,
                history_setting,
                language,
                speaker_id,
                text_temp,
                waveform_temp,
                seed,
                filename,  # type: ignore
                pieces,
                full_generation=last_piece_history,
                history_prompt=_original_history_prompt,
            )

            yield yield_generation(outputs_ref, i)(
                audio=gr.Audio.update(value=filename_long, label="Generated audio"),
                image=filename_png,
                save_button=gr.Button.update(value="Save", visible=True),
                continue_button=gr.Button.update(visible=True),
                buttons_row=gr.Row.update(visible=True),
                npz=filename_npz,
                seed=seed,
                json_text=metadata,
                history_bundle_name_data=os.path.dirname(filename_long),
            )
        return {}

    return gen


def get_long_gen_history_prompt(
    history_setting,
    language,
    speaker_id,
    useV2,
    long_prompt_history_radio,
    last_piece_history,
    history_prompt,
):
    if long_prompt_history_radio == LongPromptHistorySettings.CONTINUE:
        return last_piece_history
    elif long_prompt_history_radio == LongPromptHistorySettings.CONSTANT:
        x, _ = get_history_prompt(
            language,
            speaker_id,
            useV2,
            history_prompt,
            use_voice=history_setting == HistorySettings.VOICE,
        )
        return x
    elif long_prompt_history_radio == LongPromptHistorySettings.EMPTY:
        return None
    return None


def generation_tab_bark():
    with gr.Tab(label="Generation (Bark)", id="generation_bark"):
        with gr.Row():
            history_setting = gr.Radio(
                HistorySettings.choices,
                value="Empty history",
                type="value",
                label="History Prompt (voice) setting:",
            )

            unload_models_button = gr.Button(
                "Unload models",
                size="sm",
            )

            def unload_models():
                model_manager.unload_models()
                return {
                    unload_models_button: gr.Button.update(value="Unloaded"),
                }

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
            fn=lambda choice: gr.Column.update(
                visible=(choice == HistorySettings.VOICE)
            ),
            inputs=[history_setting],
            outputs=[column],  # type: ignore
        )

        with gr.Row():
            (
                history_prompt_semantic_dropdown,
                copy_history_prompt_semantic_button,
                reload_history_prompt_semantic_dropdown,
            ) = old_generation_dropdown_ui("Semantic Voice (Optional)")

        with gr.Row():
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
                    PromptSplitSettings.choices,
                    type="value",
                    label="Prompt type",
                    value=PromptSplitSettings.NONE,
                    show_label=False,
                )
                long_prompt_history_radio = gr.Radio(
                    LongPromptHistorySettings.choices,
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

                def update_max_length(value):
                    global MAX_LENGTH_GLOBAL
                    MAX_LENGTH_GLOBAL = value

                max_length.change(
                    fn=update_max_length,
                    inputs=[max_length],
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
                    seed_input, set_old_seed_button = setup_seed_ui_bark()

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
        ]

        MAX_OUTPUTS = 9

        with gr.Row():
            output_components, output_cols, seeds = map(
                list,
                zip(
                    *[
                        create_components(
                            old_generation_dropdown,
                            history_prompt_semantic_dropdown,
                            history_setting,
                            index,
                            seed_input,
                        )
                        for index in range(MAX_OUTPUTS)
                    ]
                ),
            )

        seed_1 = seeds[0]

        all_outputs_flat = [item for sublist in output_components for item in sublist]  # type: ignore

        total_columns = len(output_cols)

        def show(count):
            return [gr.Column.update(visible=count > i) for i in range(total_columns)]

        def generate_button(text, count, variant):
            button = gr.Button(text, variant=variant)
            # TODO: Use then() to chain together multiple actions
            button.click(fn=lambda: show(count), outputs=output_cols)  # type: ignore
            button.click(
                fn=generate_multi(count, output_components),
                inputs=inputs,
                outputs=all_outputs_flat,
                # api_name=f"bark_{count}", # gradio literally can't support this
            )
            return button

        with gr.Row():
            for i in range(total_columns):
                num_columns = total_columns - i
                generate_button(
                    f"Generate {num_columns if num_columns > 1 else ''}",
                    num_columns,
                    variant="primary" if num_columns == 1 else "secondary",
                )

        prompt.submit(fn=lambda: show(1), outputs=output_cols)  # type: ignore
        prompt.submit(
            fn=generate_multi(1, output_components),
            inputs=inputs,
            outputs=all_outputs_flat,
            api_name="bark",  # toggle
        )

        set_old_seed_button.click(
            fn=lambda x: gr.Textbox.update(value=str(x)),
            inputs=[seed_1],  # type: ignore
            outputs=[seed_input],
        )

    def register_use_as_history_button(button, source):
        button.click(
            fn=lambda value: {
                old_generation_dropdown: value,
                history_setting: HistorySettings.NPZ_FILE,
            },
            inputs=[source],
            outputs=[old_generation_dropdown, history_setting],
        ).then(**Joutai.singleton.switch_to_tab(tab="generation_bark"))

    return register_use_as_history_button


def old_generation_dropdown_ui(label):
    old_generation_dropdown = gr.Dropdown(
        label=label,
        choices=get_npz_files(),
        type="value",
        value=None,
        allow_custom_value=True,
        visible=False,
        container=False,
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
        fn=lambda: gr.Dropdown.update(choices=get_npz_files()),
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

        languages = [lang[0] for lang in SUPPORTED_LANGS]
        languageRadio = gr.Radio(
            languages, type="index", show_label=False, value="English"
        )

        speaker_ids = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        speakerIdRadio = gr.Radio(
            speaker_ids, type="value", label="Speaker ID", value="0"
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


def create_components(
    old_generation_dropdown,
    history_prompt_semantic_dropdown,
    history_setting,
    index,
    seed_input,
):
    with gr.Column(visible=index == 0) as col:
        audio = gr.Audio(
            type="filepath", label="Generated audio", elem_classes="tts-audio"
        )
        image = gr.Image(label="Waveform", shape=(None, 100), elem_classes="tts-image")  # type: ignore
        with gr.Row(visible=False) as buttons_row:
            save_button = gr.Button("Save", size="sm")
            reuse_seed_button = gr.Button("Seed", size="sm")
            gr.Button("Remix", size="sm").click(
                **Joutai.singleton.send_to_remixer(
                    inputs=[audio],
                )
            ).then(
                **Joutai.singleton.switch_to_tab(
                    tab="simple_remixer",
                )
            )
            gr.Button("RVC", size="sm").click(
                **Joutai.singleton.sent_to_rvc(
                    inputs=[audio],
                )
            ).then(
                **Joutai.singleton.switch_to_tab(
                    tab="rvc_tab",
                )
            )
            gr.Button("Demucs", size="sm").click(
                **Joutai.singleton.send_to_demucs(
                    inputs=[audio],
                )
            ).then(
                **Joutai.singleton.switch_to_tab(
                    tab="demucs",
                )
            )
            send_to_vocos_button = gr.Button("Vocos", size="sm")
            continue_button = gr.Button("Use as history", size="sm")
            continue_semantic_button = gr.Button("Use as semantic history", size="sm")
        npz = gr.Textbox(
            visible=False,
        )
        seed = gr.State()  # type: ignore
        json_text = gr.JSON(
            visible=False,
        )
        history_bundle_name_data = gr.Textbox(
            visible=False,
        )

        save_button.click(
            fn=save_to_favorites,
            inputs=[history_bundle_name_data],
            outputs=[save_button],
            api_name=f"bark_favorite{ '_' + str(index) if index > 0 else ''}",
        )

        reuse_seed_button.click(
            fn=lambda x: gr.Textbox.update(value=str(x)),
            inputs=[seed],
            outputs=[seed_input],
        )

        send_to_vocos_button.click(
            **Joutai.singleton.send_to_vocos_npz(
                inputs=[npz],
            )
        ).then(
            **Joutai.singleton.switch_to_tab(
                tab="vocos",
            )
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

        return (
            [
                audio,
                image,
                save_button,
                continue_button,
                buttons_row,
                npz,
                seed,
                json_text,
                history_bundle_name_data,
            ],
            col,
            seed,
        )
