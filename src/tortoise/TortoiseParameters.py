import gradio as gr


class TortoiseParameters:
    def __init__(
        self,
        text: str,
        voice: str = "random",
        preset: str = "ultra_fast",
        seed: int | None = None,
        cvvp_amount: float = 0.0,
        split_prompt: bool = False,
    ):
        self.text = text
        self.voice = voice
        self.preset = preset
        self.seed = seed
        self.cvvp_amount = cvvp_amount
        self.split_prompt = split_prompt

    def __repr__(self):
        params = ",\n    ".join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"TortoiseParameters(\n    {params}\n)"

    def __iter__(self):
        return iter(TortoiseParameterZipper.to_list(self))

    def to_dict(self):
        return self.__dict__

    def to_metadata(self):
        return {
            **self.__dict__,
            "seed": str(self.seed),
        }

    @staticmethod
    def from_list(components: list):
        return TortoiseParameters(
            **TortoiseParameterZipper.from_list_to_dict(components)
        )


class TortoiseParameterComponents:
    def __init__(
        self,
        text: gr.Textbox,
        voice: gr.Dropdown,
        preset: gr.Dropdown,
        seed: gr.Number,
        cvvp_amount: gr.Slider,
        split_prompt: gr.Checkbox,
    ):
        self.text = text
        self.voice = voice
        self.preset = preset
        self.seed = seed
        self.cvvp_amount = cvvp_amount
        self.split_prompt = split_prompt

    def __repr__(self):
        params = ",\n    ".join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"TortoiseParameterComponents(\n    {params}\n)"

    def __iter__(self):
        return iter(TortoiseParameterZipper.to_list(self))


class TortoiseParameterZipper:
    @staticmethod
    def to_list(components: TortoiseParameterComponents | TortoiseParameters):
        return [
            components.text,
            components.voice,
            components.preset,
            components.seed,
            components.cvvp_amount,
            components.split_prompt,
        ]

    @staticmethod
    def from_list_to_dict(components: list):
        return {
            "text": components[0],
            "voice": components[1],
            "preset": components[2],
            "seed": components[3],
            "cvvp_amount": components[4],
            "split_prompt": components[5],
        }


if __name__ == "__main__":
    with gr.Blocks() as demo:
        b = TortoiseParameterComponents(
            gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here..."),
            gr.Dropdown(
                choices=["random"],
                value="random",
                show_label=False,
            ),
            gr.Dropdown(
                show_label=False,
                choices=[
                    "ultra_fast",
                    "fast",
                    "standard",
                    "high_quality",
                ],
                value="ultra_fast",
            ),
            gr.Number(label="Seed", value=None, step=1),
            gr.Slider(
                label="CVVP Amount", value=0.0, minimum=0.0, maximum=1.0, step=0.1
            ),
            gr.Checkbox(label="Split prompt by lines", value=False),
        )

        button = gr.Button("Generate")
        button.style(margin="1rem")
        button.click(
            lambda *x: print(
                TortoiseParameters(**TortoiseParameterZipper.from_list_to_dict(list(x)))
            ),
            inputs=list(b),
        )

        demo.launch()
