import os
import gradio as gr
from src.config.config import config
from src.config.save_config_bark import save_config_bark
from src.model_manager import model_manager
from src.utils.setup_or_recover import generate_env


def settings_tab_bark() -> None:
    with gr.Tab("Settings (Bark)") as settings_tab, gr.Row(equal_height=False):
        with gr.Column():
            load_models_on_startup = gr.Checkbox(
                label="Load Bark models on startup",
                value=config["load_models_on_startup"],
            )

            with gr.Row(variant="panel"):
                gr.Markdown("### Text generation:")
                text_use_gpu = gr.Checkbox(
                    label="Use GPU",
                    value=config["model"]["text_use_gpu"],
                )
                text_use_small = gr.Checkbox(
                    label="Use small model",
                    value=config["model"]["text_use_small"],
                )

            with gr.Row(variant="panel"):
                gr.Markdown("### Coarse-to-fine inference:", scale=2)
                coarse_use_gpu = gr.Checkbox(
                    label="Use GPU",
                    value=config["model"]["coarse_use_gpu"],
                )
                coarse_use_small = gr.Checkbox(
                    label="Use small model",
                    value=config["model"]["coarse_use_small"],
                )

            with gr.Row(variant="panel"):
                gr.Markdown("### Fine-tuning:")
                fine_use_gpu = gr.Checkbox(
                    label="Use GPU",
                    value=config["model"]["fine_use_gpu"],
                )
                fine_use_small = gr.Checkbox(
                    label="Use small model",
                    value=config["model"]["fine_use_small"],
                )

            with gr.Row(variant="panel"):
                gr.Markdown("### Codec:")
                codec_use_gpu = gr.Checkbox(
                    label="Use GPU for codec",
                    value=config["model"]["codec_use_gpu"],
                    scale=2,
                )

            save_beacon = gr.Markdown("")

            gr.Markdown(
                """
                ## Environment variables
                (Requires restart)
            """
            )
            ENV_SMALL_MODELS = os.environ.get("SUNO_USE_SMALL_MODELS", "").lower() in (
                "true",
                "1",
            )
            ENV_ENABLE_MPS = os.environ.get("SUNO_ENABLE_MPS", "").lower() in (
                "true",
                "1",
            )
            ENV_OFFLOAD_CPU = os.environ.get("SUNO_OFFLOAD_CPU", "").lower() in (
                "true",
                "1",
            )
            environment_suno_use_small_models = gr.Checkbox(
                label="Use small models", value=ENV_SMALL_MODELS
            )

            environment_suno_enable_mps = gr.Checkbox(
                label="Enable MPS", value=ENV_ENABLE_MPS
            )

            environment_suno_offload_cpu = gr.Checkbox(
                label="Offload GPU models to CPU", value=ENV_OFFLOAD_CPU
            )

            def save_environment_variables(
                environment_suno_use_small_models,
                environment_suno_enable_mps,
                environment_suno_offload_cpu,
            ):
                from bark import generation
                generation.USE_SMALL_MODELS = environment_suno_use_small_models
                generation.GLOBAL_ENABLE_MPS = environment_suno_enable_mps
                generation.OFFLOAD_CPU = environment_suno_offload_cpu
                
                os.environ["SUNO_USE_SMALL_MODELS"] = str(
                    environment_suno_use_small_models
                )
                os.environ["SUNO_ENABLE_MPS"] = str(environment_suno_enable_mps)
                os.environ["SUNO_OFFLOAD_CPU"] = str(environment_suno_offload_cpu)
                from src.utils.setup_or_recover import write_env

                write_env(
                    generate_env(
                        environment_suno_use_small_models=environment_suno_use_small_models,
                        environment_suno_enable_mps=environment_suno_enable_mps,
                        environment_suno_offload_cpu=environment_suno_offload_cpu,
                    )
                )

            env_inputs = [
                environment_suno_use_small_models,
                environment_suno_enable_mps,
                environment_suno_offload_cpu,
            ]

            for i in env_inputs:
                i.change(fn=save_environment_variables, inputs=env_inputs,
                         api_name="save_environment_variables_bark")

            # refresh environment variables button



            inputs = [
                text_use_gpu,
                text_use_small,
                coarse_use_gpu,
                coarse_use_small,
                fine_use_gpu,
                fine_use_small,
                codec_use_gpu,
                load_models_on_startup,
            ]

            for i in inputs:
                i.change(fn=save_config_bark, inputs=inputs, outputs=[save_beacon],
                         api_name="save_config_bark")

            def sync_ui():
                def checkbox_update_helper(key: str):
                    return gr.Checkbox.update(value=config["model"][key])

                return [
                    checkbox_update_helper("text_use_gpu"),
                    checkbox_update_helper("text_use_small"),
                    checkbox_update_helper("coarse_use_gpu"),
                    checkbox_update_helper("coarse_use_small"),
                    checkbox_update_helper("fine_use_gpu"),
                    checkbox_update_helper("fine_use_small"),
                    checkbox_update_helper("codec_use_gpu"),
                    gr.Checkbox.update(value=config["load_models_on_startup"]),
                ]

            settings_tab.select(fn=sync_ui, outputs=inputs,
                                api_name="get_config_bark")

            def set_to_reload():
                return gr.Button.update(value="Loading...", interactive=False)

        with gr.Column():
            gr.Markdown(
                """
                    # Recommended settings:
                    * For VRAM >= 10GB, use large models.
                    * For VRAM < 10GB, use small models.
                        * Text generation and coarse-to-fine are of similar importance.
                        * Small models might not have a perceptible difference in the result.
                    * For VRAM < 4GB, use CPU offloading (requires restart).
                        * Small models are also recommended.
                    * For VRAM < 2GB, use CPU offloading and small models (requires restart).
                """
            )

            load_button = gr.Button(
                value="Reload models"
                if config["load_models_on_startup"]
                else "Load models"
            )

            load_button.click(fn=set_to_reload, inputs=[], outputs=[load_button])
            load_button.click(
                fn=load_models,
                inputs=[
                    text_use_gpu,
                    text_use_small,
                    coarse_use_gpu,
                    coarse_use_small,
                    fine_use_gpu,
                    fine_use_small,
                    codec_use_gpu,
                ],
                outputs=[load_button],
                show_progress=True,
            )


def load_models(
    text_use_gpu,
    text_use_small,
    coarse_use_gpu,
    coarse_use_small,
    fine_use_gpu,
    fine_use_small,
    codec_use_gpu,
):
    save_config_bark(
        text_use_gpu,
        text_use_small,
        coarse_use_gpu,
        coarse_use_small,
        fine_use_gpu,
        fine_use_small,
        codec_use_gpu,
    )
    try:
        model_manager.reload_models(config)
        return gr.Button.update(value="Reload models", interactive=True)
    except Exception as e:
        print(e)
        return gr.Button.update(value="Failed to load models", interactive=True)
