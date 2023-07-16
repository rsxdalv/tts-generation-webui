from src.history_tab.save_photo import save_photo
from src.history_tab.edit_metadata_ui import edit_metadata_ui
from src.bark.get_audio_from_npz import get_audio_from_full_generation
from src.bark.npz_tools import load_npz
from src.history_tab.get_wav_files import get_npz_files_voices
from src.history_tab.main import _get_filename, _get_row_index
from src.history_tab.open_folder import open_folder
import json
import gradio as gr
import os
import shutil


def voices_tab(register_use_as_history_button, directory="voices"):
    with gr.Tab(directory.capitalize()) as voices_tab, gr.Row(equal_height=False):
        with gr.Column():
            with gr.Row():
                button_output = gr.Button(value=f"Open {directory} folder")
            button_output.click(lambda: open_folder(directory))

            datatypes = ["date", "str", "str", "str", "str"]
            headers = [
                "Date and Time",
                directory.capitalize(),
                "When",
                "Hash",
                "Filename",
            ]

            voices_list = gr.Dataframe(
                value=get_npz_files_voices(),
                interactive=False,
                datatype=datatypes,
                col_count=len(datatypes),
                max_cols=len(datatypes),
                headers=headers,
                #  elem_classes="file-list"
            )
        with gr.Column():
            audio = gr.Audio(visible=True, type="numpy", label="Fine prompt audio")
            voice_file_name = gr.Textbox(
                label="Voice file name", value="", interactive=False
            )
            new_voice_file_name = gr.Textbox(label="New voice file name", value="")

            with gr.Row():
                delete_voice_button = gr.Button(value="Delete voice", variant="stop")
                use_voice_button = gr.Button(value="Use voice", variant="primary")
                rename_voice_button = gr.Button(value="Rename voice")

            metadata = gr.JSON(label="Metadata")
            metadata_input = edit_metadata_ui(voice_file_name, metadata)

            photo = gr.Image(label="Photo", type="pil", interactive=True)

    photo.upload(
        fn=save_photo,
        inputs=[photo, voice_file_name],
        outputs=[photo],
    )

    def delete_voice(voice_file_name):
        os.remove(voice_file_name)
        return {
            delete_voice_button: gr.Button.update(value="Deleted"),
            voices_list: update_voices_tab(),
        }

    def rename_voice(voice_file_name, new_voice_file_name):
        shutil.move(voice_file_name, new_voice_file_name)
        return {
            rename_voice_button: gr.Button.update(value="Renamed"),
            voices_list: update_voices_tab(),
        }

    rename_voice_button.click(
        fn=rename_voice,
        inputs=[voice_file_name, new_voice_file_name],
        outputs=[rename_voice_button, voices_list],
    )
    register_use_as_history_button(
        use_voice_button,
        voice_file_name,
    )
    delete_voice_button.click(
        fn=delete_voice,
        inputs=[voice_file_name],
        outputs=[delete_voice_button, voices_list],
    )

    def select(_list_data, evt: gr.SelectData):
        filename_npz = _get_filename(_list_data, _get_row_index(evt))
        full_generation = load_npz(filename_npz)
        resolved_photo = filename_npz.replace(".npz", ".png")
        if not os.path.exists(resolved_photo):
            resolved_photo = None
        return {
            voice_file_name: gr.Textbox.update(value=filename_npz),
            new_voice_file_name: gr.Textbox.update(value=filename_npz),
            delete_voice_button: gr.Button.update(value="Delete"),
            rename_voice_button: gr.Button.update(value="Rename"),
            audio: gr.Audio.update(value=get_audio_from_full_generation(full_generation)),  # type: ignore
            metadata: gr.JSON.update(value=full_generation.get("metadata", {})),
            metadata_input: gr.Textbox.update(
                value=json.dumps(full_generation.get("metadata", {}), indent=2)
            ),
            photo: gr.Image.update(value=resolved_photo),
        }

    outputs = [
        voice_file_name,
        new_voice_file_name,
        delete_voice_button,
        rename_voice_button,
        audio,
        metadata,
        metadata_input,
        photo,
    ]

    voices_list.select(
        fn=select, inputs=[voices_list], outputs=outputs, preprocess=False
    )

    def update_voices_tab():
        return gr.List.update(value=get_npz_files_voices())

    voices_tab.select(fn=update_voices_tab, outputs=[voices_list])
