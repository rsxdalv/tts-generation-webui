import os
import json

import torch
from huggingface_hub import hf_hub_download
import gradio as gr

from stable_audio_tools.interface.gradio import (
    create_sampling_ui,
    load_model,
    generate_cond,
)

from src.history_tab.open_folder import open_folder
from src.utils.get_path_from_root import get_path_from_root

LOCAL_DIR_BASE = os.path.join("data", "models", "stable-audio")
LOCAL_DIR_BASE_ABSOLUTE = get_path_from_root(*LOCAL_DIR_BASE.split("/"))
OUTPUT_DIR = os.path.join("outputs-rvc", "Stable Audio")


def get_local_dir(name):
    return os.path.join(LOCAL_DIR_BASE, name.replace("/", "__"))


def get_config_path(name):
    return os.path.join(get_local_dir(name), "model_config.json")


def get_ckpt_path(name):
    # check if model.safetensors exists, if not, check if model.ckpt exists
    safetensor_path = os.path.join(get_local_dir(name), "model.safetensors")
    if os.path.exists(safetensor_path):
        return safetensor_path
    else:
        chkpt_path = os.path.join(get_local_dir(name), "model.ckpt")
        if os.path.exists(chkpt_path):
            return chkpt_path
        else:
            raise Exception(
                f"Neither model.safetensors nor model.ckpt exists for {name}"
            )


def download_pretrained_model(name: str, token: str):

    local_dir = get_local_dir(name)

    model_config_path = hf_hub_download(
        name,
        filename="model_config.json",
        repo_type="model",
        local_dir=local_dir,
        local_dir_use_symlinks=False,
        token=token,
    )

    # Try to download the model.safetensors file first, if it doesn't exist, download the model.ckpt file
    try:
        print(f"Downloading {name} model.safetensors")
        ckpt_path = hf_hub_download(
            name,
            filename="model.safetensors",
            repo_type="model",
            local_dir=local_dir,
            local_dir_use_symlinks=False,
            token=token,
        )
    except Exception as e:
        print(f"Downloading {name} model.ckpt")
        ckpt_path = hf_hub_download(
            name,
            filename="model.ckpt",
            repo_type="model",
            local_dir=local_dir,
            local_dir_use_symlinks=False,
            token=token,
        )

    return model_config_path, ckpt_path


def get_model_list():
    try:
        return [
            x
            for x in os.listdir(LOCAL_DIR_BASE)
            if os.path.isdir(os.path.join(LOCAL_DIR_BASE, x))
        ]
    except FileNotFoundError as e:
        print(e)
        return []


def load_model_config(model_name):
    path = get_config_path(model_name)
    try:
        with open(path) as f:
            return json.load(f)
    except Exception as e:
        print(e)
        message = (
            f"Model config not found at {path}. Please ensure model_config.json exists."
        )
        gr.Error(message)
        raise Exception(message)


def stable_audio_ui():
    default_model_config_path = os.path.join(LOCAL_DIR_BASE, "diffusion_cond.json")
    with open(default_model_config_path) as f:
        model_config = json.load(f)

    pretransform_ckpt_path = None
    pretrained_name = None

    def load_model_helper(model_name, model_half):
        if model_name == None:
            return model_name

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        _, model_config_new = load_model(
            model_config=load_model_config(model_name),
            model_ckpt_path=get_ckpt_path(model_name),
            pretrained_name=None,
            pretransform_ckpt_path=pretransform_ckpt_path,
            model_half=model_half,
            device=device,  # type: ignore
        )

        model_type = model_config_new["model_type"]  # type: ignore

        if model_type != "diffusion_cond":
            gr.Error("Only diffusion_cond models are supported")
            raise Exception("Only diffusion_cond models are supported")

        # if model_type == "diffusion_cond":
        #     ui = create_txt2audio_ui(model_config)
        # elif model_type == "diffusion_uncond":
        #     ui = create_diffusion_uncond_ui(model_config)
        # elif model_type == "autoencoder" or model_type == "diffusion_autoencoder":
        #     ui = create_autoencoder_ui(model_config)
        # elif model_type == "diffusion_prior":
        #     ui = create_diffusion_prior_ui(model_config)
        # elif model_type == "lm":
        #     ui = create_lm_ui(model_config)

        return model_name

    def model_select_ui():
        with gr.Row():
            model_select = gr.Dropdown(
                choices=get_model_list(),  # type: ignore
                label="Model",
                default=pretrained_name,
                type="value",
            )

            with gr.Column():
                gr.Markdown(
                    """
                    Stable Audio requires a manual download of a model.
                    Please download a model using the download tab or manually place it in the `data/models/stable-audio` folder.
                    """
                )
                half_checkbox = gr.Checkbox(
                    label="Use half precision when loading the model",
                    value=True,
                    type="value",
                )

            model_select.change(
                fn=load_model_helper,
                inputs=[model_select, half_checkbox],
                outputs=[model_select],
            )

    model_select_ui()

    with gr.Tabs():
        with gr.Tab("Generation"):
            create_sampling_ui(model_config)
            open_dir_btn = gr.Button("Open outputs folder")
            open_dir_btn.click(
                lambda: open_folder(OUTPUT_DIR),
                api_name="stable_audio_open_output_dir",
            )
        with gr.Tab("Inpainting"):
            create_sampling_ui(model_config, inpainting=True)
            open_dir_btn = gr.Button("Open outputs folder")
            open_dir_btn.click(
                lambda: open_folder(OUTPUT_DIR),
                api_name="stable_audio_open_output_dir",
            )
        with gr.Tab("Model Download"):
            gr.Markdown(
                "Models can be found on the [HuggingFace model hub](https://huggingface.co/models?search=stable-audio-open-1.0)."
            )
            pretrained_name_text = gr.Textbox(
                label="HuggingFace repo name, e.g. stabilityai/stable-audio-open-1.0",
                value="",
            )
            token_text = gr.Textbox(
                label="HuggingFace Token (Optional, but needed for some non-public models)",
                placeholder="hf_nFjKuKLJF...",
                value="",
            )
            download_btn = gr.Button("Download")
            download_btn.click(
                download_pretrained_model,
                inputs=[pretrained_name_text, token_text],
                outputs=[pretrained_name_text],
                api_name="model_download",
            )

            gr.Markdown(
                "Models can also be downloaded manually and placed within the directory in a folder, for example `data/models/stable-audio/my_model`"
            )

            open_dir_btn = gr.Button("Open local models dir")
            open_dir_btn.click(
                lambda: open_folder(LOCAL_DIR_BASE_ABSOLUTE),
                api_name="model_open_dir",
            )


def stable_audio_ui_tab():
    with gr.Tab("Stable Audio"):
        stable_audio_ui()


import scipy.io.wavfile as wavfile
from src.utils.date import get_date_string


def save_result(audio, *generation_args):

    date = get_date_string()

    generation_args = {
        "date": date,
        "version": "0.0.1",
        "prompt": generation_args[0],
        "negative_prompt": generation_args[1],
        "seconds_start_slider": generation_args[2],
        "seconds_total_slider": generation_args[3],
        "cfg_scale_slider": generation_args[4],
        "steps_slider": generation_args[5],
        "preview_every_slider": generation_args[6],
        "seed_textbox": generation_args[7],
        "sampler_type_dropdown": generation_args[8],
        "sigma_min_slider": generation_args[9],
        "sigma_max_slider": generation_args[10],
        "cfg_rescale_slider": generation_args[11],
        "init_audio_checkbox": generation_args[12],
        "init_audio_input": generation_args[13],
        "init_noise_level_slider": generation_args[14],
    }
    print(generation_args)
    prompt = generation_args["prompt"]

    def get_name(prompt):
        return (
            prompt.replace(" ", "_")
            .replace(":", "_")
            .replace("'", "_")
            .replace('"', "_")
            .replace("\\", "_")
            .replace(",", "_")
            .replace("(", "_")
            .replace(")", "_")
            .replace("?", "_")
            .replace("!", "_")
            # only first 15 characters
            .replace("__", "_")[:15]
        )

    name = f"{date}_{get_name(prompt)}"

    base_dir = os.path.join(OUTPUT_DIR, name)
    os.makedirs(base_dir, exist_ok=True)

    sr, data = audio

    wavfile.write(os.path.join(base_dir, f"{name}.wav"), sr, data)

    with open(os.path.join(base_dir, f"{name}.json"), "w") as outfile:
        json.dump(
            generation_args,
            outfile,
            indent=2,
            default=lambda o: "<not serializable>",
        )


sample_rate = 32000
sample_size = 1920000


def create_sampling_ui(model_config, inpainting=False):
    with gr.Row():
        with gr.Column(scale=6):
            prompt = gr.Textbox(show_label=False, placeholder="Prompt")
            negative_prompt = gr.Textbox(
                show_label=False, placeholder="Negative prompt"
            )
        generate_button = gr.Button("Generate", variant="primary", scale=1)

    model_conditioning_config = model_config["model"].get("conditioning", None)

    has_seconds_start = False
    has_seconds_total = False

    if model_conditioning_config is not None:
        for conditioning_config in model_conditioning_config["configs"]:
            if conditioning_config["id"] == "seconds_start":
                has_seconds_start = True
            if conditioning_config["id"] == "seconds_total":
                has_seconds_total = True

    with gr.Row(equal_height=False):
        with gr.Column():
            with gr.Row(visible=has_seconds_start or has_seconds_total):
                # Timing controls
                seconds_start_slider = gr.Slider(
                    minimum=0,
                    maximum=512,
                    step=1,
                    value=0,
                    label="Seconds start",
                    visible=has_seconds_start,
                )
                seconds_total_slider = gr.Slider(
                    minimum=0,
                    maximum=512,
                    step=1,
                    value=sample_size // sample_rate,
                    label="Seconds total",
                    visible=has_seconds_total,
                )

            with gr.Row():
                # Steps slider
                steps_slider = gr.Slider(
                    minimum=1, maximum=500, step=1, value=100, label="Steps"
                )

                # Preview Every slider
                preview_every_slider = gr.Slider(
                    minimum=0, maximum=100, step=1, value=0, label="Preview Every"
                )

                # CFG scale
                cfg_scale_slider = gr.Slider(
                    minimum=0.0, maximum=25.0, step=0.1, value=7.0, label="CFG scale"
                )

            with gr.Accordion("Sampler params", open=False):

                # Seed
                seed_textbox = gr.Textbox(
                    label="Seed (set to -1 for random seed)", value="-1"
                )

                # Sampler params
                with gr.Row():
                    sampler_type_dropdown = gr.Dropdown(
                        [
                            "dpmpp-2m-sde",
                            "dpmpp-3m-sde",
                            "k-heun",
                            "k-lms",
                            "k-dpmpp-2s-ancestral",
                            "k-dpm-2",
                            "k-dpm-fast",
                        ],
                        label="Sampler type",
                        value="dpmpp-3m-sde",
                    )
                    sigma_min_slider = gr.Slider(
                        minimum=0.0,
                        maximum=2.0,
                        step=0.01,
                        value=0.03,
                        label="Sigma min",
                    )
                    sigma_max_slider = gr.Slider(
                        minimum=0.0,
                        maximum=1000.0,
                        step=0.1,
                        value=500,
                        label="Sigma max",
                    )
                    cfg_rescale_slider = gr.Slider(
                        minimum=0.0,
                        maximum=1,
                        step=0.01,
                        value=0.0,
                        label="CFG rescale amount",
                    )

            if inpainting:
                # Inpainting Tab
                with gr.Accordion("Inpainting", open=False):
                    sigma_max_slider.maximum = 1000

                    init_audio_checkbox = gr.Checkbox(label="Do inpainting")
                    init_audio_input = gr.Audio(label="Init audio")
                    init_noise_level_slider = gr.Slider(
                        minimum=0.1,
                        maximum=100.0,
                        step=0.1,
                        value=80,
                        label="Init audio noise level",
                        visible=False,
                    )  # hide this

                    mask_cropfrom_slider = gr.Slider(
                        minimum=0.0,
                        maximum=100.0,
                        step=0.1,
                        value=0,
                        label="Crop From %",
                    )
                    mask_pastefrom_slider = gr.Slider(
                        minimum=0.0,
                        maximum=100.0,
                        step=0.1,
                        value=0,
                        label="Paste From %",
                    )
                    mask_pasteto_slider = gr.Slider(
                        minimum=0.0,
                        maximum=100.0,
                        step=0.1,
                        value=100,
                        label="Paste To %",
                    )

                    mask_maskstart_slider = gr.Slider(
                        minimum=0.0,
                        maximum=100.0,
                        step=0.1,
                        value=50,
                        label="Mask Start %",
                    )
                    mask_maskend_slider = gr.Slider(
                        minimum=0.0,
                        maximum=100.0,
                        step=0.1,
                        value=100,
                        label="Mask End %",
                    )
                    mask_softnessL_slider = gr.Slider(
                        minimum=0.0,
                        maximum=100.0,
                        step=0.1,
                        value=0,
                        label="Softmask Left Crossfade Length %",
                    )
                    mask_softnessR_slider = gr.Slider(
                        minimum=0.0,
                        maximum=100.0,
                        step=0.1,
                        value=0,
                        label="Softmask Right Crossfade Length %",
                    )
                    mask_marination_slider = gr.Slider(
                        minimum=0.0,
                        maximum=1,
                        step=0.0001,
                        value=0,
                        label="Marination level",
                        visible=False,
                    )  # still working on the usefulness of this

                    inputs = [
                        prompt,
                        negative_prompt,
                        seconds_start_slider,
                        seconds_total_slider,
                        cfg_scale_slider,
                        steps_slider,
                        preview_every_slider,
                        seed_textbox,
                        sampler_type_dropdown,
                        sigma_min_slider,
                        sigma_max_slider,
                        cfg_rescale_slider,
                        init_audio_checkbox,
                        init_audio_input,
                        init_noise_level_slider,
                        mask_cropfrom_slider,
                        mask_pastefrom_slider,
                        mask_pasteto_slider,
                        mask_maskstart_slider,
                        mask_maskend_slider,
                        mask_softnessL_slider,
                        mask_softnessR_slider,
                        mask_marination_slider,
                    ]
            else:
                # Default generation tab
                with gr.Accordion("Init audio", open=False):
                    init_audio_checkbox = gr.Checkbox(label="Use init audio")
                    init_audio_input = gr.Audio(label="Init audio")
                    init_noise_level_slider = gr.Slider(
                        minimum=0.1,
                        maximum=100.0,
                        step=0.01,
                        value=0.1,
                        label="Init noise level",
                    )

                    inputs = [
                        prompt,
                        negative_prompt,
                        seconds_start_slider,
                        seconds_total_slider,
                        cfg_scale_slider,
                        steps_slider,
                        preview_every_slider,
                        seed_textbox,
                        sampler_type_dropdown,
                        sigma_min_slider,
                        sigma_max_slider,
                        cfg_rescale_slider,
                        init_audio_checkbox,
                        init_audio_input,
                        init_noise_level_slider,
                    ]

        with gr.Column():
            audio_output = gr.Audio(label="Output audio", interactive=False)
            audio_spectrogram_output = gr.Gallery(
                label="Output spectrogram", show_label=False
            )
            send_to_init_button = gr.Button("Send to init audio", scale=1)
            send_to_init_button.click(
                fn=lambda audio: audio,
                inputs=[audio_output],
                outputs=[init_audio_input],
            )

    generate_button.click(
        fn=generate_cond,
        inputs=inputs,
        outputs=[audio_output, audio_spectrogram_output],
        api_name="stable_audio_generate",
    ).then(
        fn=save_result,
        inputs=[
            audio_output,
            *inputs,
        ],
        api_name="stable_audio_save",
    ).then(
        fn=torch_clear_memory,
    )


def torch_clear_memory():
    torch.cuda.empty_cache()


# FEATURE - crop the audio to the actual length specified
# def crop_audio(audio, seconds_start_slider, seconds_total_slider):
#     sr, data = audio
#     seconds_start = seconds_start_slider.value
#     seconds_total = seconds_total_slider.value
#     data = data[int(seconds_start * sr) : int(seconds_total * sr)]
#     return sr, data

if __name__ == "__main__":
    exec(
        """
    main()
        with gr.Blocks() as interface:
            stable_audio_ui_tab()

        interface.queue()
        interface.launch(
            debug=True,
        )

    """
    )

    # main()
