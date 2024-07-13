import gradio as gr
from styletts2 import tts
from nltk.tokenize import word_tokenize

SAMPLE_RATE = 24_000
style_tts2_model: tts.StyleTTS2 = None  # type: ignore


def preload_models_if_needed():
    global style_tts2_model
    if style_tts2_model is None:
        style_tts2_model = tts.StyleTTS2()
        # style_tts2_model.load_model()
    return style_tts2_model


def preview_phonemization(text):
    style_tts2_model = preload_models_if_needed()
    text = text.strip()
    text = text.replace('"', "")
    phonemized_text = style_tts2_model.phoneme_converter.phonemize(text)
    ps = word_tokenize(phonemized_text)
    phoneme_string = " ".join(ps)
    return phoneme_string


def generate_audio_styleTTS2(
    text,
    alpha=0.3,
    beta=0.7,
    diffusion_steps=5,
    embedding_scale=1,
):
    style_tts2_model = preload_models_if_needed()
    audio_array = style_tts2_model.inference(
        text=text,
        # target_voice_path=target_voice_path,
        alpha=alpha,
        beta=beta,
        diffusion_steps=diffusion_steps,
        embedding_scale=embedding_scale,
        # ref_s=None,
        # phonemize=True
    )
    return (SAMPLE_RATE, audio_array)


def style_tts2_ui():
    gr.Markdown(
        """
        # StyleTTS2 Demo
        To use it, simply enter your text, and click "Generate".
        The model will generate audio from the text.
        It uses the [StyleTTS2](https://styletts2.github.io/) model via the [Python Package](https://github.com/sidharthrajaram/StyleTTS2).
        As a result, the phonemizer is a MIT licensed subsitute.
        
        Parameters:
        * text: Input text to turn into speech.
        * alpha: Determines timbre of speech, higher means style is more suitable to text than to the target voice.
        * beta: Determines prosody of speech, higher means style is more suitable to text than to the target voice.
        * diffusion_steps: The more the steps, the more diverse the samples are, with the cost of speed.
        * embedding_scale: Higher scale means style is more conditional to the input text and hence more emotional.
        """
    )
    text = gr.Textbox(label="Text", lines=3, placeholder="Enter text here...")

    preview_phonemized_text_button = gr.Button("Preview phonemized text")
    phonemized_text = gr.Textbox(label="Phonemized text (what the model will see)", interactive=False)

    preview_phonemized_text_button.click(
        fn=preview_phonemization,
        inputs=[text],
        outputs=[phonemized_text],
        api_name="style_tts2_phonemize",
    )

    with gr.Row():
        alpha = gr.Slider(label="Alpha (timbre)", minimum=-0.5, maximum=2.0, value=0.3)
        beta = gr.Slider(label="Beta (prosody)", minimum=-1.0, maximum=2.0, value=0.7)
        diffusion_steps = gr.Slider(
            label="Diffusion Steps (diversity)", minimum=1, maximum=20, value=5, step=1
        )
        embedding_scale = gr.Slider(
            label="Embedding Scale (emotion)", minimum=0.5, maximum=1.5, value=1.0
        )

    with gr.Row():
        reset_params_button = gr.Button("Reset params")
        reset_params_button.click(
            fn=lambda: [
                alpha.update(0.3),
                beta.update(0.7),
                diffusion_steps.update(5),
                embedding_scale.update(1.0),
            ],
            outputs=[
                alpha,
                beta,
                diffusion_steps,
                embedding_scale,
            ],
        )
        generate_button = gr.Button("Generate", variant="primary")

    audio = gr.Audio(label="Generated audio", elem_classes="tts-audio")

    generate_button.click(
        fn=generate_audio_styleTTS2,
        inputs=[text, alpha, beta, diffusion_steps, embedding_scale],
        outputs=[audio],
        api_name="style_tts2_generate",
    )


def style_tts2_tab():
    with gr.Tab("StyleTTS2 Generation"):
        style_tts2_ui()


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()
    with gr.Blocks() as demo:
        style_tts2_tab()
        demo.launch()
