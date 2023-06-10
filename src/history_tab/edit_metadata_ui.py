from src.bark.npz_tools import load_npz, save_npz
import gradio as gr
import json


def edit_metadata_ui(voice_file_name, metadata_display):
    with gr.Accordion(label="Edit Metadata", open=False):
        metadata_input = gr.Textbox(label="New Metadata", value="{}", lines=20)
        save_metadata_button = gr.Button(value="Save Metadata", variant="primary")

        def save_metadata(metadata_input, voice_file_name):
            metadata = json.loads(metadata_input)
            full_generation = load_npz(voice_file_name)
            save_npz(voice_file_name, {
                "coarse_prompt": full_generation["coarse_prompt"],
                "fine_prompt": full_generation["fine_prompt"],
                "semantic_prompt": full_generation["semantic_prompt"],
            }, metadata=metadata)
            return {
                metadata_display: gr.JSON.update(value=metadata),
                save_metadata_button: gr.Button.update(value="Saved"),
            }

        save_metadata_button.click(
            fn=save_metadata,
            inputs=[metadata_input, voice_file_name],
            outputs=[metadata_display, save_metadata_button],
        )

        metadata_input.change(
            fn=lambda: save_metadata_button.update(value="Save Metadata"),
            outputs=[save_metadata_button]
        )

        return metadata_input
