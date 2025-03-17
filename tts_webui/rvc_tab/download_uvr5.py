import os
from huggingface_hub import hf_hub_download


def download_uvr5(model_name):
    local_dir = os.environ.get("weight_uvr5_root", "data/models/rvc/uvr5_weights")
    if not os.path.exists(os.path.join(local_dir, model_name)):
        print("Downloading uvr5")
        file = hf_hub_download(
            repo_id="lj1995/VoiceConversionWebUI",
            filename="uvr5_weights/" + model_name,
            local_dir=local_dir.replace("uvr5_weights", ""),
            local_dir_use_symlinks=False,
        )
        print(f"uvr5 downloaded to {os.environ.get('weight_uvr5_root')}")
        return file
    else:
        print(f"uvr5 already downloaded to {os.environ.get('weight_uvr5_root')}")
