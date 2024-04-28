import glob
import os
import torch
import gradio as gr
from importlib.metadata import version
from maha_tts import load_models, infer_tts, config
from src.bark.parse_or_set_seed import parse_or_generate_seed
from src.magnet.utils import Seed, Timer
from src.tortoise.gr_reload_button import gr_open_button_simple, gr_reload_button


def get_ref_clips(speaker_name):
    return glob.glob(os.path.join("./voices-tortoise/", speaker_name, "*.wav"))


def get_voice_list():
    files = os.listdir("./voices-tortoise/")
    dirs = [f for f in files if os.path.isdir(os.path.join("./voices-tortoise/", f))]
    return dirs

MAHA_VERSION = version("maha_tts")

# class MahaTTSParams(TypedDict):
#     text: str
#     model_language: str
#     text_language: str
#     speaker_name: str
#     seed: int
#     device: str

# def generate(
#     model: str,
#     text: str,
#     seed: int,
#     use_sampling: bool,
#     top_k: int,
#     top_p: float,
#     temperature: float,
#     max_cfg_coef: float,
#     min_cfg_coef: float,
#     decoding_step_1: int,
#     decoding_step_2: int,
#     decoding_step_3: int,
#     decoding_step_4: int,
#     span_arrangement: Literal["nonoverlap", "stride1"],
# ):
#     MODEL = get_model(model)

#     seed2 = parse_or_generate_seed(seed, 0)

#     params = MagnetParams(
#         model=model,
#         text=text,
#         seed=seed2,
#         use_sampling=use_sampling,
#         top_k=top_k,
#         top_p=top_p,
#         temperature=temperature,
#         max_cfg_coef=max_cfg_coef,
#         min_cfg_coef=min_cfg_coef,
#         decoding_steps=[
#             decoding_step_1,
#             decoding_step_2,
#             decoding_step_3,
#             decoding_step_4,
#         ],
#         span_arrangement=span_arrangement,
#     )

#     MODEL.set_generation_params(
#         **just_generation(params),
#     )

#     tokens = None

#     with Timer(), Seed(seed2):
#         log_generation_musicgen(params)
#         output, tokens = MODEL.generate(
#             descriptions=[text],
#             progress=True,
#             return_tokens=True,
#         )

#     output = output.detach().cpu().numpy().squeeze()

#     filename, plot, _metadata = save_generation(
#         audio_array=output,
#         SAMPLE_RATE=MODEL.sample_rate,
#         params=params,
#         tokens=tokens,
#     )

#     return [
#         (MODEL.sample_rate, output.transpose()),
#         os.path.dirname(filename),
#         plot,
#         params["seed"],
#         _metadata,
#     ]


def generate_audio_maha_tts(
    text,
    model_language,
    text_language,
    speaker_name,
    seed=0,
    device="auto",
):
    device = torch.device(
        device == "auto" and "cuda" if torch.cuda.is_available() else "cpu" or device
    )
    diff_model, ts_model, vocoder, diffuser = load_models(
        name=model_language,
        device=device,
    )
    print(maha_tts_params_to_string(text, model_language, text_language, speaker_name))

    seed2 = parse_or_generate_seed(seed, 0)

    with Timer(), Seed(seed2):
        ref_clips = get_ref_clips(speaker_name)
        text_language = (
            torch.tensor(config.lang_index[text_language]).to(device).unsqueeze(0)
        )
        audio, sr = infer_tts(
            text, ref_clips, diffuser, diff_model, ts_model, vocoder, text_language
        )
    metadata = {
        "_version": "0.0.1",
        "_hash_version": "0.0.2",
        "_type": "maha_tts",
        "text": text,
        "model_language": model_language,
        "text_language": text_language,
        "speaker_name": speaker_name,
        "seed": str(seed2),
    }
    return [(sr, audio), metadata]


def maha_tts_params_to_string(text, model_language, text_language, speaker_name):
    return "MahaTTS Params(\n{}\n)".format(
        "    \n".join(
            [
                f"{k}={v}"
                for k, v in {
                    "text": text,
                    "model_language": model_language,
                    "language": text_language,
                    "speaker_name": speaker_name,
                }.items()
            ]
        )
    )


def maha_tts_ui():
    gr.Markdown(
        """
    # Maha TTS Demo
    To use it, simply enter your text, and click "Generate".
    The model will generate speech from the text.
    It uses the [MahaTTS](https://huggingface.co/Dubverse/MahaTTS) model from HuggingFace.

    To make a voice, create a folder with the name of the voice in the `voices-tortoise` folder.
    Then, add the voice's wav files to the folder.

    A voice must be used. Some voices give errors.

    The reference voices can be downloaded [here](https://huggingface.co/Dubverse/MahaTTS/resolve/main/maha_tts/pretrained_models/infer_ref_wavs.zip).
    """
    )
    gr.Markdown(f"MahaTTS version: {MAHA_VERSION}")
    maha_tts_input = gr.Textbox(lines=2, label="Input Text")
    with gr.Row():
        model_language = gr.Radio(
            choices=[
                ("English", "Smolie-en"),
                ("Indian", "Smolie-in"),
            ],
            label="Model Language",
            value="Smolie-in",
            type="value",
        )
        device = gr.Radio(
            choices=["auto", "cuda", "cpu"],
            label="Device",
            value="auto",
            type="value",
        )
    maha_tts_language = gr.Radio(
        choices=list(config.lang_index.keys()),
        label="Text Language",
        value="english",
        type="value",
    )
    model_language.change(
        fn=lambda choice: choice == "Smolie-en"
        and gr.Radio.update(
            value="english",
            visible=False,
            interactive=False,
        )
        or gr.Radio.update(
            interactive=True,
            visible=True,
        ),
        inputs=[model_language],
        outputs=[maha_tts_language],
    )

    with gr.Box():
        gr.Markdown("Speaker Name")
        with gr.Row():
            voices = get_voice_list()
            speaker_name = gr.Dropdown(
                choices=voices,  # type: ignore
                value=voices[0] if voices else "None",
                type="value",
                show_label=False,
                container=False,
            )
            gr_open_button_simple("voices-tortoise", api_name="maha_tts_open_voices")
            gr_reload_button().click(
                fn=lambda: gr.Dropdown.update(choices=get_voice_list()),  # type: ignore
                outputs=[speaker_name],
                api_name="maha_tts_refresh_voices",
            )

    seed = gr.Number(label="Seed", value=0)

    button = gr.Button("Generate")
    maha_tts_output = gr.Audio(label="Output Audio")
    metadata = gr.JSON(
        label="Metadata",
        visible=False,
    )
    button.click(
        fn=generate_audio_maha_tts,
        inputs=[
            maha_tts_input,
            model_language,
            maha_tts_language,
            speaker_name,
            seed,
            device,
        ],
        outputs=[maha_tts_output, metadata],
        api_name="maha_tts",
    )


def maha_tts_tab():
    with gr.Tab(label="Maha TTS Demo"):
        maha_tts_ui()


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()  # type: ignore
    with gr.Blocks() as demo:
        maha_tts_tab()

    demo.launch()
