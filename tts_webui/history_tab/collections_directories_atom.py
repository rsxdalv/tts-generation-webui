import os
import gradio as gr


def get_collections():
    dirs = os.listdir("collections")
    dirs.sort()

    def get_collection_path(d):
        return os.path.join("collections", d)

    return ["outputs", "favorites"] + [
        get_collection_path(d) for d in dirs if os.path.isdir(get_collection_path(d))
    ]


collections_directories_atom = gr.JSON(visible=False, value=get_collections())
