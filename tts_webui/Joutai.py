import gradio as gr


class Joutai:
    def __init__(self):
        self.a = 1

    def switch_to_tab(self, tab: str):
        def empty_fn():
            pass

        return {
            "fn": empty_fn,
            "outputs": [],
        }

    singleton: "Joutai"


Joutai.singleton = Joutai()
