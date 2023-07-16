from typing import Any
from src.history_tab.open_folder import open_folder
from src.musicgen.setup_seed_ui_musicgen import setup_seed_ui_musicgen
from src.css.css import full_css
import gradio as gr
from src.tortoise.TortoiseOutputRow import TortoiseOutputRow
from src.tortoise.create_tortoise_output_row_ui import create_tortoise_output_row_ui
from src.tortoise.gen_tortoise import (
    generate_tortoise_long,
    get_model_list,
    get_voice_list,
    TORTOISE_LOCAL_MODELS_DIR,
    TORTOISE_VOICE_DIR_ABS,
    switch_model,
)
from src.tortoise.TortoiseParameters import (
    TortoiseParameterComponents,
    TortoiseParameters,
)
from src.tortoise.autoregressive_params import autoregressive_params
from src.tortoise.diffusion_params import diffusion_params
from src.tortoise.presets import presets
from src.tortoise.gr_reload_button import gr_open_button_simple, gr_reload_button

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
                gr.Markdown("Model")
                with gr.Row():
                    model = gr.Dropdown(
                        choices=get_model_list(),
                        value="Default",
                        show_label=False,
                        container=False,
                    )
                    gr_open_button_simple(TORTOISE_LOCAL_MODELS_DIR)
                    gr_reload_button().click(
                        fn=lambda: gr.Dropdown.update(choices=get_model_list()),
                        outputs=[model],
                    )

                    model.select(fn=switch_model, inputs=[model], outputs=[model])
            with gr.Box():
                gr.Markdown("Voice")
                with gr.Row():
                    voice = gr.Dropdown(
                        choices=get_voice_list(),
                        value="random",
                        show_label=False,
                        container=False,
                    )
                    gr_open_button_simple(TORTOISE_VOICE_DIR_ABS)
                    gr_reload_button().click(
                        fn=lambda: gr.Dropdown.update(choices=get_voice_list()),
                        outputs=[voice],
                    )
            with gr.Box():
                gr.Markdown("Preset")
                preset = gr.Dropdown(
                    show_label=False,
                    choices=[
                        "ultra_fast",
                        "fast",
                        "standard",
                        "high_quality",
                    ],
                    value="ultra_fast",
                    container=False,
                )

            (
                num_autoregressive_samples,
                temperature,
                length_penalty,
                repetition_penalty,
                top_p,
                max_mel_tokens,
            ) = autoregressive_params()

        with gr.Column():
            cvvp_amount = gr.Slider(
                label="CVVP Amount", value=0.0, minimum=0.0, maximum=1.0, step=0.1
            )
            with gr.Box():
                seed, _, link_seed_cache = setup_seed_ui_musicgen()

            split_prompt = gr.Checkbox(label="Split prompt by lines", value=False)

            (
                diffusion_iterations,
                cond_free,
                cond_free_k,
                diffusion_temperature,
            ) = diffusion_params()

    preset.change(
        fn=lambda x: [
            num_autoregressive_samples.update(presets[x]["num_autoregressive_samples"]),
            diffusion_iterations.update(presets[x]["diffusion_iterations"]),
            cond_free.update(
                presets[x]["cond_free"] if "cond_free" in presets[x] else True
            ),
        ],
        inputs=[preset],
        outputs=[num_autoregressive_samples, diffusion_iterations, cond_free],
    )

    text = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")

    inputs = list(
        TortoiseParameterComponents(
            text=text,
            voice=voice,
            preset=preset,
            seed=seed,
            cvvp_amount=cvvp_amount,
            split_prompt=split_prompt,
            num_autoregressive_samples=num_autoregressive_samples,
            diffusion_iterations=diffusion_iterations,
            temperature=temperature,
            length_penalty=length_penalty,
            repetition_penalty=repetition_penalty,
            top_p=top_p,
            max_mel_tokens=max_mel_tokens,
            cond_free=cond_free,
            cond_free_k=cond_free_k,
            diffusion_temperature=diffusion_temperature,
            model=model,
        )
    )

    with gr.Row():
        output_rows = [create_tortoise_output_row_ui(i) for i in range(MAX_OUTPUTS)]

    link_seed_cache(seed_cache=output_rows[0][2])

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

    def gen(*args):
        yield from generate_tortoise_long(
            get_all_outs(count),
            count,
            TortoiseParameters.from_list(list(args)),
        )

    return (
        gr.Button(text, variant=variant)
        .click(fn=lambda: show(count), outputs=output_cols)
        .then(
            fn=hide_all_save_buttons(get_all_outs(count)),
            outputs=get_output_list(count),
        )
        .then(
            fn=gen,
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
