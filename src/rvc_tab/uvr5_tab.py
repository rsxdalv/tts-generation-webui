import os

# import sys
import gradio as gr
from src.history_tab.open_folder import open_folder
from src.rvc_tab.download_uvr5 import download_uvr5

# from src.rvc_tab.hide_argv import hide_argv

# import rvc_pkg

# rvc_dir = os.path.dirname(rvc_pkg.__file__)

# sys.path.append(rvc_dir)
# with hide_argv():
#     from rvc_pkg.infer.modules.uvr5.modules import uvr
# sys.path.remove(rvc_dir)

# os.environ["TEMP"] = os.path.join(now_dir, "temp", "rvc")
# os.makedirs(os.environ["TEMP"], exist_ok=True)

from rvc.modules.uvr5.modules import UVR
from pathlib import Path

now_dir = os.getcwd()
temp_dir = Path(os.path.join(now_dir, "temp", "rvc"))

UVR5_MODEL_LIST = [
    "HP2_all_vocals.pth",
    "HP3_all_vocals.pth",
    "HP5_only_main_vocal.pth",
    "VR-DeEchoAggressive.pth",
    "VR-DeEchoDeReverb.pth",
    "VR-DeEchoNormal.pth",
    # "onnx_dereverb_By_FoxJoy/vocals.onnx",
]

uvr = None
# fix issue with / in ENV \\ from os.path.join for VR-* models
# os.path.join(os.getenv("weight_uvr5_root"), model_name), 

def uvr_wrapper(model_name, agg, input_file):
    download_uvr5(model_name)
    model_name = model_name.replace(".pth", "")
    global uvr
    if uvr is None:
        uvr = UVR()
    results = uvr.uvr_wrapper(
        audio_path=Path(input_file),
        agg=agg,
        model_name=model_name,
        temp_dir=temp_dir,
    )
    wav_instrument, wav_vocals, sample_rate, _agg = results[0]
    return (sample_rate, wav_instrument), (sample_rate, wav_vocals)


def uvr5_ui():
    with gr.Column():
        input_file = gr.Audio(label="Input Audio", type="filepath")
    with gr.Column():
        with gr.Row():
            model_radio = gr.Radio(
                label="Model",
                choices=UVR5_MODEL_LIST,  # type: ignore
                value=UVR5_MODEL_LIST[0],
            )
        agg = gr.Slider(
            minimum=0,
            maximum=20,
            step=1,
            label="future-proofing",
            value=10,
        )
    with gr.Row():
        convert_button = gr.Button("Convert", variant="primary")
        open_folder_button = gr.Button(value="Open outputs folder", variant="secondary")
        open_folder_button.click(lambda: open_folder("outputs-rvc"))

    output_instrument = gr.Audio(label="Instrument")
    output_vocals = gr.Audio(label="Vocals")

    convert_button.click(
        uvr_wrapper,
        [model_radio, agg, input_file],
        [output_instrument, output_vocals],
        api_name="uvr_convert",
    )


def uvr5_tab():
    # disabled for now
    return
    # with gr.TabItem("UVR5 (initial demo version)"):
    #     uvr5_ui()


if __name__ == "__main__":
    with gr.Blocks(
        title="TTS Generation WebUI (Bark, MusicGen + AudioGen, Tortoise, RVC)",
    ) as demo:
        uvr5_tab()
        demo.launch(
            server_port=7866,
            enable_queue=True,
        )
