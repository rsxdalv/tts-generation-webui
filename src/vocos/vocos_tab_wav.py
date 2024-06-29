import torch
from vocos import Vocos
import torchaudio
import numpy as np
import gradio as gr

from src.bark.npz_tools import save_npz
from src.bark.FullGeneration import FullGeneration
import torchaudio
import torch
from encodec.utils import convert_audio
from bark.generation import load_codec_model

import gradio as gr
import numpy as np


def vocos_predict(wav_file: str, bandwidth_id: int):
    vocos = get_model()
    bandwidth_id_2 = torch.tensor([bandwidth_id])
    y, sr = torchaudio.load(wav_file)
    if y.size(0) > 1:  # mix to mono
        y = y.mean(dim=0, keepdim=True)
    y = torchaudio.functional.resample(y, orig_freq=sr, new_freq=24000)
    with torch.no_grad():
        y_hat = vocos(y, bandwidth_id=bandwidth_id_2)
    return (24000, y_hat.squeeze().numpy())


def get_model():
    return Vocos.from_pretrained("charactr/vocos-encodec-24khz")


def vocos_tab_wav():
    with gr.Tab("Vocos (WAV)"):
        file_input = gr.Audio(
            label="Input Audio",
            type="filepath",
            source="upload",
            interactive=True,
        )

        options = [1.5, 3.0, 6.0, 12.0]
        options = [str(x) for x in options]
        bandwidth_id = gr.Dropdown(
            value=options[0],
            choices=options,
            type="index",
            label="Bandwidth in kbps",
        )
        submit = gr.Button(value="Reconstruct")
        output = gr.Audio(label="Output Audio")

        submit.click(
            fn=vocos_predict,
            inputs=[file_input, bandwidth_id],
            outputs=output,
            api_name="vocos_wav",
        )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        vocos_tab_wav()

    demo.launch(server_port=7861)
