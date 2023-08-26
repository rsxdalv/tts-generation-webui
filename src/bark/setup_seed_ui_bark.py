import gradio as gr
from src.bark.ICON_ELEM_CLASS import ICON_ELEM_CLASS


def setup_seed_ui_bark():
    gr.Markdown("Seed")
    with gr.Row():
        seed_input = gr.Textbox(value="-1", show_label=False, container=False)
        set_random_seed_button = gr.Button(
            "backspace", elem_classes=ICON_ELEM_CLASS, size="sm"
        )

        set_random_seed_button.click(
            fn=lambda: gr.Textbox.update(value="-1"), outputs=[seed_input]
        )

        set_old_seed_button = gr.Button(
            "repeat", elem_classes=ICON_ELEM_CLASS, size="sm"
        )

    return seed_input, set_old_seed_button
