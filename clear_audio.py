import gradio as gr


def clear_audio(): return [
    gr.Audio.update(value=None, label=""),
    gr.Image.update(value=None),
    gr.JSON.update(value=None),
    gr.Button.update(visible=False),
]
