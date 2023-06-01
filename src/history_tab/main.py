import os
import gradio as gr

import glob
import json
import shutil

from src.history_tab.delete_generation_cb import delete_generation_cb
from src.history_tab.parse_time import extract_time, parse_time
from src.history_tab.save_to_favorites import save_to_favorites
from src.history_tab.open_folder import open_folder


def open_outputs_folder(): open_folder("outputs")


def open_favorites_folder(): open_folder("favorites")


def get_wav_files(directory):
    wav_files = glob.glob(f"{directory}/*.wav")
    file_date_list = [[parse_time(extract_time(file)), file]
                      for file in wav_files]
    # order by date
    file_date_list.sort(key=lambda x: x[0], reverse=True)
    return file_date_list


def get_wav_files_img(directory):
    return [file[1].replace(".wav", ".png") for file in get_wav_files(directory)]


# TODO: add hash column and date column
def get_npz_files_voices():
    npz_files = glob.glob("voices/*.npz")
    return [[file] for file in npz_files]


def select_audio(table, evt):
    index = evt.index
    index = index[0]
    return _select_audio(table, index)

def _select_audio(table, index):
    filename = table['data'][index][1]
    with open(filename.replace(".wav", ".json")) as f:
        json_text = json.load(f)
    return filename, json_text


def clear_audio(): return [
    gr.Audio.update(value=None, label=""),
    gr.Image.update(value=None),
    gr.JSON.update(value=None),
    gr.Button.update(visible=False),
]


def save_to_voices_cb(json_text):
    shutil.copy(json_text["filename_npz"], "voices/")
    return gr.Button.update(value="Saved")


def history_tab(register_use_as_history_button):
    with gr.Tab("History") as history_tab:
        directory = "outputs"
        with gr.Accordion("Gallery Selector (Click to Open)", open=False):
            history_list_as_gallery = gr.Gallery(value=get_wav_files_img(directory))
            history_list_as_gallery.style(
                columns=[8], object_fit="contain", height="auto")
        with gr.Row():
            with gr.Column():
                with gr.Row():
                    button_output = gr.Button(value="Open outputs folder")
                button_output.click(open_outputs_folder)

                history_list = gr.Dataframe(value=get_wav_files(directory),
                                            elem_classes="file-list",
                                            type="array",
                                            interactive=False,
                                            col_count=2,
                                            max_cols=2,
                                            datatype=["date", "str"],
                                            headers=[
                                                "Date and time", "History"]
                                            )

            with gr.Column():
                history_audio = gr.Audio(
                    visible=True, type="filepath", label="History")
                history_image = gr.Image()
                history_json = gr.JSON()
                history_npz = gr.Textbox(visible=False)

                with gr.Row():
                    delete_from_history = gr.Button(
                        value="Delete", variant="stop", visible=False)
                    save_to_favorites_history = gr.Button(
                        value="Save to favorites", variant="primary", visible=False)
                    use_as_voice = gr.Button(
                        value="Use as voice", variant="secondary", visible=False)
                    save_to_voices = gr.Button(
                        value="Save to voices", variant="secondary", visible=False)

                    save_to_favorites_history.click(
                        fn=save_to_favorites, inputs=history_json, outputs=save_to_favorites_history)

                    register_use_as_history_button(
                        use_as_voice,
                        history_npz,
                    )

                    save_to_voices.click(
                        fn=save_to_voices_cb, inputs=history_json, outputs=save_to_voices)

        def _select_audio_history(filename, json_text):
            return {
                history_audio: gr.Audio.update(value=filename, label=filename),
                history_image: gr.Image.update(value=filename.replace(".wav", ".png")),
                history_json: gr.JSON.update(value=json_text),
                history_npz: gr.Textbox.update(value=filename.replace(".wav", ".npz")),
                delete_from_history: gr.Button.update(visible=True),
                save_to_favorites_history: gr.Button.update(visible=True, value="Save to favorites"),
                use_as_voice: gr.Button.update(visible=True, value="Use as voice"),
                save_to_voices: gr.Button.update(visible=True, value="Save to voices"),
            }

        def select_audio_history(table, evt: gr.SelectData):
            return _select_audio_history(*select_audio(table, evt))

        outputs = [
            history_audio,
            history_image,
            history_json,
            history_npz,
            delete_from_history,
            save_to_favorites_history,
            use_as_voice,
            save_to_voices
        ]

        history_list.select(fn=select_audio_history, inputs=[history_list], outputs=outputs, preprocess=False)

        def update_history_tab():
            return [
                gr.Dataframe.update(value=get_wav_files(directory)),
                gr.Gallery.update(value=get_wav_files_img(directory)),
            ]

        delete_from_history.click(fn=clear_audio, outputs=[
            history_audio, history_image, history_json, delete_from_history])
        delete_from_history.click(fn=delete_generation_cb(
            update_history_tab), inputs=history_json, outputs=[history_list, history_list_as_gallery])
        history_tab.select(fn=update_history_tab, outputs=[history_list, history_list_as_gallery])

        def select_audio_history2(_list, evt: gr.SelectData, table):
            return _select_audio_history(*_select_audio(table, evt.index))

        history_list_as_gallery.select(fn=select_audio_history2, inputs=[history_list_as_gallery, history_list], outputs=outputs, preprocess=False)


def favorites_tab(register_use_as_history_button):
    with gr.Tab("Favorites") as favorites_tab:
        directory = "favorites"
        with gr.Accordion("Gallery Selector (Click to Open)", open=False):
            favorites_list_as_gallery = gr.Gallery(value=get_wav_files_img(directory))
            favorites_list_as_gallery.style(
                columns=[8], object_fit="contain", height="auto")
        with gr.Row():
            with gr.Column():
                with gr.Row():
                    button_output = gr.Button(value="Open favorites folder")
                button_output.click(open_favorites_folder)
                favorites_list = gr.Dataframe(value=get_wav_files(directory),
                                            elem_classes="file-list",
                                            type="array",
                                            interactive=False,
                                            col_count=2,
                                            max_cols=2,
                                            datatype=["date", "str"],
                                            headers=[
                                                "Date and time", "Favorites"]
                                            )

            with gr.Column():
                favorites_audio = gr.Audio(
                    visible=True, type="filepath", label="Favorites")
                favorites_image = gr.Image()
                favorites_json = gr.JSON()
                favorites_npz = gr.Textbox(visible=False)

                with gr.Row():
                    delete_from_favorites = gr.Button(
                        value="Delete", variant="stop", visible=False)
                    use_as_voice = gr.Button(
                        value="Use as voice", variant="primary", visible=False)
                    save_to_voices = gr.Button(
                        value="Save to voices", variant="secondary", visible=False)

                    register_use_as_history_button(
                        use_as_voice,
                        favorites_npz,
                    )

                    save_to_voices.click(
                        fn=save_to_voices_cb, inputs=favorites_json, outputs=save_to_voices)

        def _select_audio_favorites(filename, json_text):
            return {
                favorites_audio: gr.Audio.update(value=filename, label=filename),
                favorites_image: gr.Image.update(value=filename.replace(".wav", ".png")),
                favorites_json: gr.JSON.update(value=json_text),
                favorites_npz: gr.Textbox.update(value=filename.replace(".wav", ".npz")),
                delete_from_favorites: gr.Button.update(visible=True),
                use_as_voice: gr.Button.update(visible=True, value="Use as voice"),
                save_to_voices: gr.Button.update(visible=True, value="Save to voices"),
            }
        
        def select_audio_favorites(table, evt: gr.SelectData):
            return _select_audio_favorites(*select_audio(table, evt))

        outputs = [
            favorites_audio,
            favorites_image,
            favorites_json,
            favorites_npz,
            delete_from_favorites,
            use_as_voice,
            save_to_voices,
        ]

        favorites_list.select(fn=select_audio_favorites, inputs=[favorites_list], outputs=outputs, preprocess=False)

        def update_favorites_tab():
            return [
                gr.Dataframe.update(value=get_wav_files(directory)),
                gr.Gallery.update(value=get_wav_files_img(directory)),
            ]

        delete_from_favorites.click(fn=clear_audio, outputs=[
            favorites_audio, favorites_image, favorites_json, delete_from_favorites])
        delete_from_favorites.click(fn=delete_generation_cb(
            update_favorites_tab), inputs=favorites_json, outputs=[favorites_list, favorites_list_as_gallery])
        favorites_tab.select(fn=update_favorites_tab, outputs=[favorites_list, favorites_list_as_gallery])

        def select_audio_favorites2(_list, evt: gr.SelectData, table):
            return _select_audio_favorites(*_select_audio(table, evt.index))
        
        favorites_list_as_gallery.select(fn=select_audio_favorites2, inputs=[favorites_list_as_gallery, favorites_list], outputs=outputs, preprocess=False)


def open_voices_folder():
    open_folder("voices")


def voices_tab(register_use_as_history_button):
    with gr.Tab("Voices") as voices_tab, gr.Row():
        with gr.Column():
            with gr.Row():
                button_output = gr.Button(value="Open voices folder")
            button_output.click(open_voices_folder)

            voices_list = gr.List(value=get_npz_files_voices(),
                                  max_cols=1,
                                  interactive=False,
                                  datatype=["str"],
                                  headers=["Voices"],
                                  #  elem_classes="file-list"
                                  )
        with gr.Column():
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

            def select(list_data, evt: gr.SelectData):
                filename = evt.value
                return {
                    voice_file_name: gr.Textbox.update(value=filename),
                    new_voice_file_name: gr.Textbox.update(value=filename),
                }

            voices_list.select(fn=select, inputs=[voices_list], outputs=[
                voice_file_name,
                new_voice_file_name,
            ])

            def update_voices_tab():
                return gr.List.update(value=get_npz_files_voices())

            voices_tab.select(fn=update_voices_tab, outputs=[voices_list])
