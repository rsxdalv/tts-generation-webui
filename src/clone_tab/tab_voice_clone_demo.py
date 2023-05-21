import tempfile
from typing import List
from models.bark_voice_cloning_hubert_quantizer.hubert.hubert_manager import HuBERTManager
from models.bark_voice_cloning_hubert_quantizer.hubert.pre_kmeans_hubert import CustomHubert
from models.bark_voice_cloning_hubert_quantizer.hubert.customtokenizer import CustomTokenizer
import torchaudio
import torch
from encodec.utils import convert_audio
from bark.generation import load_codec_model

import gradio as gr
import numpy as np

hubert_model = None


def _load_hubert_model():
    hubert_path = HuBERTManager.make_sure_hubert_installed()
    global hubert_model
    if hubert_model is None:
        hubert_model = CustomHubert(checkpoint_path=hubert_path)
    return hubert_model


def get_semantic_vectors(path_to_wav):
    hubert_model = _load_hubert_model()
    return _get_semantic_vectors(hubert_model, path_to_wav)


def _get_semantic_vectors(hubert_model, path_to_wav):
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
        tokenizer = CustomTokenizer()
        tokenizer.load_state_dict(torch.load(tokenizer_path))
    return tokenizer


def _get_semantic_tokens(semantic_vectors, tokenizer):
    return tokenizer.get_token(semantic_vectors)


def get_semantic_tokens(semantic_vectors):
    tokenizer = _load_tokenizer()
    return _get_semantic_tokens(semantic_vectors, tokenizer)


def get_semantic_prompt(path_to_wav):
    semantic_vectors = get_semantic_vectors(path_to_wav)
    return get_semantic_tokens(semantic_vectors)


def get_prompts(path_to_wav, use_gpu):
    semantic_prompt = get_semantic_prompt(path_to_wav)
    fine_prompt, coarse_prompt = get_encodec_prompts(path_to_wav, use_gpu)
    return semantic_prompt, coarse_prompt, fine_prompt

def get_encodec_prompts(path_to_wav, use_gpu=True):
    device = 'cuda' if use_gpu else 'cpu'
    model = load_codec_model(use_gpu=use_gpu)
    wav, sr = torchaudio.load(path_to_wav)
    wav = convert_audio(wav, sr, model.sample_rate, model.channels)
    wav = wav.unsqueeze(0).to(device)
    model.to(device)

    # Extract discrete codes from EnCodec
    with torch.no_grad():
        encoded_frames = model.encode(wav)

    fine_prompt = torch.cat(
        [encoded[0] for encoded in encoded_frames], dim=-1).squeeze().cpu().numpy()
    coarse_prompt = fine_prompt[:2, :]
    return fine_prompt, coarse_prompt


def save_cloned_voice(
    semantic_prompt,
    coarse_prompt,
    fine_prompt,
):
    voice_name = f'test_clone_voice{str(np.random.randint(100000))}'
    filename = f'voices/{voice_name}.npz'
    np.savez(filename, fine_prompt=fine_prompt,
             coarse_prompt=coarse_prompt, semantic_prompt=semantic_prompt)
    return filename


def tab_voice_clone_demo():
    with gr.Tab("Bark Voice Clone Demo"):
        disclaimer = gr.Markdown("""
        Unethical use of this technology is prohibited.
        This demo is based on https://github.com/gitmylo/bark-voice-cloning-HuBERT-quantizer repository.
        """)

        # file_input = gr.Audio(label="Input Audio", type="numpy", source="upload", interactive=True)
        file_input = gr.File(label="Input Audio", file_types=[
                             ".wav"], interactive=True)

        use_gpu_checkbox = gr.Checkbox(label="Use GPU", value=True)

        generate_voice_button = gr.Button(
            value="Generate Voice", variant="primary")

        def generate_voice(wav_file_obj: tempfile._TemporaryFileWrapper, use_gpu: bool):
            if (wav_file_obj is None):
                print("No file selected")
                return
            wav_file = wav_file_obj.name
            semantic_prompt, coarse_prompt, fine_prompt = get_prompts(
                wav_file, use_gpu)
            filename = save_cloned_voice(
                semantic_prompt,
                coarse_prompt,
                fine_prompt,
            )
            return f"Saved: {filename}"

        output = gr.Label(
            "Output will appear here after input", type="auto", lines=3)

        generate_voice_button.click(fn=generate_voice, inputs=[
                                    file_input, use_gpu_checkbox], outputs=output, preprocess=True)
