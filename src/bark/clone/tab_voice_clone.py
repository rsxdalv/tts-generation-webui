from src.bark.history_to_hash import history_to_hash
from src.bark.npz_tools import save_npz
from src.bark.FullGeneration import FullGeneration
from src.utils.date import get_date_string
from src.bark.get_audio_from_npz import get_audio_from_full_generation
from bark_hubert_quantizer.hubert_manager import HuBERTManager
from bark_hubert_quantizer.pre_kmeans_hubert import CustomHubert
from bark_hubert_quantizer.customtokenizer import CustomTokenizer
import torchaudio
import torch
from encodec.utils import convert_audio
from bark.generation import load_codec_model
from encodec.model import EncodecModel

import gradio as gr
import numpy as np


hubert_model = None


def _load_hubert_model():
    hubert_path = HuBERTManager.make_sure_hubert_installed()
    global hubert_model
    if hubert_model is None:
        hubert_model = CustomHubert(checkpoint_path=hubert_path)
    return hubert_model


def _get_semantic_vectors(hubert_model: CustomHubert, path_to_wav: str):
    # This is where you load your wav, with soundfile or torchaudio for example
    wav, sr = torchaudio.load(path_to_wav)

    if wav.shape[0] == 2:  # Stereo to mono if needed
        wav = wav.mean(0, keepdim=True)

    return hubert_model.forward(wav, input_sample_hz=sr)


def get_semantic_vectors(path_to_wav: str):
    hubert_model = _load_hubert_model()
    return _get_semantic_vectors(hubert_model, path_to_wav)


tokenizer = None


def _load_tokenizer(
    model: str = "quantifier_hubert_base_ls960_14.pth",
    repo: str = "GitMylo/bark-voice-cloning",
    force_reload: bool = False,
) -> CustomTokenizer:
    tokenizer_path = HuBERTManager.make_sure_tokenizer_installed(
        model=model,
        repo=repo,
        local_file=model,
    )
    global tokenizer
    if tokenizer is None or force_reload:
        tokenizer = CustomTokenizer.load_from_checkpoint(
            # "data/models/hubert/tokenizer.pth"
            tokenizer_path
        )
        tokenizer.load_state_dict(torch.load(tokenizer_path))
    return tokenizer


def get_semantic_tokens(semantic_vectors: torch.Tensor):
    tokenizer = _load_tokenizer()
    return tokenizer.get_token(semantic_vectors)


def get_semantic_prompt(path_to_wav: str):
    semantic_vectors = get_semantic_vectors(path_to_wav)
    return get_semantic_tokens(semantic_vectors).cpu().numpy()


def get_prompts(path_to_wav: str, use_gpu: bool):
    semantic_prompt = get_semantic_prompt(path_to_wav)
    fine_prompt, coarse_prompt = get_encodec_prompts(path_to_wav, use_gpu)
    return FullGeneration(
        semantic_prompt=semantic_prompt,
        coarse_prompt=coarse_prompt,
        fine_prompt=fine_prompt,
    )


def get_encodec_prompts(path_to_wav: str, use_gpu=True):
    device = "cuda" if use_gpu else "cpu"
    model: EncodecModel = load_codec_model(use_gpu=use_gpu)
    wav, sr = torchaudio.load(path_to_wav)
    wav = convert_audio(wav, sr, model.sample_rate, model.channels)
    wav = wav.unsqueeze(0).to(device)
    model.to(device)

    # Extract discrete codes from EnCodec
    with torch.no_grad():
        encoded_frames = model.encode(wav)

    fine_prompt: np.ndarray = (
        torch.cat([encoded[0] for encoded in encoded_frames], dim=-1)
        .squeeze()
        .cpu()
        .numpy()
    )
    coarse_prompt = fine_prompt[:2, :]
    return fine_prompt, coarse_prompt


def save_cloned_voice(
    full_generation: FullGeneration,
):
    voice_name = f"voice_from_audio_{history_to_hash(full_generation)}"
    filename = f"voices/{voice_name}.npz"
    date = get_date_string()
    metadata = generate_cloned_voice_metadata(full_generation, date)
    save_npz(filename, full_generation, metadata)
    return filename


def generate_cloned_voice_metadata(full_generation, date):
    return {
        "_version": "0.0.1",
        "_hash_version": "0.0.2",
        "_type": "bark",
        "hash": history_to_hash(full_generation),
        "date": date,
    }


def tab_voice_clone(register_use_as_history_button):
    with gr.Tab("Bark Voice Clone"), gr.Row():
        with gr.Column():
            gr.Markdown(
                """
            Unethical use of this technology is prohibited.
            This demo is based on https://github.com/gitmylo/bark-voice-cloning-HuBERT-quantizer repository.
            """
            )
            tokenizer_dropdown = gr.Dropdown(
                label="Tokenizer",
                choices=[
                    "quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning",
                    "quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning",
                    "quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning",
                    "polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer",
                    "german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer",
                ],
                value="quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning",
                interactive=True,
            )

            def load_tokenizer(tokenizer_and_repo: str):
                tokenizer, repo = tokenizer_and_repo.split(" @ ")
                _load_tokenizer(
                    model=tokenizer,
                    repo=repo,
                    force_reload=True,
                )
                return tokenizer_and_repo

            tokenizer_dropdown.change(
                load_tokenizer,
                inputs=[tokenizer_dropdown],
                outputs=[tokenizer_dropdown],
            )

            file_input = gr.Audio(
                label="Input Audio",
                type="filepath",
                source="upload",
                interactive=True,
            )

            use_gpu_checkbox = gr.Checkbox(label="Use GPU", value=True)

            generate_voice_button = gr.Button(value="Generate Voice", variant="primary")

        with gr.Column():
            gr.Markdown("Generated voice:")
            voice_file_name = gr.Textbox(
                label="Voice file name", value="", interactive=False
            )

            audio_preview = gr.Audio(label="Encodec audio preview")

            use_as_history_button = gr.Button(
                value="Use as history", variant="secondary"
            )

        def generate_voice(wav_file: str, use_gpu: bool):
            full_generation = get_prompts(wav_file, use_gpu)
            filename = save_cloned_voice(full_generation)
            return filename, get_audio_from_full_generation(full_generation)

        generate_voice_button.click(
            fn=generate_voice,
            inputs=[file_input, use_gpu_checkbox],
            outputs=[voice_file_name, audio_preview],
            preprocess=True,
        )

        register_use_as_history_button(
            use_as_history_button,
            voice_file_name,
        )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        tab_voice_clone(lambda *args: None)
    demo.launch()
