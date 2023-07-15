import os


def dummy():
    pass


def env_entry(name, value, comment):
    return f"# {comment}\n{name}={value}\n"


def generate_env(
    environment_suno_use_small_models: bool,
    environment_suno_enable_mps: bool,
    environment_suno_offload_cpu: bool,
):
    env = "# This file gets updated automatically from the UI"
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

    return env


def setup_or_recover():
    if not os.path.exists("outputs"):
        os.makedirs("outputs")
    if not os.path.exists("favorites"):
        os.makedirs("favorites")
    if not os.path.exists(".env"):
        print("Env file not found. Creating default env.")
        with open(".env", "w") as outfile:
            outfile.write(generate_env(False, False, False))


setup_or_recover()
