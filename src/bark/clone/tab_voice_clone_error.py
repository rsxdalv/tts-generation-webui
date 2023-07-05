import gradio as gr


def install_bark_voice_clone():
    import subprocess

    # install requirements_bark_hubert_quantizer.txt
    process = subprocess.Popen(
        "pip install -r requirements_bark_hubert_quantizer.txt",
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
        print("Successfully installed bark voice clone")
        yield "Successfully installed bark voice clone, please restart the webui"
        return
    else:
        print("Failed to install bark voice clone")
        yield "Failed to install bark voice clone"
        return


def tab_voice_clone_error(e: Exception):
    with gr.Tab("Bark Voice Clone (!)"):
        gr.Markdown("Failed to load voice clone demo")
        gr.Markdown(f"Error: {e}")
        gr.Markdown("Please install the requirements_bark_hubert_quantizer.txt file")
        gr.Markdown("Please check the console for more information")
        install_btn = gr.Button("install bark voice clone")
        gr.Markdown("Installation console:")
        console_text = gr.HTML()
        install_btn.click(
            install_bark_voice_clone,
            outputs=[console_text],
        )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        tab_voice_clone_error(Exception("Test"))
    demo.launch()
