from models.bark.bark.generation import preload_models


class BarkModelManager:
    def __init__(self, config):
        self.models_loaded = False
        if config["load_models_on_startup"]:
            try:
                self.reload_models(config)
            except Exception as e:
                print(f"Failed to load Bark models: {e}")

    def reload_models(self, config):
        print(f"{'Rel' if self.models_loaded else 'L'}oading Bark models")
        self.models_loaded = True
        model_config = config["model"]
        text_use_gpu = model_config["text_use_gpu"]
        text_use_small = model_config["text_use_small"]
        coarse_use_gpu = model_config["coarse_use_gpu"]
        coarse_use_small = model_config["coarse_use_small"]
        fine_use_gpu = model_config["fine_use_gpu"]
        fine_use_small = model_config["fine_use_small"]
        codec_use_gpu = model_config["codec_use_gpu"]

        print(
            f"""\t- Text Generation:\t\t GPU: {"Yes" if text_use_gpu else "No"}, Small Model: {"Yes" if text_use_small else "No"}
\t- Coarse-to-Fine Inference:\t GPU: {"Yes" if coarse_use_gpu else "No"}, Small Model: {"Yes" if coarse_use_small else "No"}
\t- Fine-tuning:\t\t\t GPU: {"Yes" if fine_use_gpu else "No"}, Small Model: {"Yes" if fine_use_small else "No"}
\t- Codec:\t\t\t GPU: {"Yes" if codec_use_gpu else "No"}"""
        )

        preload_models(
            text_use_gpu=text_use_gpu,
            text_use_small=text_use_small,
            coarse_use_gpu=coarse_use_gpu,
            coarse_use_small=coarse_use_small,
            fine_use_gpu=fine_use_gpu,
            fine_use_small=fine_use_small,
            codec_use_gpu=codec_use_gpu,
            force_reload=True,
        )
