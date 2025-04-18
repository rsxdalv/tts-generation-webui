import gradio as gr
from tts_webui.audiocraft.magnet.magnet_tab import magnet_tab
from tts_webui.audiocraft.musicgen.musicgen_tab import musicgen_tab


def ui():
    with gr.Tab("Audiocraft"):
        magnet_tab()
        musicgen_tab()


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()  # type: ignore
    with gr.Blocks() as demo:
        ui()

    demo.launch(
        server_port=7770,
    )
