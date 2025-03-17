import os
import shutil

import numpy as np
import gradio as gr

from tts_webui.config.config import config
# from tts_webui.bark.clone.tab_voice_clone import tab_voice_clone
from tts_webui.history_tab.voices_tab import voices_tab
from tts_webui.bark.settings_tab_bark import settings_tab_bark

from tts_webui.bark.get_speaker_gender import get_speaker_gender
from tts_webui.bark.npz_tools import get_npz_files, save_npz
from tts_webui.bark.split_text_functions import split_by_length_simple, split_by_lines
from tts_webui.bark.generation_settings import (
    PromptSplitSettings,
    LongPromptHistorySettings,
)

from tts_webui.history_tab.save_to_favorites import save_to_favorites

from tts_webui.utils.save_json_result import save_json_result
from tts_webui.utils.get_dict_props import get_dict_props
from tts_webui.utils.randomize_seed import randomize_seed_ui

from tts_webui.decorators.gradio_dict_decorator import dictionarize
from tts_webui.decorators.decorator_apply_torch_seed import (
    decorator_apply_torch_seed_generator,
)
from tts_webui.decorators.decorator_log_generation import (
    decorator_log_generation_generator,
)
from tts_webui.decorators.decorator_save_wav import (
    decorator_save_wav_generator,
)
from tts_webui.decorators.decorator_add_base_filename import (
    decorator_add_base_filename_generator,
    format_date_for_file,
)
from tts_webui.decorators.decorator_add_date import (
    decorator_add_date_generator,
)
from tts_webui.decorators.decorator_add_model_type import (
    decorator_add_model_type_generator,
)
from tts_webui.decorators.log_function_time import log_generator_time
from tts_webui.extensions_loader.decorator_extensions import (
    decorator_extension_inner_generator,
    decorator_extension_outer_generator,
)
from tts_webui.utils.outputs.path import get_relative_output_path_ext

# from bark import SAMPLE_RATE
SAMPLE_RATE = 24_000
# from bark.generation import SUPPORTED_LANGS
SUPPORTED_LANGS = [
    ("English", "en"),
    ("German", "de"),
    ("Spanish", "es"),
    ("French", "fr"),
    ("Hindi", "hi"),
    ("Italian", "it"),
    ("Japanese", "ja"),
    ("Korean", "ko"),
    ("Polish", "pl"),
    ("Portuguese", "pt"),
    ("Russian", "ru"),
    ("Turkish", "tr"),
    ("Chinese", "zh"),
]


def _decorator_bark_save_metadata_generator(fn):
    def _save_metadata_and_npz(kwargs, result_dict):
        from tts_webui.bark.generate_and_save_metadata import generate_bark_metadata

        metadata = generate_bark_metadata(
            date=format_date_for_file(result_dict["date"]),
            full_generation=result_dict["full_generation"],
            params=kwargs,
        )

        save_json_result(result_dict, metadata)

        npz_path = get_relative_output_path_ext(result_dict, ".npz")
        save_npz(
            filename=npz_path,
            full_generation=result_dict["full_generation"],
            metadata=metadata,
        )
        result_dict["metadata"] = metadata
        result_dict["npz_path"] = npz_path
        return result_dict

    def wrapper(*args, **kwargs):
        for result_dict in fn(*args, **kwargs):
            if result_dict is None:
                continue
            yield _save_metadata_and_npz(kwargs, result_dict)

    return wrapper


def _bark_get_prompts(text, long_prompt_radio):
    if text is None or text == "":
        raise ValueError("Prompt is empty")
    if long_prompt_radio == PromptSplitSettings.NONE:
        prompts = [text]
    else:
        prompts = (
            split_by_lines(text)
            if long_prompt_radio == PromptSplitSettings.LINES
            else split_by_length_simple(text)
        )

    return prompts


def _get_long_gen_history_prompt(
    long_prompt_history_radio,
    last_generation,
    original_history_prompt,
):
    switcher = {
        LongPromptHistorySettings.CONTINUE: last_generation,
        LongPromptHistorySettings.CONSTANT: original_history_prompt,
        LongPromptHistorySettings.EMPTY: None,
    }
    return switcher.get(long_prompt_history_radio, None)


@decorator_add_model_type_generator("bark")
@decorator_extension_outer_generator
@decorator_apply_torch_seed_generator
@_decorator_bark_save_metadata_generator
@decorator_save_wav_generator
@decorator_add_base_filename_generator
@decorator_add_date_generator
@decorator_log_generation_generator
@decorator_extension_inner_generator
@log_generator_time
def bark_generate_long(
    text,
    history_prompt,
    long_prompt_radio,
    long_prompt_history_radio,
    **kwargs,
):
    from tts_webui.bark.extended_generate import custom_generate_audio
    from tts_webui.bark.BarkModelManager import bark_model_manager

    pieces = []
    original_history_prompt = history_prompt
    last_generation = history_prompt
    for prompt_piece in _bark_get_prompts(text, long_prompt_radio):
        history_prompt = _get_long_gen_history_prompt(
            long_prompt_history_radio,
            last_generation,
            original_history_prompt,
        )

        if not bark_model_manager.models_loaded:
            bark_model_manager.reload_models(config)

        full_generation, audio_array = custom_generate_audio(
            text=prompt_piece,
            history_prompt=history_prompt,
            **get_dict_props(
                kwargs,
                [
                    "burn_in_prompt",
                    "history_prompt_semantic",
                    "text_temp",
                    "waveform_temp",
                    "max_length",
                ],
            ),
            output_full=True,
        )
        last_generation = full_generation

        pieces += [audio_array]

        yield {
            "audio_out": (SAMPLE_RATE, audio_array),
            "full_generation": full_generation,
        }

    if len(pieces) == 1:
        return

    yield {
        "audio_out": (SAMPLE_RATE, np.concatenate(pieces)),
        "full_generation": full_generation,
        "long": True,
    }
    return


def unload_models():
    from tts_webui.bark.BarkModelManager import bark_model_manager

    bark_model_manager.unload_models()
    return gr.Button(value="Unloaded")


def bark_tab():
    with gr.Tab(label="Bark", id="generation_bark"):
        with gr.Tabs():
            with gr.Tab("Generation"):
                bark_ui()
            # tab_voice_clone()

            voices_tab()
            settings_tab_bark()


def _npz_dropdown_ui(label):
    npz_dropdown = gr.Dropdown(
        label=label,
        choices=get_npz_files() + [""],  # type: ignore
        type="value",
        value=None,
        allow_custom_value=True,
        show_label=True,
    )
    btn_style = {
        "size": "sm",
        "elem_classes": "btn-sm material-symbols-outlined",
    }
    gr.Button("save", **btn_style).click(  # type: ignore
        fn=lambda x: [
            shutil.copy(x, os.path.join("voices", os.path.basename(x))),
        ],
        inputs=[npz_dropdown],
    )
    gr.Button("refresh", **btn_style).click(  # type: ignore
        fn=lambda: gr.Dropdown(choices=get_npz_files() + [""]),  # type: ignore
        outputs=npz_dropdown,
        api_name=f"reload_old_generation_dropdown{ '' if label == 'Audio Voice' else '_semantic'}",
    )
    gr.Button("clear", **btn_style).click(  # type: ignore
        fn=lambda: gr.Dropdown(value=None),
        outputs=npz_dropdown,
    )

    return npz_dropdown


def _voice_select_ui(history_prompt):
    with gr.Row():
        use_v2 = gr.Checkbox(label="Use V2", value=False)
        choice_string = gr.Markdown(
            "Chosen voice: en_speaker_0, Gender: Unknown",
        )

    language = gr.Radio(
        [lang[0] for lang in SUPPORTED_LANGS],
        type="index",
        show_label=False,
        value="English",
    )

    speaker_id = gr.Radio(
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        type="value",
        label="Speaker ID",
        value="0",
    )

    voice_inputs = [language, speaker_id, use_v2]

    def create_voice_string_lazy(language, speaker_id, use_v2):
        from tts_webui.bark.create_voice_string import create_voice_string

        return create_voice_string(language, speaker_id, use_v2)

    for i in voice_inputs:
        i.change(
            fn=create_voice_string_lazy,
            inputs=voice_inputs,
            outputs=[history_prompt],
        ).then(
            fn=lambda x: f"Chosen voice: {x}, Gender: {get_speaker_gender(x)}",
            inputs=history_prompt,
            outputs=[choice_string],
        )


def bark_ui():
    with gr.Row():
        unload_models_button = gr.Button("Unload models")
        unload_models_button.click(
            fn=unload_models,
            outputs=[unload_models_button],
        )

    with gr.Row():
        history_prompt_semantic = _npz_dropdown_ui("Semantic Voice (Optional)")
    with gr.Row():
        history_prompt = _npz_dropdown_ui("Audio Voice")
    with gr.Column():
        _voice_select_ui(history_prompt)

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
                seed, randomize_seed_callback = randomize_seed_ui()

    burn_in_prompt = gr.Textbox(
        label="Burn In Prompt (Optional)", lines=3, placeholder="Enter text here..."
    )
    text = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")

    with gr.Column():
        audio = gr.Audio(type="filepath", label="Generated audio")
        with gr.Row():
            save_button = gr.Button("Save", size="sm")
            continue_button = gr.Button("Use as history", size="sm")
            continue_semantic_button = gr.Button("Use as semantic history", size="sm")
        full_generation = gr.Textbox(visible=False)
        metadata = gr.JSON(visible=False)
        folder_root = gr.Textbox(visible=False)

        save_button.click(
            fn=save_to_favorites,
            inputs=[folder_root],
            outputs=[save_button],
            api_name="bark_favorite",
        )

        continue_button.click(
            fn=lambda x: x,
            inputs=[full_generation],
            outputs=[history_prompt],
        )

        continue_semantic_button.click(
            fn=lambda x: x,
            inputs=[full_generation],
            outputs=[history_prompt_semantic],
        )

        # fix the bug where selecting No history does not work with burn in prompt

    input_dict = {
        seed: "seed",
        text: "text",
        burn_in_prompt: "burn_in_prompt",
        text_temp: "text_temp",
        waveform_temp: "waveform_temp",
        max_length: "max_length",
        history_prompt: "history_prompt",
        history_prompt_semantic: "history_prompt_semantic",
        long_prompt_radio: "long_prompt_radio",
        long_prompt_history_radio: "long_prompt_history_radio",
    }

    output_dict = {
        "audio_out": audio,
        "npz_path": full_generation,
        "metadata": metadata,
        "folder_root": folder_root,
    }

    gr.Button("Generate", variant="primary").click(
        **randomize_seed_callback,
    ).then(
        **dictionarize(
            fn=bark_generate_long,
            inputs=input_dict,
            outputs=output_dict,
        ),
        api_name="bark",
    )


if __name__ == "__main__":
    if "demo" in locals():
        locals()["demo"].close()
    with gr.Blocks() as demo:
        bark_tab()

    demo.launch(
        server_port=7770,
    )
