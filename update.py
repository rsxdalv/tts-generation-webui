import subprocess


def do(cmd):  # https://stackoverflow.com/a/62986640
    try:
        run = subprocess.run(cmd, shell=True)
        run.check_returncode()
        return run
    except subprocess.CalledProcessError as e:
        try:
            print(
                e.stderr.decode().strip(),
                e.returncode,
            )
        except Exception:
            print(e)
            pass
        raise e


def try_install(requirements, name=None):
    try:
        print(f"Installing {name or requirements} dependencies...")
        do(f"pip install {requirements} torch==2.3.1")
        print(f"Successfully installed {name or requirements} dependencies")
    except Exception:
        print(f"Failed to install {name or requirements} dependencies")


def is_node_installed():
    try:
        print("Checking if node is installed...")
        do("node --version")
        return True
    except Exception:
        print("Node is not installed, skipping node_modules setup")
        return False


def setup_node_modules():
    try:
        print("Installing node_modules...")
        do("cd react-ui && npm install")
        print("Successfully installed node_modules")
        print("Building react-ui...")
        do("cd react-ui && npm run build")
        print("Successfully built react-ui")
    except Exception:
        print("Failed to install node_modules")


def check_if_torch_has_cuda():
    try:
        print("Checking if torch has CUDA...")
        do("python check_cuda.py")
        return True
    except Exception:
        return False


def main():
    print("Legacy installer is almost guaranteed to break installation, including torch+cuda")
    print("For this reason, it is disabled")
    print("It is recommended to use the new installer in a new directory, and leave the existing installation intact")
    print("The new installer can be downloaded from https://github.com/rsxdalv/tts-generation-webui/")
    if input("Do you still want to risk upgrading? [y/N] ").lower() != "y":
        print("Skipping dependencies update")
        return

    print("Updating dependencies... (legacy installer, might break)")
    try_install("-r requirements.txt", "Core Packages, Bark, Tortoise")
    try_install(
        "xformers==0.0.27 --index-url https://download.pytorch.org/whl/cu118",
        "xformers",
    )
    try_install("-r requirements_bark_hubert_quantizer.txt", "Bark Voice Clone")
    try_install("-r requirements_rvc.txt", "RVC")
    try_install("-r requirements_audiocraft.txt", "Audiocraft")
    try_install("-r requirements_styletts2.txt", "StyleTTS")
    try_install("-r requirements_vall_e.txt", "Vall-E-X")
    try_install("-r requirements_maha_tts.txt", "Maha TTS")
    try_install("-r requirements_stable_audio.txt", "Stable Audio")
    # reinstall hydra-core==1.3.2 because of fairseq
    try_install("hydra-core==1.3.2", "hydra-core fix due to fairseq")


    if is_node_installed():
        setup_node_modules()

    if check_if_torch_has_cuda():
        print("Torch has CUDA, skipping reinstall")
    else:
        print(
            "Torch does not have CUDA, assuming CPU mode, installing CPU version of PyTorch"
        )
        do(
            "conda install --force-reinstall -y -k pytorch torchvision torchaudio cpuonly -c pytorch"
        )


if __name__ == "__main__":
    main()
