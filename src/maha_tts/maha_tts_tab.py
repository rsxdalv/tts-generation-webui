import torch
import glob
import os
import gradio as gr
from maha_tts import load_models, infer_tts, config
from src.history_tab.open_folder import open_folder


def get_ref_clips(speaker_name):
    return glob.glob(os.path.join("./voices-tortoise/", speaker_name, "*.wav"))


def get_voice_list():
    files = os.listdir("./voices-tortoise/")
    dirs = [f for f in files if os.path.isdir(os.path.join("./voices-tortoise/", f))]
    return dirs


def generate_audio_maha_tts(
    text,
    model_language,
    text_language,
    speaker_name,
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

    ref_clips = get_ref_clips(speaker_name)
    text_language = (
        torch.tensor(config.lang_index[text_language]).to(device).unsqueeze(0)
    )
    audio, sr = infer_tts(
        text, ref_clips, diffuser, diff_model, ts_model, vocoder, text_language
    )
    return (sr, audio)


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

    with gr.Row():
        voices = get_voice_list()
        speaker_name = gr.Dropdown(
            choices=voices,  # type: ignore
            label="Speaker Name",
            value=voices[0] if voices else "None",
            type="value",
        )

        open_voices_button = gr.Button(value="Open voices folder")

        open_voices_button.click(
            lambda: open_folder("voices-tortoise"),
        )

    button = gr.Button("Generate")
    maha_tts_output = gr.Audio(label="Output Audio")
    button.click(
        fn=generate_audio_maha_tts,
        inputs=[
            maha_tts_input,
            model_language,
            maha_tts_language,
            speaker_name,
            device,
        ],
        outputs=maha_tts_output,
        api_name="maha_tts",
    )


def maha_tts_tab():
    with gr.Tab(label="Maha TTS Demo"):
        maha_tts_ui()


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()
    with gr.Blocks() as demo:
        maha_tts_tab()

    demo.launch()
