import gradio as gr
from valle_x.utils.generation import (
    SAMPLE_RATE,
    preload_models,
    generate_audio,
    generate_audio_from_long_text,
    text_tokenizer,
    langdropdown2token,
    token2lang,
    lang2token,
    langid,
)
from valle_x.utils.sentence_cutter import split_text_into_sentences

preload_models_latch = False


def preprocess_text(text, language="auto"):
    language = get_lang(language)
    text = text.replace("\n", "").strip(" ")
    # detect language
    if language == "auto":
        language = langid.classify(text)[0]
    lang_token = lang2token[language]
    text = lang_token + text + lang_token
    return str(
        text_tokenizer.tokenize(text=f"_{text}".strip())
    )


def preload_models_if_needed():
    global preload_models_latch
    if not preload_models_latch:
        preload_models(
            checkpoints_dir="./data/models/vall-e-x/",
        )
        preload_models_latch = True


def get_lang(language):
    lang = token2lang[langdropdown2token[language]]
    return lang if lang != "mix" else "auto"

def generate_audio_gradio(text, prompt, language, accent):
    preload_models_if_needed()
    lang = get_lang(language)

    prompt = prompt if prompt != "" else None
    audio_array = generate_audio(
        text=text,
        prompt=prompt,
        language=lang,
        accent=accent,
    )
    return (SAMPLE_RATE, audio_array)


def generate_audio_from_long_text_gradio(text, prompt, language, accent, mode):
    preload_models_if_needed()
    lang = get_lang(language)

    prompt = prompt if prompt != "" else None
    audio_array = generate_audio_from_long_text(
        text=text,
        prompt=prompt,
        language=lang,
        accent=accent,
        mode=mode,
    )
    return (SAMPLE_RATE, audio_array)


def valle_x_ui_generation():
    with gr.Column():
        text = gr.Textbox(label="Text", lines=3, placeholder="Enter text here...")
        prompt = gr.Textbox(label="Prompt", visible=False, value="")

        with gr.Accordion("Analyze text", open=False):
            split_text_into_sentences_button = gr.Button("Preview sentences")
            split_text = gr.Textbox(label="Text after split")

            split_text_into_sentences_button.click(
                fn=lambda x: "###\n".join(split_text_into_sentences(x)),
                inputs=[text],
                outputs=[split_text],
                api_name="vall_e_x_split_text_into_sentences",
            )

            split_text_into_tokens_button = gr.Button("Preview tokens")
            tokens = gr.Textbox(label="Tokens")

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

            """
            For long audio generation, two modes are available.
            fixed-prompt: This mode will keep using the same prompt the user has provided, and generate audio sentence by sentence.
            sliding-window: This mode will use the last sentence as the prompt for the next sentence, but has some concern on speaker maintenance.
            """

            mode = gr.Radio(
                ["fixed-prompt", "sliding-window"],
                label="Mode",
                value="fixed-prompt",
            )

        with gr.Row():
            generate_button = gr.Button("Generate")
            generate_long_text_button = gr.Button("Generate long text")

        audio = gr.Audio(label="Generated audio", elem_classes="tts-audio")

        split_text_into_tokens_button.click(
            fn=preprocess_text,
            inputs=[text, language],
            outputs=[tokens],
            api_name="vall_e_x_tokenize",
        )

        generate_button.click(
            fn=generate_audio_gradio,
            inputs=[text, prompt, language, accent],
            outputs=[audio],
            api_name="vall_e_x_generate",
        )

        generate_long_text_button.click(
            fn=generate_audio_from_long_text_gradio,
            inputs=[text, prompt, language, accent, mode],
            outputs=[audio],
            api_name="vall_e_x_generate_long_text",
        )

from valle_x.utils.prompt_making import transcribe_one, make_prompt, make_transcript

# transcribe_one(model, audio_path)
# make_prompt(name, audio_prompt_path, transcript=None)
# make_transcript(name, wav, sr, transcript=None)

def valle_x_ui_prompt_making():
    with gr.Column():
        audio = gr.Audio(label="Audio", elem_classes="tts-audio")

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
        demo.launch()