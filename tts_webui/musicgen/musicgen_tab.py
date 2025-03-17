import torch
import gradio as gr
from einops import rearrange
from typing import Optional, Tuple
import numpy as np
from tts_webui.decorators.gradio_dict_decorator import dictionarize
from tts_webui.musicgen.audio_array_to_sha256 import audio_array_to_sha256
from tts_webui.utils.randomize_seed import randomize_seed_ui

from tts_webui.history_tab.save_to_favorites import save_to_favorites

from typing import Optional
from importlib.metadata import version
from tts_webui.history_tab.save_to_favorites import save_to_favorites
from tts_webui.utils.list_dir_models import model_select_ui, unload_model_button
from tts_webui.utils.randomize_seed import randomize_seed_ui
from tts_webui.utils.manage_model_state import manage_model_state
from tts_webui.decorators.gradio_dict_decorator import dictionarize
from tts_webui.decorators.decorator_apply_torch_seed import decorator_apply_torch_seed
from tts_webui.decorators.decorator_log_generation import decorator_log_generation
from tts_webui.decorators.decorator_save_wav import decorator_save_wav
from tts_webui.decorators.decorator_add_base_filename import (
    decorator_add_base_filename,
)
from tts_webui.decorators.decorator_add_date import decorator_add_date
from tts_webui.decorators.decorator_add_model_type import decorator_add_model_type
from tts_webui.decorators.log_function_time import log_function_time
from tts_webui.decorators.decorator_save_musicgen_npz import decorator_save_musicgen_npz
from tts_webui.extensions_loader.decorator_extensions import (
    decorator_extension_outer,
    decorator_extension_inner,
)
from tts_webui.utils.save_json_result import save_json_result

AUDIOCRAFT_VERSION = version("audiocraft")


def melody_to_sha256(melody: Optional[Tuple[int, np.ndarray]]) -> Optional[str]:
    if melody is None:
        return None
    _, audio_array = melody
    return audio_array_to_sha256(audio_array)


def _decorator_musicgen_save_metadata(fn):
    def wrapper(*args, **kwargs):
        result_dict = fn(*args, **kwargs)
        audio_array = result_dict["audio_out"][1]
        result_dict["metadata"] = {
            "_version": "0.0.1",
            "_hash_version": "0.0.3",
            "_audiocraft_version": AUDIOCRAFT_VERSION,
            **kwargs,
            "outputs": None,
            "models": {},
            "hash": audio_array_to_sha256(audio_array),
            "date": str(result_dict["date"]),
            "melody": melody_to_sha256(kwargs.get("melody", None)),
        }
        save_json_result(result_dict, result_dict["metadata"])
        return result_dict

    return wrapper


@manage_model_state("musicgen_audiogen")
def load_model(version):
    from audiocraft.models.musicgen import MusicGen
    from audiocraft.models.audiogen import AudioGen

    if version == "facebook/audiogen-medium":
        return AudioGen.get_pretrained(version)
    return MusicGen.get_pretrained(version)


@decorator_extension_outer
@decorator_apply_torch_seed
@decorator_save_musicgen_npz
@_decorator_musicgen_save_metadata
@decorator_save_wav
@decorator_add_model_type("musicgen")
@decorator_add_base_filename
@decorator_add_date
@decorator_log_generation
@decorator_extension_inner
@log_function_time
def generate(
    text,
    melody,
    model_name,
    duration,
    topk,
    topp,
    temperature,
    cfg_coef,
    use_multi_band_diffusion,
    **kwargs,
):
    model_inst = load_model(model_name)

    model_inst.set_generation_params(
        use_sampling=True,
        top_k=topk,
        top_p=topp,
        temperature=temperature,
        cfg_coef=cfg_coef,
        duration=duration,
    )

    if "melody" in model_name and melody is not None:
        sr, melody = (
            melody[0],
            torch.from_numpy(melody[1]).to(model_inst.device).float().t().unsqueeze(0),
        )
        print(melody.shape)
        if melody.dim() == 2:
            melody = melody[None]
        melody = melody[..., : int(sr * model_inst.lm.cfg.dataset.segment_duration)]  # type: ignore
        output, tokens = model_inst.generate_with_chroma(
            descriptions=[text],
            melody_wavs=melody,
            melody_sample_rate=sr,
            progress=True,
            return_tokens=True,
            # generator=generator,
        )
    elif model_name == "facebook/audiogen-medium":
        output = model_inst.generate(
            descriptions=[text],
            progress=True,
            # generator=generator,
        )
        tokens = None
    else:
        output, tokens = model_inst.generate(
            descriptions=[text],
            progress=True,
            return_tokens=True,
            # generator=generator,
        )

    if use_multi_band_diffusion:
        if model_name != "facebook/audiogen-medium":
            from audiocraft.models.multibanddiffusion import MultiBandDiffusion
            from audiocraft.models.encodec import InterleaveStereoCompressionModel

            mbd = MultiBandDiffusion.get_mbd_musicgen()
            if isinstance(
                model_inst.compression_model, InterleaveStereoCompressionModel
            ):
                left, right = model_inst.compression_model.get_left_right_codes(tokens)
                tokens = torch.cat([left, right])
            outputs_diffusion = mbd.tokens_to_wav(tokens)
            if isinstance(
                model_inst.compression_model, InterleaveStereoCompressionModel
            ):
                assert outputs_diffusion.shape[1] == 1  # output is mono
                outputs_diffusion = rearrange(
                    outputs_diffusion, "(s b) c t -> b (s c) t", s=2
                )
            output = outputs_diffusion.detach().cpu().numpy().squeeze()
        else:
            print("NOTICE: Multi-band diffusion is not supported for AudioGen")
            output = output.detach().cpu().numpy().squeeze()
    else:
        output = output.detach().cpu().numpy().squeeze()

    audio_array = output
    if audio_array.shape[0] == 2:
        audio_array = np.transpose(audio_array)

    return {"audio_out": (model_inst.sample_rate, audio_array), "tokens": tokens}


def musicgen_tab():
    with gr.Tab("MusicGen + AudioGen"):
        musicgen_ui()


def musicgen_ui():
    gr.Markdown(f"""Audiocraft version: {AUDIOCRAFT_VERSION}""")
    with gr.Row(equal_height=False):
        with gr.Column():
            text = gr.Textbox(label="Prompt", lines=3, placeholder="Enter text here...")
            model_name = model_select_ui(
                [
                    ("Melody", "facebook/musicgen-melody"),
                    ("Medium", "facebook/musicgen-medium"),
                    ("Small", "facebook/musicgen-small"),
                    ("Large", "facebook/musicgen-large"),
                    ("Audiogen", "facebook/audiogen-medium"),
                    ("Melody Large", "facebook/musicgen-melody-large"),
                    ("Stereo Small", "facebook/musicgen-stereo-small"),
                    ("Stereo Medium", "facebook/musicgen-stereo-medium"),
                    ("Stereo Melody", "facebook/musicgen-stereo-melody"),
                    ("Stereo Large", "facebook/musicgen-stereo-large"),
                    ("Stereo Melody Large", "facebook/musicgen-stereo-melody-large"),
                ],
                "musicgen_audiogen",
            )
            melody = gr.Audio(sources="upload", type="numpy", label="Melody (optional)")
            submit = gr.Button("Generate", variant="primary")
        with gr.Column():
            duration = gr.Slider(minimum=1, maximum=360, value=10, label="Duration")
            with gr.Row():
                topk = gr.Number(label="Top-k", value=250, interactive=True)
                topp = gr.Slider(
                    minimum=0.0, maximum=1.5, value=0.0, label="Top-p", step=0.05
                )
                temperature = gr.Slider(
                    minimum=0.0, maximum=1.5, value=1.0, label="Temperature", step=0.05
                )
                cfg_coef = gr.Slider(
                    minimum=0.0,
                    maximum=10.0,
                    value=3.0,
                    label="Classifier Free Guidance",
                    step=0.1,
                )
            use_multi_band_diffusion = gr.Checkbox(
                label="Use Multi-Band Diffusion (High VRAM Usage)",
                value=False,
            )
            seed, randomize_seed_callback = randomize_seed_ui()

            unload_model_button("musicgen_audiogen")

    with gr.Column():
        audio_out = gr.Audio(label="Generated Music", type="numpy")
        with gr.Row():
            folder_root = gr.Textbox(visible=False)
            save_button = gr.Button("Save to favorites", visible=True)
            melody_button = gr.Button("Use as melody", visible=True)
        save_button.click(
            fn=save_to_favorites,
            inputs=[folder_root],
            outputs=[save_button],
        )

        melody_button.click(
            fn=lambda melody_in: melody_in,
            inputs=[audio_out],
            outputs=[melody],
        )

    input_dict = {
        text: "text",
        melody: "melody",
        model_name: "model_name",
        duration: "duration",
        topk: "topk",
        topp: "topp",
        temperature: "temperature",
        cfg_coef: "cfg_coef",
        seed: "seed",
        use_multi_band_diffusion: "use_multi_band_diffusion",
    }

    output_dict = {
        "audio_out": audio_out,
        "metadata": gr.JSON(visible=False),
        "folder_root": folder_root,
    }

    submit.click(
        **randomize_seed_callback,
    ).then(
        **dictionarize(
            fn=generate,
            inputs=input_dict,
            outputs=output_dict,
        ),
        api_name="musicgen",
    )


if __name__ == "__main__":
    if "demo" in locals():
        demo.close()  # type: ignore
    with gr.Blocks() as demo:
        musicgen_tab()

    demo.launch(
        server_port=7770,
    )
