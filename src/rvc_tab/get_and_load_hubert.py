from huggingface_hub import hf_hub_download
from rvc_beta import infer_batch_rvc
from fairseq import checkpoint_utils
import os


def get_and_load_hubert():
    model = hf_hub_download(
        repo_id="lj1995/VoiceConversionWebUI", filename="hubert_base.pt"
    )
    infer_batch_rvc.load_hubert(
        hubert_model_path=model,
    )


def load_hubert_new(config, path="assets/hubert/hubert_base.pt"):
    models, _, _ = checkpoint_utils.load_model_ensemble_and_task(
        [path],
        suffix="",
    )
    hubert_model = models[0]
    hubert_model = hubert_model.to(config.device)
    if config.is_half:
        hubert_model = hubert_model.half()
    else:
        hubert_model = hubert_model.float()
    return hubert_model.eval()


def get_and_load_hubert_new(config):
    hubert_path = hf_hub_download(
        repo_id="lj1995/VoiceConversionWebUI", filename="hubert_base.pt"
    )
    return load_hubert_new(config, hubert_path)


def download_rmvpe():
    local_dir = os.environ.get("rmvpe_root", "data/models/rvc/rmvpe")
    if not os.path.exists(os.path.join(local_dir, "rmvpe.pt")):
        print("Downloading rmvpe")
        file = hf_hub_download(
            repo_id="lj1995/VoiceConversionWebUI",
            filename="rmvpe.pt",
            local_dir=local_dir,
            local_dir_use_symlinks=False,
        )
        print(f"RMVPE downloaded to {os.environ.get('rmvpe_root')}")
        return file
