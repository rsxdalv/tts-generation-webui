import os
import sys
from dotenv import load_dotenv
from src.rvc_tab.hide_argv import hide_argv

os.environ.setdefault("weight_root", "data/models/rvc/checkpoints")
os.environ.setdefault("weight_uvr5_root", "data/models/rvc/uvr5_weights")
os.environ.setdefault("index_root", "data/models/rvc/checkpoints")
os.environ.setdefault("outside_index_root", "data/models/rvc/checkpoints")
os.environ.setdefault("rmvpe_root", "data/models/rvc/rmvpe")


import rvc_pkg

rvc_dir = os.path.dirname(rvc_pkg.__file__)
sys.path.append(rvc_dir)
from rvc_pkg.configs.config import Config
from rvc_pkg.infer.modules.vc.modules import VC

sys.path.remove(rvc_dir)

from src.rvc_tab.get_and_load_hubert import get_and_load_hubert_new, download_rmvpe


last_model_path = None
vc = None


def infer_rvc(
    input_path: str,  # Input path
    index_path_2: str,  # Index path
    model_name: str,  # Model name (stored in assets/weight_root)
    device: str,  # Device
    f0up_key: int = 0,  # F0up key
    f0method: str = "harvest",  # F0 method (harvest or pm)
    index_rate: float = 0.66,  # Index rate
    is_half: bool = False,  # Use half -> True
    filter_radius: int = 3,  # Filter radius
    resample_sr: int = 0,  # Resample sample rate
    rms_mix_rate: float = 1,  # RMS mix rate
    protect: float = 0.33,  # Protect breath sounds
):
    global last_model_path
    load_dotenv()
    with hide_argv():
        config = Config()
    config.device = device if device else config.device
    config.is_half = is_half if is_half else config.is_half
    global vc
    if vc is None:
        vc = VC(config)
        if vc.hubert_model is None:
            vc.hubert_model = get_and_load_hubert_new(config)
    if last_model_path != model_name:
        vc.get_vc(model_name)
        last_model_path = model_name
    if f0method == "rmvpe":
        download_rmvpe()
    message, wav_opt = vc.vc_single(
        0,
        input_path,
        f0up_key,
        None,
        f0method,
        None,
        os.path.join("data\\models\\rvc\\checkpoints\\", index_path_2),
        index_rate,
        filter_radius,
        resample_sr,
        rms_mix_rate,
        protect,
    )
    print(message)
    return wav_opt, {
        "original_audio_path": input_path,
        "index_path": index_path_2,
        "model_path": model_name,
        "f0method": f0method,
        "f0up_key": f0up_key,
        "index_rate": index_rate,
        "device": device,
        "is_half": is_half,
        "filter_radius": filter_radius,
        "resample_sr": resample_sr,
        "rms_mix_rate": rms_mix_rate,
        "protect": protect,
    }


if __name__ == "__main__":
    rate, wav_data = infer_rvc(
        input_path="sample.wav",
        model_name="Voltina.pth",
        index_path_2="Voltina.index",
        device="cuda:0",
        f0up_key=0,
        f0method="rmvpe",
        index_rate=0.66,
        is_half=False,
        filter_radius=3,
        resample_sr=0,
        rms_mix_rate=1,
        protect=0.33,
    )

    from scipy.io.wavfile import write

    write("out.wav", rate, wav_data)
