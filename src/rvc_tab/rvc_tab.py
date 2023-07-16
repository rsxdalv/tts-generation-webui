import os
import gradio as gr
from scipy.io import wavfile
import torch
import tempfile
from rvc_beta import infer_batch_rvc
from rvc_beta.infer_batch_rvc import vc_single, get_vc
from src.rvc_tab.get_and_load_hubert import get_and_load_hubert
from src.Joutai import Joutai
from src.history_tab.open_folder import open_folder


def inject_hubert(hubert_model: torch.nn.Module):
    infer_batch_rvc.hubert_model = hubert_model


def infer_rvc(
    f0up_key,
    input_path,
    index_path,
    f0method,
    opt_path,
    model_path,
    index_rate,
):
    get_vc(model_path)
    wav_opt = vc_single(0, input_path, f0up_key, None, f0method, index_path, index_rate)
    out_path = os.path.join(opt_path, f"{os.path.basename(input_path)}.wav")
    wavfile.write(out_path, infer_batch_rvc.tgt_sr, wav_opt)
    return out_path


def run_rvc(
    f0up_key: str,
    original_audio_path: str,
    index_path: tempfile._TemporaryFileWrapper,
    f0method: str,
    model_path: tempfile._TemporaryFileWrapper,
    index_rate: float,
    device: str,
    is_half: bool,
    filter_radius: int,
    resample_sr: int,
    rms_mix_rate: float,
    protect: float,
):
    infer_batch_rvc.set_params_temp(
        _device=device,
        _is_half=is_half,
        _filter_radius=filter_radius,
        _resample_sr=resample_sr,
        _rms_mix_rate=rms_mix_rate,
        _protect=protect,
    )

    from rvc_beta.infer_batch_rvc import config
    if device == "cpu":  # Workaround for "slow_conv2d_cpu" not implemented for 'Half' 
        config.is_half = is_half

    if infer_batch_rvc.hubert_model is None:
        get_and_load_hubert()

    opt_path = "./outputs-rvc/"
    return infer_rvc(
        f0method=f0method,
        f0up_key=f0up_key,
        input_path=original_audio_path,
        index_path=index_path.name,
        index_rate=index_rate,
        model_path=model_path.name,
        opt_path=opt_path,
    )


def rvc_ui():
    gr.Markdown("# RVC Beta Demo")
    with gr.Row(equal_height=False):
        with gr.Column():
            with gr.Row():
                model_path = gr.File(
                    label="Model Path",
                    type="file",
                    file_count="single",
                    file_types=[".pth"],
                    # value="c:\\Users\\admin\\Desktop\\one-click-installers-tts-main\\tts-generation-webui\\temp\\rvc-webui\\models\\checkpoints\\Alina_Gray.pth",
                )
                index_path = gr.File(
                    label="Index Path",
                    type="file",
                    file_count="single",
                    file_types=[".index"],
                    # value="c:\\Users\\admin\\Desktop\\one-click-installers-tts-main\\tts-generation-webui\\temp\\rvc-webui\\models\\checkpoints\\added_IVF1429_Flat_nprobe_1_Alina_Gray_v1.index",
                )
            with gr.Row():
                f0up_key = gr.Textbox(label="f0 Up key", value="0")
                # f0method = gr.Dropdown(
                #     ["harvest", "pm", "crepe"], label="f0 Method", value="harvest"
                # )
                f0method = gr.Radio(
                    ["harvest", "pm", "crepe"], label="f0 Method", value="harvest"
                )
                index_rate = gr.Slider(
                    minimum=0.0, maximum=1.0, step=0.01, value=0.66, label="Index Rate"
                )
                filter_radius = gr.Slider(
                    minimum=0, maximum=10, step=1, value=3, label="Filter Radius"
                )
            with gr.Row():
                resample_sr = gr.Slider(
                    minimum=0, maximum=48000, step=1, value=0, label="Resample SR"
                )
                rms_mix_rate = gr.Slider(
                    minimum=0.0, maximum=1.0, step=0.01, value=1, label="RMS Mix Rate"
                )
                protect = gr.Slider(
                    minimum=0.0, maximum=1.0, step=0.01, value=0.33, label="Protect"
                )
            with gr.Group():
                gr.Markdown("### Hubert")
                with gr.Row():
                    device = gr.Dropdown(
                        ["cuda:0", "cpu"], label="Device", value="cuda:0"
                    )
                    is_half = gr.Checkbox(
                        label="Use half precision model (Depends on GPU support)",
                        value=False,
                    )
                    gr.Button(
                        value="Clear Hubert (to reload on next generation)",
                        variant="secondary",
                    ).click(
                        fn=lambda: inject_hubert(None)
                    )  # type: ignore

        with gr.Column():
            original_audio = Joutai.singleton.rvc_input
            original_audio.render()
            button = gr.Button(value="Convert", variant="primary")
            result = gr.Audio(label="result", interactive=False)
            open_folder_button = gr.Button(value="Open outputs folder", variant="secondary")
            open_folder_button.click(lambda: open_folder("outputs-rvc"))

        button.click(
            run_rvc,
            inputs=[
                f0up_key,
                original_audio,
                index_path,
                f0method,
                model_path,
                index_rate,
                device,
                is_half,
                filter_radius,
                resample_sr,
                rms_mix_rate,
                protect,
            ],
            outputs=result,
        )

    return original_audio


def rvc_conversion_tab():
    with gr.Tab("RVC Beta Demo", id="rvc_tab"):
        rvc_ui()


if __name__ == "__main__":
    with gr.Blocks(analytics_enabled=False) as demo:
        rvc_conversion_tab()

    demo.launch()
