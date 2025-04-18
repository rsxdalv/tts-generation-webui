import gradio as gr
from tts_webui.vocos.vocos_tab_wav import vocos_tab_wav


def vocos_tabs():
    vocos_tab_wav()


if __name__ == "__main__":
    with gr.Blocks() as demo:
        vocos_tabs()
    demo.launch()
