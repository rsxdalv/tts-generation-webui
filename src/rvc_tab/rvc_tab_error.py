import gradio as gr

from src.utils.generic_error_tab_advanced import generic_error_tab_advanced


def rvc_tab_error(e: Exception, name="RVC"):
    generic_error_tab_advanced(e, name=name, requirements="-r requirements_rvc.txt")


if __name__ == "__main__":
    with gr.Blocks() as demo:
        rvc_tab_error(Exception("Test"))
    demo.launch()
