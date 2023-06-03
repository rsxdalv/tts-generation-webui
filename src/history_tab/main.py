import os
import gradio as gr

import json
import shutil
from src.history_tab.get_wav_files import get_npz_files_voices, get_wav_files, get_wav_files_img
from src.history_tab.delete_generation_cb import delete_generation_cb
from src.history_tab.save_to_favorites import save_to_favorites
from src.history_tab.open_folder import open_folder
from src.bark.get_audio_from_npz import get_audio_from_npz


def _get_row_index(evt: gr.SelectData):
    return evt.index[0]


def _get_filename(table, index):
    return table['data'][index][-1]


def _select_audio(table, index):
    filename = _get_filename(table, index)
    with open(filename.replace(".wav", ".json")) as f:
        json_text = json.load(f)
    return filename, json_text


def clear_audio(): return [
    gr.Audio.update(value=None),
    gr.Image.update(value=None),
    gr.JSON.update(value=None),
    gr.Button.update(visible=False),
]


def save_to_voices_cb(npz_filename: str):
    shutil.copy(npz_filename, "voices/")
    return gr.Button.update(value="Saved")


def history_tab(register_use_as_history_button, directory="outputs"):
    with gr.Tab(directory.capitalize()) as history_tab:
        with gr.Accordion("Gallery Selector (Click to Open)", open=False):
            history_list_as_gallery = gr.Gallery(
                value=get_wav_files_img(directory))
            history_list_as_gallery.style(
                columns=[8], object_fit="contain", height="auto")
        with gr.Row():
            with gr.Column():
                with gr.Row():
                    button_output = gr.Button(value=f"Open {directory} folder")
                button_output.click(lambda: open_folder(directory))

                datatypes = ["date", "str", "str", "str"]
                headers = ["Date and Time", directory.capitalize(),
                           "When", "Filename"]

                history_list = gr.Dataframe(value=get_wav_files(directory),
                                            elem_classes="file-list",
                                            type="array",
                                            interactive=False,
                                            col_count=len(datatypes),
                                            max_cols=len(datatypes),
                                            datatype=datatypes,
                                            headers=headers,
                                            )

            with gr.Column():
                history_bundle_name = gr.Markdown(visible=True)
                history_bundle_name_data = gr.State()
                history_audio = gr.Audio(
                    visible=True, type="filepath", show_label=False)
                history_image = gr.Image(show_label=False)
                history_json = gr.JSON()
                history_npz = gr.Textbox(visible=False)

                with gr.Row():
                    delete_from_history = gr.Button(
                        value="Delete", variant="stop", visible=False)
                    save_to_favorites_history = gr.Button(
                        value="Save to favorites", variant="primary", visible=False)
                    use_as_voice = gr.Button(
                        value="Use as voice", variant=directory == "favorites" and "primary" or "secondary", visible=False)
                    save_to_voices = gr.Button(
                        value="Save to voices", variant="secondary", visible=False)
                    open_folder_button = gr.Button(
                        value="Open folder", variant="secondary", visible=False)
                    open_folder_button.click(
                        open_folder, inputs=history_bundle_name_data)

                    save_to_favorites_history.click(
                        fn=save_to_favorites, inputs=history_bundle_name_data, outputs=save_to_favorites_history)

                    register_use_as_history_button(
                        use_as_voice,
                        history_npz,
                    )

                    save_to_voices.click(
                        fn=save_to_voices_cb, inputs=history_npz, outputs=save_to_voices)

        def _select_audio_history(filename, json_text):
            return {
                history_bundle_name: gr.Textbox.update(value=os.path.dirname(filename)),
                history_bundle_name_data: os.path.dirname(filename),
                history_audio: gr.Audio.update(value=filename, label=filename),
                history_image: gr.Image.update(value=filename.replace(".wav", ".png")),
                history_json: gr.JSON.update(value=json_text),
                history_npz: gr.Textbox.update(value=filename.replace(".wav", ".npz")),
                delete_from_history: gr.Button.update(visible=True),
                save_to_favorites_history: gr.Button.update(visible=directory != "favorites", value="Save to favorites"),
                use_as_voice: gr.Button.update(visible=True, value="Use as voice"),
                save_to_voices: gr.Button.update(visible=True, value="Save to voices"),
                open_folder_button: gr.Button.update(visible=True),
            }

        def select_audio_history(table, evt: gr.SelectData):
            return _select_audio_history(*_select_audio(table, _get_row_index(evt)))

        def select_audio_history2(_list, evt: gr.SelectData, table):
            return _select_audio_history(*_select_audio(table, evt.index))

        outputs = [
            history_bundle_name,
            history_bundle_name_data,
            history_audio,
            history_image,
            history_json,
            history_npz,
            delete_from_history,
            save_to_favorites_history,
            use_as_voice,
            save_to_voices,
            open_folder_button,
        ]

        history_list.select(fn=select_audio_history, inputs=[
                            history_list], outputs=outputs, preprocess=False)

        history_list_as_gallery.select(fn=select_audio_history2, inputs=[
                                       history_list_as_gallery, history_list], outputs=outputs, preprocess=False)

        def update_history_tab():
            return [
                gr.Dataframe.update(value=get_wav_files(directory)),
                gr.Gallery.update(value=get_wav_files_img(directory)),
            ]

        delete_from_history.click(fn=clear_audio, outputs=[
            history_audio, history_image, history_json, delete_from_history])
        delete_from_history.click(fn=delete_generation_cb(
            update_history_tab), inputs=history_bundle_name_data, outputs=[history_list, history_list_as_gallery])
        history_tab.select(fn=update_history_tab, outputs=[
                           history_list, history_list_as_gallery])


def voices_tab(register_use_as_history_button, directory="voices"):
    with gr.Tab(directory.capitalize()) as voices_tab, gr.Row():
        with gr.Column():
            with gr.Row():
                button_output = gr.Button(value=f"Open {directory} folder")
            button_output.click(lambda: open_folder(directory))

            datatypes = ["date", "str", "str", "str", "str"]
            headers = ["Date and Time", directory.capitalize(),
                       "When", "Hash", "Filename"]

            voices_list = gr.Dataframe(value=get_npz_files_voices(),
                                       interactive=False,
                                       datatype=datatypes,
                                       col_count=len(datatypes),
                                       max_cols=len(datatypes),
                                       headers=headers,
                                       #  elem_classes="file-list"
                                       )
        with gr.Column():
            audio = gr.Audio(visible=True, type="numpy", label="Fine prompt audio")
            voice_file_name = gr.Textbox(label="Voice file name", value="")
            new_voice_file_name = gr.Textbox(
                label="New voice file name", value="")

            with gr.Row():
                delete_voice_button = gr.Button(
                    value="Delete voice", variant="stop")
                use_voice_button = gr.Button(
                    value="Use voice", variant="primary")
                rename_voice_button = gr.Button(value="Rename voice")

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

    rename_voice_button.click(fn=rename_voice, inputs=[voice_file_name, new_voice_file_name],
                                outputs=[rename_voice_button, voices_list])
    register_use_as_history_button(
        use_voice_button,
        voice_file_name,
    )
    delete_voice_button.click(fn=delete_voice, inputs=[voice_file_name],
                                outputs=[delete_voice_button, voices_list])

    def select(_list_data, evt: gr.SelectData):
        filename_npz = _get_filename(_list_data, _get_row_index(evt))
        return {
            voice_file_name: gr.Textbox.update(value=filename_npz),
            new_voice_file_name: gr.Textbox.update(value=filename_npz),
            delete_voice_button: gr.Button.update(value="Delete"),
            rename_voice_button: gr.Button.update(value="Rename"),
            audio: gr.Audio.update(value=get_audio_from_npz(filename_npz)),
        }

    outputs = [
        voice_file_name,
        new_voice_file_name,
        delete_voice_button,
        rename_voice_button,
        audio,
    ]

    voices_list.select(fn=select, inputs=[
                        voices_list], outputs=outputs, preprocess=False)

    def update_voices_tab():
        return gr.List.update(value=get_npz_files_voices())

    voices_tab.select(fn=update_voices_tab, outputs=[voices_list])
