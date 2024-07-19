import gradio as gr

from src.utils.pip_install import pip_install_wrapper


def generic_error_tab(e: Exception, name="RVC", requirements="-r requirements_rvc.txt"):
    with gr.Tab(name + " (!)"):
        gr.Markdown(f"Failed to load {name} demo")
        gr.Markdown(f"Error: {e}")
        gr.Markdown(f"Please install the {requirements} file")
        gr.Markdown("Please check the console for more information")
        install_btn = gr.Button(f"Install {name}")
        gr.Markdown("Installation console:")
        console_text = gr.HTML()
        install_btn.click(
            pip_install_wrapper(requirements, name),
            outputs=[console_text],
        )


def rvc_tab_error(e: Exception, name="RVC"):
    generic_error_tab(e, name=name, requirements="-r requirements_rvc.txt")


if __name__ == "__main__":
    with gr.Blocks() as demo:
        rvc_tab_error(Exception("Test"))
    demo.launch()
