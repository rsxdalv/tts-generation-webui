import gradio as gr

from tts_webui.decorators.gradio_dict_decorator import gradio_dict_decorator
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

SAMPLE_RATE = 24_000


@manage_model_state("style_tts2")
def get_model(model_name=""):
    from styletts2.tts import StyleTTS2

    return StyleTTS2(
        model_checkpoint_path=None if model_name == "" else model_name,
        config_path=None,
    )


def preview_phonemization(text):
    from nltk.tokenize import word_tokenize

    style_tts2_model = get_model("")
    text = text.strip()
    text = text.replace('"', "")
    phonemized_text = style_tts2_model.phoneme_converter.phonemize(text)
    ps = word_tokenize(phonemized_text)
    phoneme_string = " ".join(ps)
    return phoneme_string


@decorator_extension_outer
@decorator_apply_torch_seed
@decorator_save_metadata
@decorator_save_wav
@decorator_add_model_type("style_tts2")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def generate_audio_styleTTS2(
    text,
    alpha=0.3,
    beta=0.7,
    diffusion_steps=5,
    embedding_scale=1,
    **kwargs,
):
    model = get_model("")
    audio_array = model.inference(
        text=text,
        alpha=alpha,
        beta=beta,
        diffusion_steps=diffusion_steps,
        embedding_scale=embedding_scale,
        # target_voice_path=target_voice_path,
        # ref_s=None,
        # phonemize=True
    )
    return {"audio_out": (SAMPLE_RATE, audio_array)}


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
    phonemized_text = gr.Textbox(
        label="Phonemized text (what the model will see)", interactive=False
    )

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
        unload_model_button("style_tts2")

    with gr.Row():
        reset_params_button = gr.Button("Reset params")
        reset_params_button.click(
            fn=lambda: [
                gr.Slider(value=0.3),
                gr.Slider(value=0.7),
                gr.Slider(value=5),
                gr.Slider(value=1.0),
            ],
            outputs=[
                alpha,
                beta,
                diffusion_steps,
                embedding_scale,
            ],
        )
        generate_button = gr.Button("Generate", variant="primary")

    audio_out = gr.Audio(label="Generated audio")

    seed, randomize_seed_callback = randomize_seed_ui()

    input_dict = {
        text: "text",
        alpha: "alpha",
        beta: "beta",
        diffusion_steps: "diffusion_steps",
        embedding_scale: "embedding_scale",
        seed: "seed",
    }

    output_dict = {
        "audio_out": audio_out,
        "metadata": gr.JSON(label="Metadata", visible=False),
        "folder_root": gr.Textbox(label="Folder root", visible=False),
    }

    generate_button.click(
        **randomize_seed_callback,
    ).then(
        fn=gradio_dict_decorator(
            fn=generate_audio_styleTTS2,
            gradio_fn_input_dictionary=input_dict,
            outputs=output_dict,
        ),
        inputs={*input_dict},
        outputs=list(output_dict.values()),
        api_name="style_tts2_generate",
    )


def style_tts2_tab():
    with gr.Tab("StyleTTS2"):
        style_tts2_ui()


if __name__ == "__main__":
    if "demo" in locals():
        locals()["demo"].close()
    with gr.Blocks() as demo:
        style_tts2_tab()
        demo.launch()
