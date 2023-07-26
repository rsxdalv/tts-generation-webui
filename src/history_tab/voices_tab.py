from src.bark.history_to_hash import history_to_hash
from src.history_tab.save_photo import save_photo
from src.history_tab.edit_metadata_ui import edit_metadata_ui
from src.bark.get_audio_from_npz import get_audio_from_full_generation
from src.bark.npz_tools import load_npz, save_npz
from src.history_tab.get_wav_files import get_npz_files_voices
from src.history_tab.main import _get_filename, _get_row_index
from src.history_tab.open_folder import open_folder
import json
import gradio as gr
import os
import shutil
from bark.generation import COARSE_RATE_HZ, SEMANTIC_RATE_HZ, N_COARSE_CODEBOOKS
from src.tortoise.gr_reload_button import gr_reload_button


def update_voices_tab():
    return gr.List.update(value=get_npz_files_voices())


def voices_tab(register_use_as_history_button, directory="voices"):
    with gr.Tab(directory.capitalize()) as voices_tab, gr.Row(equal_height=False):
        with gr.Column():
            with gr.Accordion("Gallery Selector (Click to Open)", open=False):
                history_list_as_gallery = gr.Gallery(
                    value=[
                        f"voices/{x}"
                        for x in os.listdir("voices")
                        if x.endswith(".png")
                    ],
                    columns=4,
                    object_fit="contain",
                    height="auto",
                )
            with gr.Row():
                button_output = gr.Button(value=f"Open {directory} folder")

                reload_button = gr_reload_button()
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
            voice_hash = gr.Textbox(label="Hash", value="", interactive=False)
            crop_voice_button = gr.Button(value="Crop voice")
            voice_file_name = gr.Textbox(
                label="Voice file name", value="", interactive=False
            )
            new_voice_file_name = gr.Textbox(label="New voice file name", value="")

            with gr.Row():
                rename_voice_button = gr.Button(value="Rename voice")
                delete_voice_button = gr.Button(value="Delete voice", variant="stop")
                use_voice_button = gr.Button(value="Use voice", variant="primary")

            metadata = gr.JSON(label="Metadata")
            metadata_input = edit_metadata_ui(voice_file_name, metadata)

            photo = gr.Image(label="Photo", type="pil", interactive=True)
            file_list = gr.Files(value=[], label="Files", interactive=False)

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

    def rename_voice(voice_file_name_in, new_voice_file_name):
        shutil.move(voice_file_name_in, new_voice_file_name)
        png_file = voice_file_name_in.replace(".npz", ".png")
        if os.path.exists(png_file):
            shutil.move(png_file, new_voice_file_name.replace(".npz", ".png"))
        return {
            rename_voice_button: gr.Button.update(value="Renamed"),
            voices_list: update_voices_tab(),
            voice_file_name: gr.Textbox.update(value=new_voice_file_name),
        }

    def crop_voice(voice_file_name, audio_in):
        crop_min, crop_max = audio_in.get("crop_min", 0), audio_in.get("crop_max", 100)

        full_generation = load_npz(voice_file_name)

        semantic_prompt = full_generation["semantic_prompt"]
        len_semantic_prompt = len(semantic_prompt)
        semantic_prompt = semantic_prompt[
            len_semantic_prompt
            * crop_min
            // 100 : len_semantic_prompt
            * crop_max
            // 100
        ]

        coarse_prompt = full_generation["coarse_prompt"]
        len_coarse_prompt = coarse_prompt.shape[-1]

        coarse_prompt = coarse_prompt[
            :, len_coarse_prompt * crop_min // 100 : len_coarse_prompt * crop_max // 100
        ]
        fine_prompt = full_generation["fine_prompt"]
        len_fine_prompt = fine_prompt.shape[-1]
        fine_prompt = fine_prompt[
            :, len_fine_prompt * crop_min // 100 : len_fine_prompt * crop_max // 100
        ]

        semantic_to_coarse_ratio = (
            COARSE_RATE_HZ / SEMANTIC_RATE_HZ * N_COARSE_CODEBOOKS
        )

        assert round(coarse_prompt.shape[-1] / len(semantic_prompt), 1) == round(
            semantic_to_coarse_ratio / N_COARSE_CODEBOOKS, 1
        )

        voice_file_name_cropped = voice_file_name.replace(
            ".npz", f"_cropped_{crop_min}_{crop_max}.npz"
        )

        new_hash = history_to_hash(full_generation)  # type: ignore
        new_meta = full_generation.get("metadata", {})
        new_meta["crop_min"] = crop_min
        new_meta["crop_max"] = crop_max
        new_meta["hash"] = new_hash

        save_npz(
            voice_file_name_cropped,
            {
                "semantic_prompt": semantic_prompt,
                "coarse_prompt": coarse_prompt,
                "fine_prompt": fine_prompt,
            },
            metadata=new_meta,
        )

        return select_filename(voice_file_name_cropped)

    rename_voice_button.click(
        fn=rename_voice,
        inputs=[voice_file_name, new_voice_file_name],
        outputs=[rename_voice_button, voices_list, voice_file_name],
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

    def select_filename(filename_npz):
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
            voice_hash: gr.Textbox.update(value=history_to_hash(full_generation)),  # type: ignore
            file_list: gr.Files.update(
                value=get_file_list(filename_npz, resolved_photo),
                label="Files",
            ),
        }

    def get_file_list(filename_npz, resolved_photo):
        if resolved_photo is None:
            return [filename_npz]

        return [filename_npz, resolved_photo]

    def select(_list_data, evt: gr.SelectData):
        filename_npz = _get_filename(_list_data, _get_row_index(evt))
        return select_filename(filename_npz)

    outputs = [
        voice_file_name,
        new_voice_file_name,
        delete_voice_button,
        rename_voice_button,
        audio,
        metadata,
        metadata_input,
        photo,
        voice_hash,
        file_list,
    ]

    crop_voice_button.click(
        fn=crop_voice,
        inputs=[voice_file_name, audio],
        outputs=outputs,
        preprocess=False,
    ).then(
        fn=update_voices_tab,
        outputs=[voices_list],
    )

    reload_button.click(fn=update_voices_tab, outputs=[voices_list])

    voices_list.select(
        fn=select, inputs=[voices_list], outputs=outputs, preprocess=False
    )

    def select_gallery(_list_data, evt: gr.SelectData):
        def get_gallery_file_selection(_gallery_data, evt: gr.SelectData):
            selected_image = _gallery_data[evt.index]
            image_path = selected_image['name']
            import os
            image_name = os.path.basename(image_path)
            return image_name.replace('.png', '')
        
        filename_base = get_gallery_file_selection(_list_data, evt)
        return select_filename(f'voices/{filename_base}.npz')

    history_list_as_gallery.select(
        fn=select_gallery, inputs=[history_list_as_gallery], outputs=outputs
    )

    voices_tab.select(fn=update_voices_tab, outputs=[voices_list])
