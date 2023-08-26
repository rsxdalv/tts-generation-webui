import torch
from vocos import Vocos
import torchaudio
import torch
import gradio as gr
import tempfile
from src.bark.npz_tools import load_npz
from src.Joutai import Joutai


def get_device():
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


vocos_model = None


def reconstruct_with_vocos(audio_tokens):
    device = get_device()
    global vocos_model
    if vocos_model is None:
        vocos_model = Vocos.from_pretrained("charactr/vocos-encodec-24khz").to(device)
    vocos = vocos_model
    audio_tokens_torch = torch.from_numpy(audio_tokens).to(device)
    features = vocos.codes_to_features(audio_tokens_torch)
    return vocos.decode(
        features, bandwidth_id=torch.tensor([2], device=device)
    )  # 6 kbps


def upsample_to_44100(audio):
    return torchaudio.functional.resample(audio, orig_freq=24000, new_freq=44100)


def vocos_tab_bark():
    with gr.Tab("Vocos (NPZ)"):
        npz_file = Joutai.singleton.vocos_input_npz
        npz_file.render()

        submit = gr.Button(value="Decode")
        current = gr.Audio(label="decoded with Encodec:")
        output = gr.Audio(label="decoded with Vocos:")
        gr.Button("To Demucs").click(
            **Joutai.singleton.send_to_demucs(
                inputs=[output],
            )
        ).then(
            **Joutai.singleton.switch_to_tab("demucs"),
        )
        gr.Button("To Remixer").click(
            **Joutai.singleton.send_to_remixer(
                inputs=[output],
            )
        ).then(
            **Joutai.singleton.switch_to_tab("simple_remixer"),
        )
        gr.Button("To RVC").click(
            **Joutai.singleton.sent_to_rvc(
                inputs=[output],
            )
        ).then(
            **Joutai.singleton.switch_to_tab("rvc_tab"),
        )

        from src.bark.get_audio_from_npz import get_audio_from_full_generation

        def get_audio(npz_file_obj: tempfile._TemporaryFileWrapper):
            if npz_file_obj is None:
                print("No file selected")
                return [None, None]

            full_generation = load_npz(npz_file_obj.name)
            return [
                get_audio_from_full_generation(full_generation),  # type: ignore
                None,
            ]

        npz_file.change(
            fn=get_audio,
            inputs=[npz_file],
            outputs=[current, output],
        )

        def vocos_predict(npz_file_obj: tempfile._TemporaryFileWrapper):
            if npz_file_obj is None:
                print("No file selected")
                return None

            full_generation = load_npz(npz_file_obj.name)
            audio_tokens = full_generation["fine_prompt"]
            vocos_output = reconstruct_with_vocos(audio_tokens)
            vocos_output = upsample_to_44100(vocos_output)
            return (44100, vocos_output.cpu().squeeze().numpy())

        submit.click(
            fn=vocos_predict,
            inputs=[npz_file],
            outputs=output,
        )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        vocos_tab_bark()

    demo.launch(server_port=7863)
