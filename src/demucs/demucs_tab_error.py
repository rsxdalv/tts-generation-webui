import gradio as gr


def install_musicgen():
    import subprocess

    process = subprocess.Popen(
        "pip install -r requirements_audiocraft.txt",
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
        print(
            "Successfully installed MusicGen/Audiocraft/Demucs, please restart the webui"
        )
        yield "Successfully installed MusicGen/Audiocraft/Demucs, please restart the webui"
    else:
        print("Failed to install MusicGen/Audiocraft/Demucs")
        yield "Failed to install MusicGen/Audiocraft/Demucs"


def demucs_tab_error(e: Exception):
    with gr.Tab("Demucs Demo (!)"):
        gr.Markdown("Failed to load Demucs demo")
        gr.Markdown(f"Error: {e}")
        gr.Markdown("Please install the requirements_bark_hubert_quantizer.txt file")
        gr.Markdown("Please check the console for more information")
        install_btn = gr.Button("Install MusicGen")
        gr.Markdown("Installation console:")
        console_text = gr.HTML()
        install_btn.click(
            install_musicgen,
            outputs=[console_text],
        )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        demucs_tab_error(Exception("Test"))
    demo.launch()
