import torch
import torchaudio
import gradio as gr
import tempfile

from tts_webui.bark.npz_tools import load_npz
from tts_webui.vocos.get_vocos_model import get_vocos_model


def reconstruct_with_vocos(audio_tokens):
    device = "cpu"
    vocos = get_vocos_model(model_name="charactr/vocos-encodec-24khz")
    audio_tokens_torch = torch.from_numpy(audio_tokens).to(device)
    features = vocos.codes_to_features(audio_tokens_torch)
    bitrate_id_for_6kbps = 2
    return vocos.decode(
        features, bandwidth_id=torch.tensor([bitrate_id_for_6kbps], device=device)
    )


def vocos_predict(npz_file: tempfile._TemporaryFileWrapper):
    if npz_file is None:
        print("No file selected")
        return None

    full_generation = load_npz(npz_file.name)
    audio_tokens = full_generation["fine_prompt"]
    vocos_output = reconstruct_with_vocos(audio_tokens)
    vocos_output = upsample_to_44100(vocos_output)
    return (44100, vocos_output.cpu().squeeze().numpy())


def upsample_to_44100(audio):
    return torchaudio.functional.resample(audio, orig_freq=24000, new_freq=44100)


def get_audio(npz_file: tempfile._TemporaryFileWrapper):
    from tts_webui.bark.get_audio_from_npz import get_audio_from_full_generation

    if npz_file is None:
        print("No file selected")
        return [None, None]

    full_generation = load_npz(npz_file.name)
    return [
        get_audio_from_full_generation(full_generation),  # type: ignore
        None,
    ]


def vocos_bark_ui():
    npz_file = gr.File(label="Input NPZ", file_types=[".npz"], interactive=True)

    submit = gr.Button(value="Decode")
    current = gr.Audio(label="decoded with Encodec:")
    output = gr.Audio(label="decoded with Vocos:")

    npz_file.change(
        fn=get_audio,
        inputs=[npz_file],
        outputs=[current, output],
        api_name="encodec_decode",
    )

    submit.click(
        fn=vocos_predict,
        inputs=[npz_file],
        outputs=output,
        api_name="vocos_npz",
    )


def vocos_tab_bark():
    with gr.Tab("Vocos (Bark NPZ)"):
        vocos_bark_ui()


if __name__ == "__main__":
    with gr.Blocks() as demo:
        vocos_tab_bark()

    demo.launch(server_port=7863)
