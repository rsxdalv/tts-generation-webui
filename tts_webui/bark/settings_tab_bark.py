import os
import gradio as gr
from tts_webui.config.config import config
from tts_webui.config.save_config_bark import save_config_bark
from tts_webui.bark.BarkModelManager import bark_model_manager
from tts_webui.utils.setup_or_recover import generate_env
from tts_webui.utils.setup_or_recover import write_env


def settings_tab_bark() -> None:
    with gr.Tab("Settings (Bark)") as settings_tab, gr.Row(equal_height=False):
        bark_settings_ui(settings_tab)


def bark_settings_ui(settings_tab: gr.Tab):
    with gr.Column():
        model_config = config["model"]
        with gr.Row(variant="panel"):
            gr.Markdown("### Text generation:")
            text_use_gpu = gr.Checkbox(
                label="Use GPU",
                value=model_config["text_use_gpu"],
            )
            text_use_small = gr.Checkbox(
                label="Use small model",
                value=model_config["text_use_small"],
            )

        with gr.Row(variant="panel"):
            gr.Markdown("### Coarse-to-fine inference:")
            coarse_use_gpu = gr.Checkbox(
                label="Use GPU",
                value=model_config["coarse_use_gpu"],
            )
            coarse_use_small = gr.Checkbox(
                label="Use small model",
                value=model_config["coarse_use_small"],
            )

        with gr.Row(variant="panel"):
            gr.Markdown("### Fine-tuning:")
            fine_use_gpu = gr.Checkbox(
                label="Use GPU",
                value=model_config["fine_use_gpu"],
            )
            fine_use_small = gr.Checkbox(
                label="Use small model",
                value=model_config["fine_use_small"],
            )

        with gr.Row(variant="panel"):
            gr.Markdown("### Codec:")
            codec_use_gpu = gr.Checkbox(
                label="Use GPU for codec",
                value=model_config["codec_use_gpu"],
            )

        save_beacon = gr.Markdown("")

        gr.Markdown(
            """
            ## Environment variables
            (Requires restart)
        """
        )

        def _cast_bool(x: str):
            return x.lower() in ("true", "1")

        env_suno_use_small_models = gr.Checkbox(
            label="Use small models",
            value=_cast_bool(os.environ.get("SUNO_USE_SMALL_MODELS", "")),
        )
        env_suno_enable_mps = gr.Checkbox(
            label="Enable MPS", value=_cast_bool(os.environ.get("SUNO_ENABLE_MPS", ""))
        )
        env_suno_offload_cpu = gr.Checkbox(
            label="Offload GPU models to CPU",
            value=_cast_bool(os.environ.get("SUNO_OFFLOAD_CPU", "")),
        )

        def save_env_variables(
            env_suno_use_small_models,
            env_suno_enable_mps,
            env_suno_offload_cpu,
        ):
            write_env(
                generate_env(
                    env_suno_use_small_models=env_suno_use_small_models,
                    env_suno_enable_mps=env_suno_enable_mps,
                    env_suno_offload_cpu=env_suno_offload_cpu,
                )
            )

        env_inputs = [
            env_suno_use_small_models,
            env_suno_enable_mps,
            env_suno_offload_cpu,
        ]

        for i in env_inputs:
            i.change(
                fn=save_env_variables,
                inputs=env_inputs,
                api_name=i == env_inputs[0] and "save_env_variables_bark" or None,
            )

        # refresh environment variables button

        inputs = [
            text_use_gpu,
            text_use_small,
            coarse_use_gpu,
            coarse_use_small,
            fine_use_gpu,
            fine_use_small,
            codec_use_gpu,
        ]

        for i in inputs:
            i.change(
                fn=save_config_bark,
                inputs=inputs,
                outputs=[save_beacon],
                api_name=i == inputs[0] and "save_config_bark" or None,
            )

        def sync_ui():
            def checkbox_update_helper(key: str):
                return gr.Checkbox(value=config["model"][key])

            return [
                checkbox_update_helper("text_use_gpu"),
                checkbox_update_helper("text_use_small"),
                checkbox_update_helper("coarse_use_gpu"),
                checkbox_update_helper("coarse_use_small"),
                checkbox_update_helper("fine_use_gpu"),
                checkbox_update_helper("fine_use_small"),
                checkbox_update_helper("codec_use_gpu"),
            ]

        settings_tab.select(fn=sync_ui, outputs=inputs, api_name="get_config_bark")

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

        load_button = gr.Button(value="Load models")

        load_button.click(
            fn=lambda: gr.Button(value="Loading...", interactive=False),
            outputs=[load_button],
        ).then(
            fn=_load_models,
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
        )


def _load_models(
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
        bark_model_manager.reload_models(config)
        return gr.Button(value="Reload models", interactive=True)
    except Exception as e:
        print(e)
        return gr.Button(value="Failed to load models", interactive=True)
