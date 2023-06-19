from typing import Any

import numpy as np
import torch
import torchaudio
from src.bark.split_text_functions import split_by_lines
from src.history_tab.save_to_favorites import save_to_favorites
from src.musicgen.setup_seed_ui_musicgen import setup_seed_ui_musicgen
from src.tortoise.gen_tortoise import generate_tortoise
from models.tortoise.tortoise.utils.audio import get_voices
from src.css.css import full_css
import gradio as gr

MAX_OUTPUTS = 9


class TortoiseOutputRow:
    def __init__(self, audio, image, save_button, seed, bundle_name):
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


def create_components(index):
    with gr.Column(visible=index == 0) as col:
        audio = gr.Audio(
            type="filepath", label="Generated audio", elem_classes="tts-audio"
        )
        image = gr.Image(label="Waveform", shape=(None, 100), elem_classes="tts-image")  # type: ignore
        with gr.Row():
            save_button = gr.Button("Save to favorites", visible=False)
        seed = gr.State()  # type: ignore
        bundle_name = gr.State()  # type: ignore

        save_button.click(
            fn=save_to_favorites,
            inputs=[bundle_name],
            outputs=[save_button],
        )

        return (
            TortoiseOutputRow(audio, image, save_button, seed, bundle_name).to_list(),
            col,
            seed,
        )


def generate_tortoise_long(outs: list[TortoiseOutputRow], count: int):
    def gen(
        prompt_raw,
        voice="random",
        preset="ultra_fast",
        seed=None,
        cvvp_amount=0.0,
        split_prompt=False,
    ):
        prompts = split_by_lines(prompt_raw) if split_prompt else [prompt_raw]
        audio_pieces = [[] for _ in range(count)]

        for i, prompt in enumerate(prompts):
            datas = generate_tortoise(
                text=prompt,
                voice=voice,
                preset=preset,
                seed=seed,
                cvvp_amount=cvvp_amount,
                candidates=count,
            )
            for i in range(count):
                yield {
                    outs[i].audio: datas[5 * i],
                    outs[i].image: datas[5 * i + 1],
                    outs[i].save_button: gr.Button.update(visible=True),
                    outs[i].seed: datas[5 * i + 3],
                    outs[i].bundle_name: datas[5 * i + 4],
                }
            # accumulate audio filenames
            for i in range(count):
                audio_filename = datas[5 * i]
                audio_tensor, _ = torchaudio.load(audio_filename)
                audio_array = audio_tensor.t().numpy()
                audio_pieces[i].append(audio_array)

        # if there is only one prompt, then we don't need to concatenate
        if len(prompts) == 1:
            return {}

        # concatenate audio pieces
        def concat_and_save_pieces(audio_pieces):
            for i in range(count):
                audio_pieces[i] = np.concatenate(audio_pieces[i])
                audio_tensor = torch.from_numpy(audio_pieces[i]).t()
                # TEMP - before long generations are supported
                audio_filename = datas[5 * i] + "_long.wav"
                torchaudio.save(audio_filename, audio_tensor, 22050)
                yield audio_filename

        # get audio filenames
        audio_filenames = list(concat_and_save_pieces(audio_pieces))
        yield {outs[i].audio: audio_filenames[i] for i in range(count)}
        return {}

    return gen


def generation_tab_tortoise():
    with gr.Tab("Tortoise TTS"):
        inputs, output_rows = tortoise_ui()
        total_columns = len(output_rows)

        with gr.Row():
            for i in range(total_columns):
                target_count = total_columns - i
                generate_button(
                    text=f"Generate {target_count if target_count > 1 else ''}",
                    count=target_count,
                    variant="primary" if target_count == 1 else "secondary",
                    inputs=inputs,
                    output_rows=output_rows,
                    total_columns=total_columns,
                )


def tortoise_ui():
    with gr.Row():
        with gr.Column():
            with gr.Box():
                gr.Markdown("Voice")
                with gr.Row():
                    voice = gr.Dropdown(
                        choices=["random"] + list(get_voices()),
                        value="random",
                        show_label=False,
                    )
                    voice.style(container=False)
                    reload_voices = gr.Button(
                        "refresh",
                        elem_classes="btn-sm material-symbols-outlined",
                    )
                    reload_voices.style(size="sm")

                    def reload_voices_fn():
                        choices = ["random"] + list(get_voices())
                        return [
                            gr.Dropdown.update(choices=choices),
                        ]

                    reload_voices.click(fn=reload_voices_fn, outputs=[voice])
            preset = gr.Dropdown(
                label="Preset",
                choices=[
                    "ultra_fast",
                    "fast",
                    "standard",
                    "high_quality",
                ],
                value="ultra_fast",
            )
        with gr.Column():
            cvvp_amount = gr.Slider(
                label="CVVP Amount", value=0.0, minimum=0.0, maximum=1.0, step=0.1
            )
            seed, _, link_seed_cache = setup_seed_ui_musicgen()

            split_prompt = gr.Checkbox(label="Split prompt by lines", value=False)

    prompt = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")

    with gr.Row():
        output_rows = [create_components(i) for i in range(MAX_OUTPUTS)]

    link_seed_cache(seed_cache=output_rows[0][2])

    inputs = [prompt, voice, preset, seed, cvvp_amount, split_prompt]
    return inputs, output_rows


def generate_button(text, count, variant, inputs, output_rows, total_columns):
    def get_all_components(count):
        return [i for i, _, _ in output_rows[:count]]

    def get_output_list(count):
        return sum(get_all_components(count), [])

    def get_all_outs(count):
        return [TortoiseOutputRow.from_list(i) for i in get_all_components(count)]

    def hide_all_save_buttons(list_of_outs: list[TortoiseOutputRow]):
        return lambda: {
            outs.save_button: gr.Button.update(visible=False) for outs in list_of_outs
        }

    def show(count):
        return [gr.Column.update(visible=count > i) for i in range(total_columns)]

    output_cols: list[Any] = [col for _, col, _ in output_rows]
    return (
        gr.Button(text, variant=variant)
        .click(fn=lambda: show(count), outputs=output_cols)
        .then(
            fn=hide_all_save_buttons(get_all_outs(count)),
            outputs=get_output_list(count),
        )
        .then(
            fn=generate_tortoise_long(
                get_all_outs(count),
                count,
            ),
            inputs=inputs,
            outputs=get_output_list(count),
        )
    )


if __name__ == "__main__":
    with gr.Blocks(css=full_css) as demo:
        generation_tab_tortoise()

    demo.launch(
        enable_queue=True,
    )
