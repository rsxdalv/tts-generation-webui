import gradio as gr


def install_rvc():
    import subprocess

    process = subprocess.Popen(
        "pip install -r requirements_rvc.txt",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
    )

    # Stream the output to the console
    for line in process.stdout:  # type: ignore
        print(line, end="")
        yield line

    # Wait for the process to finish
    process.wait()

    # Check if the process was successful
    if process.returncode == 0:
        print("Successfully installed RVC")
        yield "Successfully installed RVC, please restart the webui"
    else:
        print("Failed to install RVC")
        yield "Failed to install RVC"


def rvc_tab_error(e: Exception):
    with gr.Tab("RVC Beta Demo (!)"):
        gr.Markdown("Failed to load voice clone demo")
        gr.Markdown(f"Error: {e}")
        gr.Markdown("Please install the requirements_bark_hubert_quantizer.txt file")
        gr.Markdown("Please check the console for more information")
        install_btn = gr.Button("Install RVC")
        gr.Markdown("Installation console:")
        console_text = gr.HTML()
        install_btn.click(
            install_rvc,
            outputs=[console_text],
        )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        rvc_tab_error(Exception("Test"))
    demo.launch()
