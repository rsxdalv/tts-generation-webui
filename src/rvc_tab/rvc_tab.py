from rvc_beta import infer_batch_rvc
import gradio as gr
from rvc_beta.infer_batch_rvc import vc_single, get_vc
import os
from scipy.io import wavfile
import torch
import tempfile


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
    opt_path = "./outputs/"
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
    with gr.Row():
        with gr.Column():
            f0up_key = gr.Textbox(label="f0 Up key", value="0")
            index_path = gr.File(
                label="Index Path",
                type="file",
                file_count="single",
                file_types=["index"],
                value="c:\\Users\\admin\\Desktop\\one-click-installers-tts-main\\tts-generation-webui\\temp\\rvc-webui\\models\\checkpoints\\added_IVF1429_Flat_nprobe_1_Alina_Gray_v1.index",
            )
            f0method = gr.Dropdown(
                ["harvest", "pm", "crepe"], label="f0 Method", value="harvest"
            )
            model_path = gr.File(
                label="Model Path",
                type="file",
                file_count="single",
                file_types=["pth"],
                value="c:\\Users\\admin\\Desktop\\one-click-installers-tts-main\\tts-generation-webui\\temp\\rvc-webui\\models\\checkpoints\\Alina_Gray.pth",
            )
            index_rate = gr.Slider(
                minimum=0.0, maximum=1.0, step=0.01, value=0.66, label="Index Rate"
            )
            device = gr.Dropdown(["cuda:0", "cpu"], label="Device", value="cuda:0")
            is_half = gr.Checkbox(
                label="Use half precision model (Depends on GPU support)", value=False
            )
            filter_radius = gr.Slider(
                minimum=0, maximum=10, step=1, value=3, label="Filter Radius"
            )
            resample_sr = gr.Slider(
                minimum=0, maximum=48000, step=1, value=0, label="Resample SR"
            )
            rms_mix_rate = gr.Slider(
                minimum=0.0, maximum=1.0, step=0.01, value=1, label="RMS Mix Rate"
            )
            protect = gr.Slider(
                minimum=0.0, maximum=1.0, step=0.01, value=0.33, label="Protect"
            )

            # def load_custom_hubert():
            #     hubert_model = torch.hub.load('pytorch/fairseq', 'hubert_large_ll60k')
            #     hubert_model.eval()
            #     hubert_model.cuda()
            #     inject_hubert(hubert_model)

            def clear_hubert():
                inject_hubert(None)  # type: ignore

            clear_hubert_button = gr.Button(value="Clear Hubert", variant="secondary")
            clear_hubert_button.click(clear_hubert)

        with gr.Column():
            original_audio = gr.Audio(
                label="Original Audio",
                value="C:\\Users\\admin\\Desktop\\one-click-installers-tts-main\\tts-generation-webui\\favorites\\2023-06-20_12-38-03__bark__continued_generation\\2023-06-20_12-38-03__bark__continued_generation.wav",
                type="filepath",
            )
            button = gr.Button(value="Convert", variant="primary")
            result = gr.Audio(label="result")

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
    with gr.Tab("RVC Beta Demo"):
        rvc_ui()


if __name__ == "__main__":
    with gr.Blocks(analytics_enabled=False) as demo:
        rvc_conversion_tab()

    demo.launch()
