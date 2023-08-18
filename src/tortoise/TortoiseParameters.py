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
        num_autoregressive_samples: int = 16,
        diffusion_iterations: int = 16,
        temperature: float = 0.8,
        length_penalty: float = 1.0,
        repetition_penalty: float = 2.0,
        top_p: float = 0.8,
        max_mel_tokens: int = 500,
        cond_free: bool = True,
        cond_free_k: int = 2,
        diffusion_temperature: float = 1.0,
        model: str = "Default",
        name: str = "",
    ):  # sourcery skip: remove-unnecessary-cast
        self.text = text
        self.voice = voice
        self.preset = preset
        self.seed = seed
        self.cvvp_amount = float(cvvp_amount)
        self.split_prompt = split_prompt
        self.num_autoregressive_samples = num_autoregressive_samples
        self.diffusion_iterations = diffusion_iterations
        self.temperature = float(temperature)
        self.length_penalty = float(length_penalty)
        self.repetition_penalty = float(repetition_penalty)
        self.top_p = float(top_p)
        self.max_mel_tokens = max_mel_tokens
        self.cond_free = cond_free
        self.cond_free_k = cond_free_k
        self.diffusion_temperature = float(diffusion_temperature)
        self.model = model
        self.name = name

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
        num_autoregressive_samples: gr.Slider,
        diffusion_iterations: gr.Slider,
        temperature: gr.Slider,
        length_penalty: gr.Slider,
        repetition_penalty: gr.Slider,
        top_p: gr.Slider,
        max_mel_tokens: gr.Slider,
        cond_free: gr.Checkbox,
        cond_free_k: gr.Slider,
        diffusion_temperature: gr.Slider,
        model: gr.Dropdown,
        name: gr.Textbox,
    ):
        self.text = text
        self.voice = voice
        self.preset = preset
        self.seed = seed
        self.cvvp_amount = cvvp_amount
        self.split_prompt = split_prompt
        self.num_autoregressive_samples = num_autoregressive_samples
        self.diffusion_iterations = diffusion_iterations
        self.temperature = temperature
        self.length_penalty = length_penalty
        self.repetition_penalty = repetition_penalty
        self.top_p = top_p
        self.max_mel_tokens = max_mel_tokens
        self.cond_free = cond_free
        self.cond_free_k = cond_free_k
        self.diffusion_temperature = diffusion_temperature
        self.model = model
        self.name = name

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
            components.num_autoregressive_samples,
            components.diffusion_iterations,
            components.temperature,
            components.length_penalty,
            components.repetition_penalty,
            components.top_p,
            components.max_mel_tokens,
            components.cond_free,
            components.cond_free_k,
            components.diffusion_temperature,
            components.model,
            components.name,
        ]

    @staticmethod
    def from_list_to_dict(components: list):
        def next_idx():
            next_idx.idx += 1
            return next_idx.idx - 1

        next_idx.idx = 0
        return {
            "text": components[next_idx()],
            "voice": components[next_idx()],
            "preset": components[next_idx()],
            "seed": components[next_idx()],
            "cvvp_amount": components[next_idx()],
            "split_prompt": components[next_idx()],
            "num_autoregressive_samples": components[next_idx()],
            "diffusion_iterations": components[next_idx()],
            "temperature": components[next_idx()],
            "length_penalty": components[next_idx()],
            "repetition_penalty": components[next_idx()],
            "top_p": components[next_idx()],
            "max_mel_tokens": components[next_idx()],
            "cond_free": components[next_idx()],
            "cond_free_k": components[next_idx()],
            "diffusion_temperature": components[next_idx()],
            "model": components[next_idx()],
            "name": components[next_idx()],
        }


if __name__ == "__main__":
    with gr.Blocks() as demo:
        b = TortoiseParameterComponents(
            text=gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here..."),
            voice=gr.Dropdown(
                show_label=False,
                choices=["random"],
                value="random",
            ),
            preset=gr.Dropdown(
                show_label=False,
                choices=[
                    "ultra_fast",
                    "fast",
                    "standard",
                    "high_quality",
                ],
                value="ultra_fast",
            ),
            seed=gr.Number(label="Seed", value=None, step=1),
            cvvp_amount=gr.Slider(
                label="CVVP Amount", value=0.0, minimum=0.0, maximum=1.0, step=0.1
            ),
            split_prompt=gr.Checkbox(label="Split prompt by lines", value=False),
            num_autoregressive_samples=gr.Slider(
                label="Num Autoregressive Samples",
                value=16,
                minimum=1,
                maximum=256,
                step=1,
            ),
            diffusion_iterations=gr.Slider(
                label="Diffusion Iterations", value=30, minimum=1, maximum=400, step=1
            ),
            temperature=gr.Slider(
                label="Autoregressive Temperature",
                value=0.8,
                minimum=0.0,
                maximum=1.0,
                step=0.1,
            ),
            length_penalty=gr.Slider(
                label="Autoregressive Length Penalty",
                value=1.0,
                minimum=0.0,
                maximum=10.0,
                step=0.1,
            ),
            repetition_penalty=gr.Slider(
                label="Autoregressive Repetition Penalty",
                value=2.0,
                minimum=0.0,
                maximum=10.0,
                step=0.1,
            ),
            top_p=gr.Slider(
                label="Autoregressive Top P",
                value=0.8,
                minimum=0.0,
                maximum=1.0,
                step=0.1,
            ),
            max_mel_tokens=gr.Slider(
                label="Autoregressive Max Mel Tokens",
                value=500,
                minimum=0,
                maximum=600,
                step=1,
            ),
            cond_free=gr.Checkbox(label="Diffusion Cond Free", value=True),
            cond_free_k=gr.Slider(
                label="Diffusion Cond Free K", value=2, minimum=0, maximum=10, step=1
            ),
            diffusion_temperature=gr.Slider(
                label="Diffusion Temperature",
                value=1.0,
                minimum=0.0,
                maximum=1.0,
                step=0.1,
            ),
            model=gr.Dropdown(
                show_label=False,
                choices=["Default"],
                value="Default",
            ),
            name=gr.Textbox(
                label="Name",
                placeholder="Enter name here...",
            ),
        )

        button = gr.Button("Generate")
        button.click(
            lambda *x: print(
                TortoiseParameters(**TortoiseParameterZipper.from_list_to_dict(list(x)))
            ),
            inputs=list(b),
        )

        demo.launch()
