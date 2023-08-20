import subprocess


def do(cmd):  # https://stackoverflow.com/a/62986640
    try:
        run = subprocess.run(cmd, shell=True)
        run.check_returncode()
        return run
    except subprocess.CalledProcessError as e:
        print(e.stderr.decode().strip())
        raise e


def try_install(requirements, name=None):
    try:
        print(f"Installing {name or requirements} dependencies...")
        do(f"pip install -r {requirements}")
        print(f"Successfully installed {name or requirements} dependencies")
    except Exception:
        print(f"Failed to install {name or requirements} dependencies")


def main():
    print("Updating dependencies...")
    try_install("requirements_audiocraft.txt", "musicgen, audiocraft")
    try_install("requirements_bark_hubert_quantizer.txt", "Bark Voice Clone, bark-hubert-quantizer")
    try_install("requirements_rvc.txt", "RVC")
    # hydracore fix because of fairseq
    do("pip install hydra-core==1.3.2")


if __name__ == "__main__":
    main()
