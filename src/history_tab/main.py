import os
import gradio as gr

import json
import shutil
from src.history_tab.collections_directories_atom import (
    collections_directories_atom,
    get_collections,
)
from src.history_tab.get_wav_files import (
    get_wav_files,
    get_wav_files_img,
)
from src.history_tab.delete_generation_cb import delete_generation_cb
from src.history_tab.save_to_favorites import save_to_collection, save_to_favorites
from src.history_tab.open_folder import open_folder


def _get_row_index(evt: gr.SelectData):
    index: int | tuple[int, int] = evt.index
    return index[0] if isinstance(index, (list, tuple)) else index


def _get_filename(table, index):
    return table["data"][index][-1]


def _select_audio(table, evt: gr.SelectData):
    index = _get_row_index(evt)
    filename = _get_filename(table, index)
    with open(filename.replace(".wav", ".json")) as f:
        json_text = json.load(f)
    return filename, json_text


def clear_audio():
    return [
        gr.Audio.update(value=None),
        gr.Image.update(value=None),
        gr.JSON.update(value=None),
        gr.Button.update(visible=False),
    ]


def save_to_voices_cb(npz_filename: str):
    shutil.copy(npz_filename, "voices/")
    return gr.Button.update(value="Saved")


def history_tab(
    register_use_as_history_button, directory="outputs", show_collections=False
):
    with gr.Tab(
        show_collections and "Collections" or directory.capitalize()
    ) as history_tab:
        return history_content(
            register_use_as_history_button, directory, history_tab, show_collections
        )


def history_content(
    register_use_as_history_button, directory, history_tab, show_collections
):
    directories = get_collections()
    directory_dropdown = gr.Dropdown(
        value=directory,
        choices=directories,
        label="Select directory of the collection",
        visible=show_collections,
    )
    collections_directories_atom.change(
        fn=lambda x: gr.Dropdown.update(choices=x),
        inputs=[collections_directories_atom],
        outputs=[directory_dropdown],
    )

    if show_collections:
        create_collection_ui(collections_directories_atom)

    with gr.Accordion("Gallery Selector (Click to Open)", open=False):
        history_list_as_gallery = gr.Gallery(value=get_wav_files_img(directory))
        history_list_as_gallery.style(columns=8, object_fit="contain", height="auto")
    with gr.Row():
        with gr.Column():
            with gr.Row():
                button_output = gr.Button(
                    value=f"Open {show_collections and 'collection' or directory} folder"
                )
            button_output.click(lambda x: open_folder(x), inputs=[directory_dropdown])

            datatypes = ["date", "str", "str", "str"]
            # headers = ["Date and Time", directory.capitalize(), "When", "Filename"]
            headers = ["Date and Time", "Name", "When", "Filename"]

            history_list = gr.Dataframe(
                value=get_wav_files(directory),
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
            history_bundle_name_data = gr.State()  # type: ignore
            history_audio = gr.Audio(visible=True, type="filepath", show_label=False)
            history_image = gr.Image(show_label=False)
            history_json = gr.JSON()
            history_npz = gr.Textbox(visible=False)

            with gr.Row():
                delete_from_history = gr.Button(
                    value="Delete", variant="stop", visible=False
                )
                save_to_favorites_history = gr.Button(
                    value="Save to favorites", variant="primary", visible=False
                )
                use_as_voice = gr.Button(
                    value="Use as voice",
                    variant=directory == "favorites" and "primary" or "secondary",
                    visible=False,
                )
                save_to_voices = gr.Button(
                    value="Save to voices", variant="secondary", visible=False
                )
                open_folder_button = gr.Button(
                    value="Open folder", variant="secondary", visible=False
                )
                open_folder_button.click(open_folder, inputs=history_bundle_name_data)

                save_to_favorites_history.click(
                    fn=save_to_favorites,
                    inputs=history_bundle_name_data,
                    outputs=save_to_favorites_history,
                )

                register_use_as_history_button(
                    use_as_voice,
                    history_npz,
                )

                save_to_voices.click(
                    fn=save_to_voices_cb, inputs=history_npz, outputs=save_to_voices
                )

            save_to_collection_ui(
                directory,
                directories,
                history_bundle_name_data,
                collections_directories_atom,
            )

    def _select_audio_history(filename, json_text):
        return {
            history_bundle_name: gr.Textbox.update(value=os.path.dirname(filename)),
            history_bundle_name_data: os.path.dirname(filename),
            history_audio: gr.Audio.update(value=filename, label=filename),
            history_image: gr.Image.update(value=filename.replace(".wav", ".png")),
            history_json: gr.JSON.update(value=json_text),
            history_npz: gr.Textbox.update(value=filename.replace(".wav", ".npz")),
            delete_from_history: gr.Button.update(visible=True),
            save_to_favorites_history: gr.Button.update(
                visible=directory != "favorites", value="Save to favorites"
            ),
            use_as_voice: gr.Button.update(visible=True, value="Use as voice"),
            save_to_voices: gr.Button.update(visible=True, value="Save to voices"),
            open_folder_button: gr.Button.update(visible=True),
        }

    def select_audio_history(table, evt: gr.SelectData):
        return _select_audio_history(*_select_audio(table, evt))

    def select_audio_history2(_list, evt: gr.SelectData, table):
        return _select_audio_history(*_select_audio(table, evt))

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

    history_list.select(
        fn=select_audio_history,
        inputs=[history_list],
        outputs=outputs,
        preprocess=False,
    )

    history_list_as_gallery.select(
        fn=select_audio_history2,
        inputs=[history_list_as_gallery, history_list],
        outputs=outputs,
        preprocess=False,
    )

    def update_history_tab(directory):
        return [
            gr.Dataframe.update(value=get_wav_files(directory)),
            gr.Gallery.update(value=get_wav_files_img(directory)),
        ]

    delete_from_history.click(
        fn=clear_audio,
        outputs=[history_audio, history_image, history_json, delete_from_history],
    )
    delete_from_history.click(
        fn=delete_generation_cb(update_history_tab),
        inputs=[history_bundle_name_data, directory_dropdown],
        outputs=[history_list, history_list_as_gallery],
    )
    history_tab.select(
        fn=update_history_tab,
        inputs=[directory_dropdown],
        outputs=[history_list, history_list_as_gallery],
    )

    directory_dropdown.change(
        fn=update_history_tab,
        inputs=[directory_dropdown],
        outputs=[history_list, history_list_as_gallery],
    )


def save_to_collection_ui(
    directory: str,
    directories: list[str],
    history_bundle_name_data: gr.State,
    directories_state: gr.JSON,
):
    with gr.Row():
        move_to_collection = gr.Dropdown(
            label="Save to collection",
            choices=directories,
            value=directory,
        )

    move_to_collection.select(
        fn=save_to_collection,
        inputs=[history_bundle_name_data, move_to_collection],
        outputs=[move_to_collection],
    )

    directories_state.change(
        fn=lambda x: gr.Dropdown.update(choices=x),
        inputs=[directories_state],
        outputs=[move_to_collection],
    )


def create_collection_ui(directories_state):
    new_collection_name = gr.Textbox(label="New collection name", value="")

    def create_collection(new_collection_name):
        os.makedirs(os.path.join("collections", new_collection_name))
        return [
            get_collections(),
            gr.Button.update(value="Created"),
        ]

    create_collection_button = gr.Button(value="Create collection")

    new_collection_name.change(
        fn=lambda: gr.Button.update(value="Create collection"),
        outputs=[create_collection_button],
    )
    create_collection_button.click(
        fn=create_collection,
        inputs=[new_collection_name],
        outputs=[directories_state, create_collection_button],
    )
