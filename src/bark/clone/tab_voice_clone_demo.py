import tempfile
from src.bark.npz_tools import save_npz
from src.bark.FullGeneration import FullGeneration
from models.bark_voice_cloning_hubert_quantizer.hubert.hubert_manager import (
    HuBERTManager,
)
from models.bark_voice_cloning_hubert_quantizer.hubert.pre_kmeans_hubert import (
    CustomHubert,
)
from models.bark_voice_cloning_hubert_quantizer.hubert.customtokenizer import (
    CustomTokenizer,
)
import torchaudio
import torch
from encodec.utils import convert_audio
from bark.generation import load_codec_model
from encodec import EncodecModel

import gradio as gr
import numpy as np

hubert_model = None


def _load_hubert_model():
    hubert_path = HuBERTManager.make_sure_hubert_installed()
    global hubert_model
    if hubert_model is None:
        hubert_model = CustomHubert(checkpoint_path=hubert_path)
    return hubert_model


def get_semantic_vectors(path_to_wav: str):
    hubert_model = _load_hubert_model()
    return _get_semantic_vectors(hubert_model, path_to_wav)


def _get_semantic_vectors(hubert_model: CustomHubert, path_to_wav: str):
    # This is where you load your wav, with soundfile or torchaudio for example
    wav, sr = torchaudio.load(path_to_wav)

    if wav.shape[0] == 2:  # Stereo to mono if needed
        wav = wav.mean(0, keepdim=True)

    return hubert_model.forward(wav, input_sample_hz=sr)


tokenizer = None


def _load_tokenizer():
    tokenizer_path = HuBERTManager.make_sure_tokenizer_installed()
    global tokenizer
    if tokenizer is None:
        tokenizer = CustomTokenizer.load_from_checkpoint(
            "data/models/hubert/tokenizer.pth"
        )
        tokenizer.load_state_dict(torch.load(tokenizer_path))
    return tokenizer


def _get_semantic_tokens(semantic_vectors: torch.Tensor, tokenizer: CustomTokenizer):
    return tokenizer.get_token(semantic_vectors)


def get_semantic_tokens(semantic_vectors: torch.Tensor):
    tokenizer = _load_tokenizer()
    return _get_semantic_tokens(semantic_vectors, tokenizer)


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
    voice_name = f"test_clone_voice{str(np.random.randint(100000))}"
    filename = f"voices/{voice_name}.npz"
    save_npz(filename, full_generation)
    return filename


def tab_voice_clone_demo():
    with gr.Tab("Bark Voice Clone Demo"):
        gr.Markdown(
            """
        Unethical use of this technology is prohibited.
        This demo is based on https://github.com/gitmylo/bark-voice-cloning-HuBERT-quantizer repository.
        """
        )

        # TODO: try with ffmpeg (except mp3)
        # file_input = gr.Audio(label="Input Audio", type="numpy", source="upload", interactive=True)
        file_input = gr.File(label="Input Audio", file_types=[".wav"], interactive=True)

        use_gpu_checkbox = gr.Checkbox(label="Use GPU", value=True)

        generate_voice_button = gr.Button(value="Generate Voice", variant="primary")

        def generate_voice(wav_file_obj: tempfile._TemporaryFileWrapper, use_gpu: bool):
            if wav_file_obj is None:
                print("No file selected")
                return
            wav_file = wav_file_obj.name
            full_generation = get_prompts(wav_file, use_gpu)
            filename = save_cloned_voice(full_generation)
            return f"Saved: {filename}"

        output = gr.Label("Output will appear here after input")

        generate_voice_button.click(
            fn=generate_voice,
            inputs=[file_input, use_gpu_checkbox],
            outputs=output,
            preprocess=True,
        )
