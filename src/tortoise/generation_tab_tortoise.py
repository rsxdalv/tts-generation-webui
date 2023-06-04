from src.tortoise.gen_tortoise import generate_tortoise_n
from models.tortoise.tortoise.utils.audio import get_voices

import gradio as gr


def generation_tab_tortoise():
    with gr.Tab("Generation (Tortoise)"):
        prompt = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")

        with gr.Row():
            # with gr.Box():
            # gr.Markdown("### Voice")
            with gr.Row():
                voice = gr.Dropdown(
                    choices=["random"] + list(get_voices()),
                    value="random",
                    # show_label=False,
                    label="Voice",
                )
                # voice.style(container=False)
                # reload_voices = gr.Button("🔁", elem_classes="btn-sm")
                # reload_voices.style(size="sm")
                # def reload_voices_fn():
                #     choices =
                #     print(choices)
                #     return [
                #         gr.Dropdown.update(choices=choices),
                #     ]
                # reload_voices.click(fn=reload_voices_fn, outputs=[voice])
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
        # Args:
        # seed (int): The desired seed. Value must be within the inclusive range
        #     `[-0x8000_0000_0000_0000, 0xffff_ffff_ffff_ffff]`. Otherwise, a RuntimeError
        #     is raised. Negative inputs are remapped to positive values with the formula
        #     `0xffff_ffff_ffff_ffff + seed`.
        seed = gr.Textbox(
            label="Seed",
            lines=1,
            placeholder="Enter seed here...",
            value="None",
            visible=False,
        )
        cvvp_amount = gr.Slider(
            label="CVVP Amount", value=0.0, minimum=0.0, maximum=1.0, step=0.1
        )

        inputs = [prompt, voice, preset, seed, cvvp_amount]

        with gr.Row():
            audio_1 = gr.Audio(type="filepath", label="Generated audio")
            audio_2 = gr.Audio(type="filepath", label="Generated audio", visible=False)
            audio_3 = gr.Audio(type="filepath", label="Generated audio", visible=False)

        with gr.Row():
            image_1 = gr.Image(label="Waveform")
            image_2 = gr.Image(label="Waveform", visible=False)
            image_3 = gr.Image(label="Waveform", visible=False)

        outputs = [audio_1, image_1]
        outputs2 = [audio_2, image_2]
        outputs3 = [audio_3, image_3]

        with gr.Row():
            generate3_button = gr.Button("Generate 3")
            generate2_button = gr.Button("Generate 2")
            generate1_button = gr.Button("Generate", variant="primary")

        prompt.submit(fn=generate_tortoise_n(1), inputs=inputs, outputs=outputs)
        generate1_button.click(
            fn=generate_tortoise_n(1), inputs=inputs, outputs=outputs
        )
        generate2_button.click(
            fn=generate_tortoise_n(2), inputs=inputs, outputs=outputs + outputs2
        )
        generate3_button.click(
            fn=generate_tortoise_n(3),
            inputs=inputs,
            outputs=outputs + outputs2 + outputs3,
        )

        def show_closure(count):
            def show():
                return [
                    gr.Audio.update(visible=True),
                    gr.Image.update(visible=True),
                    gr.Audio.update(visible=count > 1),
                    gr.Image.update(visible=count > 1),
                    gr.Audio.update(visible=count > 2),
                    gr.Image.update(visible=count > 2),
                ]

            return show

        generate1_button.click(
            fn=show_closure(1), outputs=outputs + outputs2 + outputs3
        )
        generate2_button.click(
            fn=show_closure(2), outputs=outputs + outputs2 + outputs3
        )
        generate3_button.click(
            fn=show_closure(3), outputs=outputs + outputs2 + outputs3
        )


css_tortoise = """
.btn-sm {
    min-width: 2em !important;
    flex-grow: 0 !important;
}
"""
