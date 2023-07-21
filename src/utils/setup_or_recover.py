import os


def dummy():
    pass


def env_entry(name, value, comment, null=False):
    return f"# {comment}\n{'# ' if null else ''}{name}={value}\n"


def generate_env(
    *,
    environment_suno_use_small_models: bool = False,
    environment_suno_enable_mps: bool = False,
    environment_suno_offload_cpu: bool = False,
    model_location_hf_env_var: str = "",
    model_location_hf_env_var2: str = "",
    model_location_th_home: str = "",
    model_location_th_xdg: str = "",
):
    def get_suno_env(name):
        return os.environ.get(name, "").lower() in ("true", "1")

    if not environment_suno_use_small_models:
        environment_suno_use_small_models = get_suno_env("SUNO_USE_SMALL_MODELS")
    if not environment_suno_enable_mps:
        environment_suno_enable_mps = get_suno_env("SUNO_ENABLE_MPS")
    if not environment_suno_offload_cpu:
        environment_suno_offload_cpu = get_suno_env("SUNO_OFFLOAD_CPU")

    if not model_location_hf_env_var:
        model_location_hf_env_var = os.environ.get("HUGGINGFACE_HUB_CACHE", "")
    if not model_location_hf_env_var2:
        model_location_hf_env_var2 = os.environ.get("HF_HOME", "")
    if not model_location_th_home:
        model_location_th_home = os.environ.get("TORCH_HOME", "")
    if not model_location_th_xdg:
        model_location_th_xdg = os.environ.get("XDG_CACHE_HOME", "")

    env = "# This file gets updated automatically from the UI\n\n"
    env += env_entry(
        "SUNO_USE_SMALL_MODELS",
        environment_suno_use_small_models,
        "Duplicates small models checkboxes",
    )
    env += env_entry(
        "SUNO_ENABLE_MPS",
        environment_suno_enable_mps,
        "Use MPS when CUDA is unavailable",
    )
    env += env_entry(
        "SUNO_OFFLOAD_CPU", environment_suno_offload_cpu, "Offload GPU models to CPU"
    )

    env += env_entry(
        "HUGGINGFACE_HUB_CACHE",
        model_location_hf_env_var,
        "Environment variable for HuggingFace model location",
        null=not model_location_hf_env_var,
    )

    env += env_entry(
        "HF_HOME",
        model_location_hf_env_var2,
        "Environment variable for HuggingFace model location (alternative)",
        null=not model_location_hf_env_var2,
    )

    env += env_entry(
        "TORCH_HOME",
        model_location_th_home,
        "Default location for Torch Hub models",
        null=not model_location_th_home,
    )

    env += env_entry(
        "XDG_CACHE_HOME",
        model_location_th_xdg,
        "Default location for Torch Hub models (alternative)",
        null=not model_location_th_xdg,
    )

    return env


def write_env(text: str):
    with open(".env", "w") as outfile:
        outfile.write(text)


def setup_or_recover():
    if not os.path.exists("outputs"):
        os.makedirs("outputs")
    if not os.path.exists("favorites"):
        os.makedirs("favorites")
    if not os.path.exists(".env"):
        print("Env file not found. Creating default env.")
        write_env(generate_env())


setup_or_recover()
