import torch
import torchaudio
import gradio as gr

from tts_webui.utils.list_dir_models import unload_model_button
from tts_webui.vocos.get_vocos_model import get_vocos_model


def vocos_predict(audio: str, bandwidth: int):
    vocos = get_vocos_model(model_name="charactr/vocos-encodec-24khz")
    bandwidth_id = torch.tensor([bandwidth])
    y, sr = torchaudio.load(audio)
    if y.size(0) > 1:  # mix to mono
        y = y.mean(dim=0, keepdim=True)
    y = torchaudio.functional.resample(y, orig_freq=sr, new_freq=24000)
    with torch.no_grad():
        y_hat = vocos(y, bandwidth_id=bandwidth_id)
    return (24000, y_hat.squeeze().numpy())


def vocos_wav_ui():
    file_input = gr.Audio(
        label="Input Audio",
        type="filepath",
        sources="upload",
        interactive=True,
    )

    options = [str(x) for x in [1.5, 3.0, 6.0, 12.0]]
    bandwidth_id = gr.Dropdown(
        value=options[0],
        choices=options,
        type="index",
        label="Bandwidth in kbps",
    )
    submit = gr.Button(value="Reconstruct")
    output = gr.Audio(label="Output Audio")

    unload_model_button("vocos")

    submit.click(
        fn=vocos_predict,
        inputs=[file_input, bandwidth_id],
        outputs=output,
        api_name="vocos_wav",
    )


def vocos_tab_wav():
    with gr.Tab("Vocos (WAV)"):
        vocos_wav_ui()


if __name__ == "__main__":
    with gr.Blocks() as demo:
        vocos_tab_wav()

    demo.launch(server_port=7861)
