from src.history_tab.save_to_favorites import save_to_favorites
from src.tortoise.TortoiseOutputRow import TortoiseOutputRow


import gradio as gr


def create_tortoise_output_row_ui(index):
    with gr.Column(visible=index == 0) as col:
        audio = gr.Audio(
            type="filepath", label="Generated audio", elem_classes="tts-audio"
        )
        image = gr.Image(label="Waveform", shape=(None, 100), elem_classes="tts-image")  # type: ignore
        with gr.Row():
            save_button = gr.Button("Save to favorites", visible=False)
        seed = gr.Textbox(
            visible=False,
        )
        bundle_name = gr.Textbox(
            visible=False,
        )
        params = gr.JSON(
            visible=False,
        )

        save_button.click(
            fn=save_to_favorites,
            inputs=[bundle_name],
            outputs=[save_button],
        )

        return (
            TortoiseOutputRow(audio, image, save_button, seed, bundle_name, params).to_list(),
            col,
            seed,
        )
