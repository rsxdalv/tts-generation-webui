import os
import sys
import gradio as gr
from src.history_tab.open_folder import open_folder
from src.rvc_tab.download_uvr5 import download_uvr5
from src.rvc_tab.hide_argv import hide_argv

import rvc_pkg

rvc_dir = os.path.dirname(rvc_pkg.__file__)

sys.path.append(rvc_dir)
with hide_argv():
    from rvc_pkg.infer.modules.uvr5.modules import uvr
sys.path.remove(rvc_dir)

now_dir = os.getcwd()
os.environ["TEMP"] = os.path.join(now_dir, "temp", "rvc")
os.makedirs(os.environ["TEMP"], exist_ok=True)


UVR5_MODEL_LIST = [
    "HP2_all_vocals.pth",
    "HP3_all_vocals.pth",
    "HP5_only_main_vocal.pth",
    "VR-DeEchoAggressive.pth",
    "VR-DeEchoDeReverb.pth",
    "VR-DeEchoNormal.pth",
    # "onnx_dereverb_By_FoxJoy/vocals.onnx",
]

weight_uvr5_root = os.environ.get("weight_uvr5_root")


def uvr_wrapper(
    model_name, input_directory, opt_vocal_root, input_list, opt_ins_root, agg, format0
):
    opt_vocal_root = "outputs-rvc"
    opt_ins_root = "outputs-rvc"
    agg = 10
    format0 = "wav"
    download_uvr5(model_name)
    model_name = model_name.replace(".pth", "")
    yield from uvr(
        model_name,
        input_directory,
        opt_vocal_root,
        input_list,
        opt_ins_root,
        agg,
        format0,
    )


def uvr5_ui():
    with gr.Column():
        input_directory = gr.Textbox(
            label="Enter the path of the audio folder to be processed:",
            placeholder="C:\\Users\\Desktop\\todo-songs",
            visible=False,
        )
        gr.Markdown(
            """
### Import multiple audio files

You can import multiple audio files by dragging them into the input box.
Due to UVR5 bug, only files without spaces and special characters can be imported.

Example failure:
MyFile (3).mp3

Working example:
MyFile_3.mp3
        """
        )
        input_list = gr.File(
            file_count="multiple",
            label="Multiple audio files can also be imported",
        )
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
            visible=False,
        )
        opt_vocal_root = gr.Textbox(
            label="Specify the output folder for vocals:",
            value="outputs-rvc",
            visible=False,
        )
        opt_ins_root = gr.Textbox(
            label="Specify the output folder for accompaniment:",
            value="outputs-rvc",
            visible=False,
        )
        format0 = gr.Radio(
            label="Export file format",
            choices=["wav", "flac", "mp3", "m4a"],
            value="wav",
            visible=False,
        )
    with gr.Row():
        convert_button = gr.Button("Convert", variant="primary")
        open_folder_button = gr.Button(value="Open outputs folder", variant="secondary")
        open_folder_button.click(lambda: open_folder("outputs-rvc"))

    uvr_output_log = gr.Textbox(label="Output information")
    convert_button.click(
        uvr_wrapper,
        [
            model_radio,
            input_directory,
            opt_vocal_root,
            input_list,
            opt_ins_root,
            agg,
            format0,
        ],
        [uvr_output_log],
        api_name="uvr_convert",
    )


def uvr5_tab():
    with gr.TabItem("UVR5 (initial demo version)"):
        uvr5_ui()


if __name__ == "__main__":
    with gr.Blocks(
        title="TTS Generation WebUI (Bark, MusicGen + AudioGen, Tortoise, RVC)",
    ) as demo:
        uvr5_tab()
        demo.launch(
            server_port=7866,
            enable_queue=True,
        )
