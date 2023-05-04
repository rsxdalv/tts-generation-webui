import os


def dummy():
    pass


def generate_env(environment_suno_use_small_models, environment_suno_enable_mps, environment_suno_offload_cpu):
    return f"""
# Duplicates small models checkboxes
SUNO_USE_SMALL_MODELS={environment_suno_use_small_models}
# Use MPS when CUDA is unavailable
SUNO_ENABLE_MPS={environment_suno_enable_mps}
# Offload GPU models to CPU
SUNO_OFFLOAD_CPU={environment_suno_offload_cpu}
"""

def setup_or_recover():
    if not os.path.exists('outputs'):
        os.makedirs('outputs')
    if not os.path.exists('favorites'):
        os.makedirs('favorites')
    if not os.path.exists('.env'):
        print("Env file not found. Creating default env.")
        with open('.env', 'w') as outfile:
            outfile.write(
                generate_env(False, False, False)
            )


setup_or_recover()
