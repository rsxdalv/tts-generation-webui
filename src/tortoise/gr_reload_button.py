import gradio as gr


def gr_reload_button(**kwargs):
    return gr.Button(
        "refresh",
        elem_classes="btn-sm material-symbols-outlined",
        size="sm",
        **kwargs,
    )
