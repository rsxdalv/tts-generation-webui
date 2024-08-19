from src.css.css import full_css
import gradio as gr
from src.tortoise.gen_tortoise import (
    generate_tortoise_long,
    get_voice_list,
    TORTOISE_VOICE_DIR_ABS,
)
from src.tortoise.TortoiseParameters import (
    TortoiseParameterComponents,
    TortoiseParameters,
)
from src.tortoise.autoregressive_params import autoregressive_params
from src.tortoise.diffusion_params import diffusion_params
from src.tortoise.presets import presets
from src.tortoise.gr_reload_button import gr_open_button_simple, gr_reload_button
from src.tortoise.tortoise_model_settings_ui import tortoise_model_settings_ui
from src.utils.randomize_seed import randomize_seed

MAX_OUTPUTS = 9


def generation_tab_tortoise():
    with gr.Tab("Tortoise TTS"):
        tortoise_core_ui()


def tortoise_core_ui():
    with gr.Row():
        with gr.Column():
            model = tortoise_model_settings_ui()
            with gr.Column():
                gr.Markdown("Voice")
                with gr.Row():
                    voice = gr.Dropdown(
                        choices=get_voice_list(),
                        value="random",
                        show_label=False,
                        container=False,
                    )
                    gr_open_button_simple(
                        TORTOISE_VOICE_DIR_ABS, api_name="tortoise_open_voices"
                    )
                    gr_reload_button().click(
                        fn=lambda: gr.Dropdown(choices=get_voice_list()),
                        outputs=[voice],
                        api_name="tortoise_refresh_voices",
                    )
            with gr.Column():
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
                label="CVVP Amount (Deprecated, always 0)",
                value=0.0,
                minimum=0.0,
                maximum=1.0,
                step=0.1,
                interactive=False,
            )
            with gr.Row():
                seed = gr.Textbox(label="Seed", value="-1")
                CUSTOM_randomize_seed_checkbox = gr.Checkbox(
                    label="Randomize seed", value=True
                )

            split_prompt = gr.Checkbox(label="Split prompt by lines", value=False)

            (
                diffusion_iterations,
                cond_free,
                cond_free_k,
                diffusion_temperature,
            ) = diffusion_params()

            name = gr.Textbox(label="Generation Name", placeholder="Enter name here...")

    preset.change(
        fn=lambda x: [
            gr.Slider(value=presets[x]["num_autoregressive_samples"]),
            gr.Slider(value=presets[x]["diffusion_iterations"]),
            gr.Checkbox(
                value=presets[x]["cond_free"] if "cond_free" in presets[x] else True
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
            name=name,
        )
    )

    with gr.Column():
        audio = gr.Audio(
            type="filepath", label="Generated audio", elem_classes="tts-audio"
        )
        bundle_name = gr.Textbox(
            visible=False,
        )
        params = gr.JSON(
            visible=False,
        )
        with gr.Row():
            from src.history_tab.save_to_favorites import save_to_favorites

            gr.Button("Save to favorites").click(
                fn=save_to_favorites,
                inputs=[bundle_name],
            )

    def generate_button(count):

        def gen(*args):
            yield from generate_tortoise_long(
                count,
                TortoiseParameters.from_list(list(args)),
            )

        return (
            gr.Button(
                value=f"Generate {count if count > 1 else ''}",
                variant="primary" if count == 1 else "secondary",
            )
            .click(
                fn=randomize_seed,
                inputs=[seed, CUSTOM_randomize_seed_checkbox],
                outputs=[seed],
            )
            .then(
                fn=gen,
                inputs=inputs,
                outputs=[audio, bundle_name, params],
                api_name=f"generate_tortoise_{count}",
            )
        )

    with gr.Row():
        total_columns = MAX_OUTPUTS
        for i in range(total_columns):
            generate_button(total_columns - i)


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()  # type: ignore
    with gr.Blocks(css=full_css) as demo:
        generation_tab_tortoise()

    demo.launch(
        server_port=7770,
    )
