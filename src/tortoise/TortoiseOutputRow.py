import gradio as gr


class TortoiseOutputRow:
    def __init__(
        self,
        audio: gr.Audio,
        image: gr.Image,
        save_button: gr.Button,
        seed: gr.State,
        bundle_name: gr.State,
    ):
        self.audio: gr.Audio = audio
        self.image: gr.Image = image
        self.save_button: gr.Button = save_button
        self.seed: gr.State = seed
        self.bundle_name: gr.State = bundle_name

    def to_list(self):
        return [
            self.audio,
            self.image,
            self.save_button,
            self.seed,
            self.bundle_name,
        ]

    @staticmethod
    def from_list(components):
        return TortoiseOutputRow(
            audio=components[0],
            image=components[1],
            save_button=components[2],
            seed=components[3],
            bundle_name=components[4],
        )

    # def __iter__(self):
    #     return iter(self.to_list())


class TortoiseOutputUpdate:
    def __init__(
        self,
        audio,
        image,
        save_button,
        seed,
        bundle_name,
    ):
        self.audio = audio
        self.image = image
        self.save_button = save_button
        self.seed = seed
        self.bundle_name = bundle_name
