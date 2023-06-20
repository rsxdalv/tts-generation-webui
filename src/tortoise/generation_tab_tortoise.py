from typing import Any
from src.musicgen.setup_seed_ui_musicgen import setup_seed_ui_musicgen
from models.tortoise.tortoise.utils.audio import get_voices
from src.css.css import full_css
import gradio as gr
from src.tortoise.TortoiseOutputRow import TortoiseOutputRow
from src.tortoise.create_tortoise_output_row_ui import create_tortoise_output_row_ui
from src.tortoise.gen_tortoise import generate_tortoise_long

MAX_OUTPUTS = 9


def generation_tab_tortoise():
    with gr.Tab("Tortoise TTS"):
        inputs, output_rows = tortoise_core_ui()
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


def tortoise_core_ui():
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
            with gr.Box():
                seed, _, link_seed_cache = setup_seed_ui_musicgen()

            split_prompt = gr.Checkbox(label="Split prompt by lines", value=False)

    prompt = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")

    with gr.Row():
        output_rows = [create_tortoise_output_row_ui(i) for i in range(MAX_OUTPUTS)]

    link_seed_cache(seed_cache=output_rows[0][2])

    inputs = [prompt, voice, preset, seed, cvvp_amount, split_prompt]
    return inputs, output_rows


def generate_button(text, count, variant, inputs, output_rows, total_columns):
    get_all_components = lambda count: [i for i, _, _ in output_rows[:count]]
    get_output_list = lambda count: sum(get_all_components(count), [])
    get_all_outs = lambda count: [
        TortoiseOutputRow.from_list(i) for i in get_all_components(count)
    ]
    show = lambda count: [
        gr.Column.update(visible=count > i) for i in range(total_columns)
    ]

    def hide_all_save_buttons(list_of_outs: list[TortoiseOutputRow]):
        return lambda: {
            outs.save_button: gr.Button.update(visible=False) for outs in list_of_outs
        }

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
