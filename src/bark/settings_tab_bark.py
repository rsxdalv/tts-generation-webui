import os
import gradio as gr
from typing import Callable

from src.utils.setup_or_recover import generate_env


def settings_tab_bark(config: dict, save_config: Callable, load_models: Callable) -> None:
    with gr.Tab("Settings (Bark)") as settings_tab:
        with gr.Row():
            with gr.Column():
                load_models_on_startup = gr.Checkbox(
                    label="Load Bark models on startup", value=config["load_models_on_startup"])

                text_use_gpu = gr.Checkbox(
                    label="Use GPU for text generation", value=config["model"]["text_use_gpu"])
                text_use_small = gr.Checkbox(
                    label="Use small model for text generation", value=config["model"]["text_use_small"])
                coarse_use_gpu = gr.Checkbox(
                    label="Use GPU for coarse-to-fine inference", value=config["model"]["coarse_use_gpu"])
                coarse_use_small = gr.Checkbox(
                    label="Use small model for coarse-to-fine inference", value=config["model"]["coarse_use_small"])
                fine_use_gpu = gr.Checkbox(
                    label="Use GPU for fine-tuning", value=config["model"]["fine_use_gpu"])
                fine_use_small = gr.Checkbox(
                    label="Use small model for fine-tuning", value=config["model"]["fine_use_small"])
                codec_use_gpu = gr.Checkbox(
                    label="Use GPU for codec", value=config["model"]["codec_use_gpu"])

                save_beacon = gr.Markdown("")

                gr.Markdown("""
                    ## Environment variables
                    (Requires restart)
                """)
                ENV_SMALL_MODELS = os.environ.get(
                    "SUNO_USE_SMALL_MODELS", "").lower() in ("true", "1")
                ENV_ENABLE_MPS = os.environ.get(
                    "SUNO_ENABLE_MPS", "").lower() in ("true", "1")
                ENV_OFFLOAD_CPU = os.environ.get(
                    "SUNO_OFFLOAD_CPU", "").lower() in ("true", "1")
                environment_suno_use_small_models = gr.Checkbox(
                    label="Use small models", value=ENV_SMALL_MODELS)

                environment_suno_enable_mps = gr.Checkbox(
                    label="Enable MPS", value=ENV_ENABLE_MPS)

                environment_suno_offload_cpu = gr.Checkbox(
                    label="Offload GPU models to CPU", value=ENV_OFFLOAD_CPU)

                save_environment_button = gr.Button(
                    value="Save Environment Variables and Exit")

                def save_environment_variables(
                        environment_suno_use_small_models,
                        environment_suno_enable_mps,
                        environment_suno_offload_cpu
                ):
                    os.environ["SUNO_USE_SMALL_MODELS"] = str(
                        environment_suno_use_small_models)
                    os.environ["SUNO_ENABLE_MPS"] = str(
                        environment_suno_enable_mps)
                    os.environ["SUNO_OFFLOAD_CPU"] = str(
                        environment_suno_offload_cpu)
                    with open('../../.env', 'w') as outfile:
                        outfile.write(
                            generate_env(environment_suno_use_small_models,
                                         environment_suno_enable_mps,
                                         environment_suno_offload_cpu)
                        )
                    os._exit(0)

                save_environment_button.click(fn=save_environment_variables,
                                              inputs=[
                                                  environment_suno_use_small_models,
                                                  environment_suno_enable_mps,
                                                  environment_suno_offload_cpu
                                              ])

                inputs = [
                    text_use_gpu,
                    text_use_small,
                    coarse_use_gpu,
                    coarse_use_small,
                    fine_use_gpu,
                    fine_use_small,
                    codec_use_gpu,
                    load_models_on_startup
                ]

                for i in inputs:
                    i.change(fn=save_config, inputs=inputs,
                                 outputs=[save_beacon])

                def sync_ui():
                    def checkbox_update_helper(key: str):
                        return gr.Checkbox.update(
                            value=config["model"][key])

                    return [
                        checkbox_update_helper("text_use_gpu"),
                        checkbox_update_helper("text_use_small"),
                        checkbox_update_helper("coarse_use_gpu"),
                        checkbox_update_helper("coarse_use_small"),
                        checkbox_update_helper("fine_use_gpu"),
                        checkbox_update_helper("fine_use_small"),
                        checkbox_update_helper("codec_use_gpu"),
                        gr.Checkbox.update(
                            value=config["load_models_on_startup"]),
                    ]

                settings_tab.select(fn=sync_ui, outputs=inputs)

                def set_to_reload():
                    return gr.Button.update(value="Loading...", interactive=False)

            with gr.Column():
                gr.Markdown(
                    """
                    # Recommended settings
                    For VRAM >= 10GB, use large models.
                    For VRAM < 10GB, use small models.
                    For VRAM < 4GB, use CPU offloading (requires restart).
                """
                )

                load_button = gr.Button(
                    value="Reload models" if config["load_models_on_startup"] else "Load models")

                load_button.click(fn=set_to_reload, inputs=[],
                                  outputs=[load_button])
                load_button.click(fn=load_models, inputs=[
                    text_use_gpu,
                    text_use_small,
                    coarse_use_gpu,
                    coarse_use_small,
                    fine_use_gpu,
                    fine_use_small,
                    codec_use_gpu
                ], outputs=[load_button], show_progress=True)
