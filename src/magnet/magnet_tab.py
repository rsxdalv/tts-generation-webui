import gradio as gr
from typing import List, TypedDict, Literal
import numpy as np
from importlib.metadata import version
from audiocraft.models.magnet import MAGNeT

from src.utils.only_overlap import only_overlap
from src.history_tab.save_to_favorites import save_to_favorites
from src.utils.get_path_from_root import get_path_from_root
from src.utils.list_dir_models import model_select_ui, unload_model_button
from src.utils.randomize_seed import randomize_seed_ui
from src.utils.manage_model_state import manage_model_state, unload_model
from src.decorators.gradio_dict_decorator import gradio_dict_decorator
from src.decorators.decorator_apply_torch_seed import decorator_apply_torch_seed
from src.decorators.decorator_log_generation import decorator_log_generation
from src.decorators.decorator_save_metadata import decorator_save_metadata
from src.decorators.decorator_save_wav import decorator_save_wav
from src.decorators.decorator_add_base_filename import decorator_add_base_filename
from src.decorators.decorator_add_date import decorator_add_date
from src.decorators.decorator_add_model_type import decorator_add_model_type
from src.decorators.log_function_time import log_function_time
from src.extensions_loader.decorator_extensions import (
    decorator_extension_outer,
    decorator_extension_inner,
)


AUDIOCRAFT_VERSION = version("audiocraft")


class MagnetGenerationParams(TypedDict):
    use_sampling: bool
    top_k: int
    top_p: float
    temperature: float
    max_cfg_coef: float
    min_cfg_coef: float
    decoding_steps: List[int]
    span_arrangement: Literal["nonoverlap", "stride1"]


@manage_model_state("magnet")
def get_model(model):
    return MAGNeT.get_pretrained(model)


def unload_model_magnet():
    unload_model("magnet")


def decorator_save_musicgen_npz(fn):
    def wrapper(*args, **kwargs):
        result_dict = fn(*args, **kwargs)
        tokens = result_dict["tokens"]

        if tokens is not None:
            from src.utils.outputs.path import get_relative_output_path_ext

            path = get_relative_output_path_ext(result_dict, ".npz")
            from src.bark.npz_tools import save_npz_musicgen

            save_npz_musicgen(path, tokens, result_dict["metadata"])

        return result_dict

    return wrapper


# How to deal with yield in function? I can write yield/non yield functions, but how to combine them in one
@decorator_extension_outer
@decorator_apply_torch_seed
@decorator_save_musicgen_npz
@decorator_save_metadata
@decorator_save_wav
@decorator_add_model_type("magnet")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def generate(
    model_name: str,
    text: str,
    decoding_steps_1: int,
    decoding_steps_2: int,
    decoding_steps_3: int,
    decoding_steps_4: int,
    **kwargs,
):
    model_inst = get_model(model_name)
    model_inst.set_generation_params(
        **only_overlap(
            {
                **kwargs,
                "decoding_steps": [
                    decoding_steps_1,
                    decoding_steps_2,
                    decoding_steps_3,
                    decoding_steps_4,
                ],
            },
            MagnetGenerationParams,
        )
    )

    output, tokens = model_inst.generate(
        descriptions=[text],
        progress=True,
        return_tokens=True,
    )

    audio_array = output.detach().cpu().numpy().squeeze()

    stereo = audio_array.shape[0] == 2
    if stereo:
        audio_array = np.transpose(audio_array)

    return {"audio_out": (model_inst.sample_rate, audio_array), "tokens": tokens}


MAGNET_LOCAL_MODELS_DIR = get_path_from_root("data", "models", "magnet")

MAGNET_OFFICIAL_REPOS = [
    ("Magnet, 10s, Small", "facebook/magnet-small-10secs"),
    ("Magnet, 10s, Medium", "facebook/magnet-medium-10secs"),
    ("Magnet, 30s, Small", "facebook/magnet-small-30secs"),
    ("Magnet, 30s, Medium", "facebook/magnet-medium-30secs"),
    ("Audio, Magnet, Small", "facebook/audio-magnet-small"),
    ("Audio, Magnet, Medium", "facebook/audio-magnet-medium"),
]


def generation_tab_magnet():
    with gr.Tab("Magnet"):
        magnet_ui()


def magnet_ui():
    gr.Markdown(f"""Audiocraft version: {AUDIOCRAFT_VERSION}""")
    with gr.Row(equal_height=False):
        with gr.Column():
            text = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")
            model_name = model_select_ui(
                MAGNET_OFFICIAL_REPOS, MAGNET_LOCAL_MODELS_DIR, "magnet"
            )
            unload_model_button("magnet")
            submit = gr.Button("Generate", variant="primary")
        with gr.Column():
            with gr.Row():
                top_k = gr.Number(label="Top-k", value=0)
                top_p = gr.Slider(
                    minimum=0.0,
                    maximum=1.5,
                    value=0.95,
                    label="Top-p",
                    step=0.05,
                )
                temperature = gr.Slider(
                    minimum=0.0,
                    maximum=10,
                    value=1.0,
                    label="Temperature",
                    step=0.05,
                )
            with gr.Row():
                min_cfg_coef = gr.Slider(
                    label="Min CFG coefficient",
                    value=1.0,
                    minimum=0,
                    step=0.5,
                )
                max_cfg_coef = gr.Slider(
                    label="Max CFG coefficient",
                    value=20.0,
                    minimum=0,
                    step=0.5,
                )
            with gr.Row():
                gr.Markdown("Decoding Steps:")
                decoding_steps_1 = gr.Slider(label="Stage 1", value=80)
                decoding_steps_2 = gr.Slider(label="Stage 2", value=40)
                decoding_steps_3 = gr.Slider(label="Stage 3", value=40)
                decoding_steps_4 = gr.Slider(label="Stage 4", value=20)
            with gr.Row():
                span_arrangement = gr.Radio(
                    ["nonoverlap", "stride1"],
                    label="Span Scoring",
                    value="nonoverlap",
                )
                use_sampling = gr.Checkbox(label="Use Sampling", value=True)
            seed, randomize_seed_callback = randomize_seed_ui()

    with gr.Column():
        audio_out = gr.Audio(
            label="Generated Music",
            type="numpy",
            interactive=False,
            elem_classes="tts-audio",
        )
        with gr.Row():
            history_bundle_name_data = gr.Textbox(visible=False)
            save_button = gr.Button("Save to favorites", visible=True)
        save_button.click(
            fn=save_to_favorites,
            inputs=[history_bundle_name_data],
            outputs=[save_button],
        )

    inputs_dict = {
        model_name: "model_name",
        text: "text",
        seed: "seed",
        use_sampling: "use_sampling",
        top_k: "top_k",
        top_p: "top_p",
        temperature: "temperature",
        max_cfg_coef: "max_cfg_coef",
        min_cfg_coef: "min_cfg_coef",
        decoding_steps_1: "decoding_steps_1",
        decoding_steps_2: "decoding_steps_2",
        decoding_steps_3: "decoding_steps_3",
        decoding_steps_4: "decoding_steps_4",
        span_arrangement: "span_arrangement",
    }

    outputs_dict = {
        "audio_out": audio_out,
        "metadata": gr.JSON(label="Metadata", visible=False),
        "folder_root": history_bundle_name_data,
    }

    submit.click(
        **randomize_seed_callback,
    ).then(
        # fn=generate,
        # inputs=[
        #     model_name,
        #     text,
        #     seed,
        #     use_sampling,
        #     top_k,
        #     top_p,
        #     temperature,
        #     max_cfg_coef,
        #     min_cfg_coef,
        #     decoding_steps_1,
        #     decoding_steps_2,
        #     decoding_steps_3,
        #     decoding_steps_4,
        #     span_arrangement,
        # ],
        # outputs=[audio_out, history_bundle_name_data, result_json],
        fn=gradio_dict_decorator(
            fn=generate,
            gradio_fn_input_dictionary=inputs_dict,
            outputs=outputs_dict,
        ),
        inputs={*inputs_dict},
        outputs=list(outputs_dict.values()),
        api_name="magnet",
    )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        generation_tab_magnet()

    demo.launch()

    generate(
        model_name="facebook/musicgen-melody",
        text="I am a robot",
        seed=0,
        use_sampling=True,
        top_k=250,
        top_p=0.0,
        temperature=1.0,
        max_cfg_coef=10.0,
        min_cfg_coef=1.0,
        decoding_steps_1=20,
        decoding_steps_2=10,
        decoding_steps_3=10,
        decoding_steps_4=10,
        span_arrangement="nonoverlap",
    )
