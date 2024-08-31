import torchaudio
import torch
import gradio as gr
from demucs import pretrained
from demucs.apply import apply_model
from demucs.audio import convert_audio


_demucs_model = None


def get_demucs_model():
    global _demucs_model
    if _demucs_model is None:
        _demucs_model = pretrained.get_model("htdemucs")
    return _demucs_model


def apply_demucs(wav, sr):
    demucs_model = get_demucs_model()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    wav = convert_audio(wav, sr, demucs_model.samplerate, demucs_model.audio_channels)
    return apply_model(demucs_model, wav, device=device)[0]  # type: ignore


COMPONENTS = ["drums", "bass", "other", "vocals"]


def demucs_audio(audio):
    demucs_model = get_demucs_model()
    wav, sr = torchaudio.load(audio)
    out = apply_demucs(wav=wav.unsqueeze(0), sr=sr)

    def to_wav(tensor):
        # make mono by picking first channel
        tensor = tensor[0]
        tensor = tensor.detach().cpu().squeeze().numpy()
        tensor = (tensor * 32767).astype("int16")
        return tensor

    def get_audios(out):
        for name, source in zip(demucs_model.sources, out):
            yield name, (demucs_model.samplerate, to_wav(source))

    audios_dict = dict(get_audios(out))
    return [audios_dict.get(key) for key in COMPONENTS]


def demucs_ui():
    gr.Markdown(
        """
    # Demucs
    Gradio demo for Demucs: Music Source Separation in the Waveform Domain. 
    
    To use it, simply upload your audio, and click "Separate".
    """
    )
    with gr.Row(equal_height=False):
        with gr.Column():
            demucs_input = gr.Audio(label="Input", type="filepath")
            button = gr.Button("Separate")
        with gr.Column():
            outputs = [gr.Audio(label=label) for label in COMPONENTS]
    button.click(
        inputs=demucs_input,
        outputs=outputs,
        fn=demucs_audio,
        api_name="demucs",
    )


def demucs_tab():
    with gr.Tab("Demucs", id="demucs"):
        demucs_ui()


if __name__ == "__main__":
    if "interface" in locals():
        interface.close()  # type: ignore

    with gr.Blocks() as interface:
        with gr.Tabs():
            demucs_tab()

    interface.launch(enable_queue=True)
