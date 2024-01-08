import gradio as gr
from src.history_tab.open_folder import open_folder


def gr_icon_button(value="refresh", **kwargs):
    return gr.Button(
        value=value,
        elem_classes="btn-sm material-symbols-outlined",
        size="sm",
        **kwargs,
    )


def gr_reload_button(**kwargs):
    return gr_icon_button(value="refresh", **kwargs)


def gr_open_button(**kwargs):
    return gr_icon_button(value="folder_open", **kwargs)


def gr_open_button_simple(dirname="", api_name=None, **kwargs):
    return gr_open_button(**kwargs).click(
        fn=lambda: open_folder(dirname),
        api_name=api_name,
    )
