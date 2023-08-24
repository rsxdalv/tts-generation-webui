import gradio as gr
from typing import Type


class Joutai:
    def __init__(self):
        self.tabs = gr.Tabs()
        self.remixer_input = gr.Audio(label="Input Audio")
        self.rvc_input = gr.Audio(label="Original Audio", type="filepath")
        self.demucs_input = gr.Audio(label="Input", type="filepath")

    def send_to_remixer(self, **kwargs):
        remixer_input = self.remixer_input
        return {
            "fn": lambda x: remixer_input.update(value=x),
            "outputs": [remixer_input],
            **kwargs,
        }

    def sent_to_rvc(self, **kwargs):
        rvc_input = self.rvc_input
        return {
            "fn": lambda x: rvc_input.update(value=x),
            "outputs": [rvc_input],
            **kwargs,
        }

    def send_to_demucs(self, **kwargs):
        demucs_input = self.demucs_input
        return {
            "fn": lambda x: demucs_input.update(value=x),
            "outputs": [demucs_input],
            **kwargs,
        }

    def switch_to_tab(self, tab: str):
        return {
            "fn": lambda: gr.Tabs.update(selected=tab),
            "outputs": self.tabs,
        }

    singleton: "Joutai"


Joutai.singleton = Joutai()
