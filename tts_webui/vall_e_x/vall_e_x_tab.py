import gradio as gr

from tts_webui.decorators.gradio_dict_decorator import dictionarize
from tts_webui.utils.randomize_seed import randomize_seed_ui
from tts_webui.utils.manage_model_state import manage_model_state
from tts_webui.utils.list_dir_models import unload_model_button
from tts_webui.decorators.decorator_apply_torch_seed import decorator_apply_torch_seed
from tts_webui.decorators.decorator_log_generation import decorator_log_generation
from tts_webui.decorators.decorator_save_metadata import decorator_save_metadata
from tts_webui.decorators.decorator_save_wav import decorator_save_wav
from tts_webui.decorators.decorator_add_base_filename import decorator_add_base_filename
from tts_webui.decorators.decorator_add_date import decorator_add_date
from tts_webui.decorators.decorator_add_model_type import decorator_add_model_type
from tts_webui.decorators.log_function_time import log_function_time
from tts_webui.extensions_loader.decorator_extensions import (
    decorator_extension_outer,
    decorator_extension_inner,
)


def preprocess_text(text, language="auto"):
    from valle_x.utils.generation import (
        text_tokenizer,
        lang2token,
        langid,
    )

    language = get_lang(language)
    text = text.replace("\n", "").strip(" ")
    # detect language
    if language == "auto":
        language = langid.classify(text)[0]
    lang_token = lang2token[language]
    text = lang_token + text + lang_token
    return str(text_tokenizer.tokenize(text=f"_{text}".strip()))


@manage_model_state("valle_x")
def preload_models_if_needed(checkpoints_dir):
    from valle_x.utils.generation import preload_models

    preload_models(checkpoints_dir=checkpoints_dir)
    return "Loaded"  # workaround because preload_models returns None


def get_lang(language):
    from valle_x.utils.generation import langdropdown2token, token2lang

    lang = token2lang[langdropdown2token[language]]
    return lang if lang != "mix" else "auto"


@decorator_extension_outer
@decorator_apply_torch_seed
@decorator_save_metadata
@decorator_save_wav
@decorator_add_model_type("valle_x")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def generate_audio_gradio(text, prompt, language, accent, mode, **kwargs):
    from valle_x.utils.generation import (
        SAMPLE_RATE,
        generate_audio,
        generate_audio_from_long_text,
    )

    preload_models_if_needed("./data/models/vall-e-x/")
    lang = get_lang(language)

    prompt = prompt if prompt != "" else None
    generate_fn = generate_audio if mode == "short" else generate_audio_from_long_text
    audio_array = generate_fn(
        text=text,
        prompt=prompt,
        language=lang,
        accent=accent,
        **({"mode": mode} if mode != "short" else {}),
    )
    return {"audio_out": (SAMPLE_RATE, audio_array)}


def split_text_into_sentences(text):
    from valle_x.utils.sentence_cutter import split_text_into_sentences

    return "###\n".join(split_text_into_sentences(text))


def valle_x_ui_generation():
    text = gr.Textbox(label="Text", lines=3, placeholder="Enter text here...")
    prompt = gr.Textbox(label="Prompt", visible=False, value="")

    with gr.Accordion("Analyze text", open=False):
        split_text_into_sentences_button = gr.Button("Preview sentences")
        split_text = gr.Textbox(label="Text after split")

        split_text_into_sentences_button.click(
            fn=split_text_into_sentences,
            inputs=[text],
            outputs=[split_text],
            api_name="vall_e_x_split_text_into_sentences",
        )

        split_text_into_tokens_button = gr.Button("Preview tokens")
        tokens = gr.Textbox(label="Tokens")

    gr.Markdown(
        """
        For longer audio generation, two extension modes are available:

        - (Default) short: This will only generate as long as the model's context length.
        - fixed-prompt: This mode will keep using the same prompt the user has provided, and generate audio sentence by sentence.
        - sliding-window: This mode will use the last sentence as the prompt for the next sentence, but has some concern on speaker maintenance.
    """
    )
    with gr.Row():
        language = gr.Radio(
            ["English", "中文", "日本語", "Mix"],
            label="Language",
            value="Mix",
        )

        accent = gr.Radio(
            ["English", "中文", "日本語", "no-accent"],
            label="Accent",
            value="no-accent",
        )

        mode = gr.Radio(
            ["short", "fixed-prompt", "sliding-window"],
            label="Mode",
            value="short",
        )

    seed, randomize_seed_callback = randomize_seed_ui()
    unload_model_button("valle_x")

    audio_out = gr.Audio(label="Generated audio")
    generate_button = gr.Button("Generate")

    split_text_into_tokens_button.click(
        fn=preprocess_text,
        inputs=[text, language],
        outputs=[tokens],
        api_name="vall_e_x_tokenize",
    )

    input_dict = {
        text: "text",
        prompt: "prompt",
        language: "language",
        accent: "accent",
        mode: "mode",
        seed: "seed",
    }

    output_dict = {
        "audio_out": audio_out,
        "metadata": gr.JSON(visible=False),
        "folder_root": gr.Textbox(visible=False),
    }

    generate_button.click(
        **randomize_seed_callback,
    ).then(
        **dictionarize(
            fn=generate_audio_gradio,
            inputs=input_dict,
            outputs=output_dict,
        ),
        api_name="vall_e_x_generate",
    )


def valle_x_ui_generation_prompt_making():
    from valle_x.utils.prompt_making import transcribe_one, make_prompt, make_transcript

    # transcribe_one(model, audio_path)
    # make_prompt(name, audio_prompt_path, transcript=None)
    # make_transcript(name, wav, sr, transcript=None)

    def _valle_x_ui_prompt_making():
        with gr.Column():
            audio = gr.Audio(label="Audio")


def valle_x_tab():
    with gr.Tab("Valle-X", id="valle_x"):
        valle_x_ui_generation()
    # with gr.Tab("Valle-X Prompt Making Demo", id="valle_x_prompt_making"):
    #     valle_x_ui_prompt_making()


if __name__ == "__main__":
    # only if demo has been defined
    if "demo" in locals():
        demo.close()
    with gr.Blocks() as demo:
        valle_x_tab()
        demo.launch(
            server_port=7770,
        )
