import gradio as gr
from typing import List, TypedDict, Literal
import numpy as np
from importlib.metadata import version

from tts_webui.utils.only_overlap import only_overlap
from tts_webui.history_tab.save_to_favorites import save_to_favorites
from tts_webui.utils.get_path_from_root import get_path_from_root
from tts_webui.utils.list_dir_models import model_select_ui, unload_model_button
from tts_webui.utils.randomize_seed import randomize_seed_ui
from tts_webui.utils.manage_model_state import manage_model_state, unload_model
from tts_webui.decorators.gradio_dict_decorator import dictionarize
from tts_webui.decorators.decorator_apply_torch_seed import decorator_apply_torch_seed
from tts_webui.decorators.decorator_log_generation import decorator_log_generation
from tts_webui.decorators.decorator_save_metadata import decorator_save_metadata
from tts_webui.decorators.decorator_save_wav import decorator_save_wav
from tts_webui.decorators.decorator_add_base_filename import decorator_add_base_filename
from tts_webui.decorators.decorator_add_date import decorator_add_date
from tts_webui.decorators.decorator_add_model_type import decorator_add_model_type
from tts_webui.decorators.log_function_time import log_function_time
from tts_webui.decorators.decorator_save_musicgen_npz import decorator_save_musicgen_npz
from tts_webui.extensions_loader.decorator_extensions import (
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
    from audiocraft.models.magnet import MAGNeT

    return MAGNeT.get_pretrained(model)


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


def magnet_tab():
    with gr.Tab("Magnet"):
        magnet_ui()


def magnet_ui():
    gr.Markdown(f"""Audiocraft version: {AUDIOCRAFT_VERSION}""")
    with gr.Row(equal_height=False):
        with gr.Column():
            text = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")
            model_name = model_select_ui(
                [
                    ("Magnet, 10s, Small", "facebook/magnet-small-10secs"),
                    ("Magnet, 10s, Medium", "facebook/magnet-medium-10secs"),
                    ("Magnet, 30s, Small", "facebook/magnet-small-30secs"),
                    ("Magnet, 30s, Medium", "facebook/magnet-medium-30secs"),
                    ("Audio, Magnet, Small", "facebook/audio-magnet-small"),
                    ("Audio, Magnet, Medium", "facebook/audio-magnet-medium"),
                ],
                "magnet",
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
        audio_out = gr.Audio(label="Generated Music", type="numpy")
        with gr.Row():
            folder_root = gr.Textbox(visible=False)
            save_button = gr.Button("Save to favorites", visible=True)
        save_button.click(
            fn=save_to_favorites,
            inputs=[folder_root],
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
        "folder_root": folder_root,
    }

    submit.click(
        **randomize_seed_callback,
    ).then(
        **dictionarize(
            fn=generate,
            inputs=inputs_dict,
            outputs=outputs_dict,
        ),
        api_name="magnet",
    )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        magnet_tab()

    demo.launch(
        server_port=7770,
    )
