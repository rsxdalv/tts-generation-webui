from huggingface_hub import hf_hub_download
from rvc_beta import infer_batch_rvc


def get_and_load_hubert():
    model = hf_hub_download(
        repo_id="lj1995/VoiceConversionWebUI", filename="hubert_base.pt"
    )
    infer_batch_rvc.load_hubert(
        hubert_model_path=model,
    )
