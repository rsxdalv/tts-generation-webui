import gradio as gr


class Joutai:
    def __init__(self):
        # self.tabs = gr.Tabs()
        self.remixer_input = gr.Audio(label="Input Audio")
        self.rvc_input = gr.Audio(label="Original Audio", type="filepath")
        self.demucs_input = gr.Audio(label="Input", type="filepath")
        self.vocos_input_npz = gr.File(
            label="Input NPZ", file_types=[".npz"], interactive=True
        )

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

    def send_to_vocos_npz(self, **kwargs):
        vocos_input_npz = self.vocos_input_npz
        return {
            "fn": lambda x: vocos_input_npz.update(value=x),
            "outputs": [vocos_input_npz],
            **kwargs,
        }

    def switch_to_tab(self, tab: str):
        def empty_fn():
            pass
        return {
            # "fn": lambda: gr.Tabs.update(selected=tab),
            # "outputs": self.tabs,
            "fn": empty_fn,
            "outputs": [],
        }

    singleton: "Joutai"


Joutai.singleton = Joutai()
