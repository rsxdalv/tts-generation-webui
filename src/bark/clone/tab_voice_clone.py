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


def _load_hubert_model(device):
    hubert_path = HuBERTManager.make_sure_hubert_installed()
    global hubert_model
    if hubert_model is None:
        hubert_model = CustomHubert(
            checkpoint_path=hubert_path,
            device=device,
        )
    return hubert_model


def _get_semantic_vectors(hubert_model: CustomHubert, path_to_wav: str, device):
    # This is where you load your wav, with soundfile or torchaudio for example
    wav, sr = torchaudio.load(path_to_wav)

    if wav.shape[0] == 2:  # Stereo to mono if needed
        wav = wav.mean(0, keepdim=True)

    wav = wav.to(device)

    return hubert_model.forward(wav, input_sample_hz=sr)


def get_semantic_vectors(path_to_wav: str, device):
    hubert_model = _load_hubert_model(device)
    return _get_semantic_vectors(hubert_model, path_to_wav, device)


tokenizer = None


def _load_tokenizer(
    model: str = "quantifier_hubert_base_ls960_14.pth",
    repo: str = "GitMylo/bark-voice-cloning",
    force_reload: bool = False,
    device="cpu",
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
            tokenizer_path,
            map_location=device,
        )
        tokenizer.load_state_dict(torch.load(tokenizer_path, map_location=device))
    return tokenizer


def get_semantic_tokens(semantic_vectors: torch.Tensor, device):
    tokenizer = _load_tokenizer(device=device)
    return tokenizer.get_token(semantic_vectors)


def get_semantic_prompt(path_to_wav: str, device):
    semantic_vectors = get_semantic_vectors(path_to_wav, device)
    return get_semantic_tokens(semantic_vectors, device).cpu().numpy()


def get_prompts(path_to_wav: str, use_gpu: bool):
    device = "cuda" if use_gpu else "cpu"
    semantic_prompt = get_semantic_prompt(path_to_wav, device)
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

def save_cloned_voice(full_generation: FullGeneration):
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


def tab_voice_clone():
    with gr.Tab("Bark Voice Clone"), gr.Row(equal_height=False):
        with gr.Column():
            gr.Markdown(
                """
            Unethical use of this technology is prohibited.
            This demo is based on https://github.com/gitmylo/bark-voice-cloning-HuBERT-quantizer repository.

            Information from the original repository (https://github.com/gitmylo/bark-voice-cloning-HuBERT-quantizer?tab=readme-ov-file#voices-cloned-arent-very-convincing-why-are-other-peoples-cloned-voices-better-than-mine)

            ## Voices cloned aren't very convincing, why are other people's cloned voices better than mine?
            Make sure these things are **NOT** in your voice input: (in no particular order)
            * Noise (You can use a noise remover before)
            * Music (There are also music remover tools) (Unless you want music in the background)
            * A cut-off at the end (This will cause it to try and continue on the generation)
            * Under 1 second of training data (i personally suggest around 10 seconds for good potential, but i've had great results with 5 seconds as well.)

            What makes for good prompt audio? (in no particular order)
            * Clearly spoken
            * No weird background noises
            * Only one speaker
            * Audio which ends after a sentence ends
            * Regular/common voice (They usually have more success, it's still capable of cloning complex voices, but not as good at it)
            * Around 10 seconds of data

            """
            )


        with gr.Column():
            tokenizer_dropdown = gr.Dropdown(
                label="Tokenizer",
                choices=[
                    "quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning",
                    "quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning",
                    "quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning",
                    "polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer",
                    "german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer",
                    "es_tokenizer.pth @ Lancer1408/bark-es-tokenizer",
                    "portuguese-HuBERT-quantizer_24_epoch.pth @ MadVoyager/bark-voice-cloning-portuguese-HuBERT-quantizer",
                    "turkish_model_epoch_14.pth @ egeadam/bark-voice-cloning-turkish-HuBERT-quantizer",
                ],
                value="quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning",
                allow_custom_value=True,
                interactive=True,
            )

            file_input = gr.Audio(
                label="Input Audio",
                type="filepath",
                source="upload",
                interactive=True,
            )
            with gr.Row():
                use_gpu_checkbox = gr.Checkbox(label="Use GPU", value=True)
                clear_models_button = gr.Button(
                    "Clear models",
                    variant="secondary",
                )

                def clear_models():
                    global hubert_model
                    global tokenizer
                    hubert_model = None
                    tokenizer = None
                    torch.cuda.empty_cache()
                    return gr.Button.update(
                        value="Models cleared",
                    )

                clear_models_button.click(
                    fn=clear_models,
                    outputs=[clear_models_button],
                )

            generate_voice_button = gr.Button(value="Generate Voice", variant="primary")

            def load_tokenizer(tokenizer_and_repo: str, use_gpu: bool):
                tokenizer, repo = tokenizer_and_repo.split(" @ ")
                device = "cuda" if use_gpu else "cpu"
                _load_tokenizer(
                    model=tokenizer,
                    repo=repo,
                    force_reload=True,
                    device=device,
                )
                return tokenizer_and_repo

            tokenizer_dropdown.change(
                load_tokenizer,
                inputs=[tokenizer_dropdown, use_gpu_checkbox],
                outputs=[tokenizer_dropdown],
                api_name="bark_voice_tokenizer_load",
            )
            
            gr.Markdown("Generated voice:")
            voice_file_name = gr.Textbox(
                label="Voice file name", value="", interactive=False
            )

            audio_preview = gr.Audio(label="Encodec audio preview")

            gr.Markdown("Use as history button is now only available in React UI")

        def generate_voice(wav_file: str, use_gpu: bool):
            full_generation = get_prompts(wav_file, use_gpu)
            filename = save_cloned_voice(full_generation)
            return filename, get_audio_from_full_generation(full_generation)

        generate_voice_button.click(
            fn=generate_voice,
            inputs=[file_input, use_gpu_checkbox],
            # inputs=[file_input, use_gpu_checkbox, tokenizer_dropdown],
            outputs=[voice_file_name, audio_preview],
            preprocess=True,
            api_name="bark_voice_generate",
        )


if __name__ == "__main__":
    with gr.Blocks() as demo:
        tab_voice_clone()
    demo.launch()
