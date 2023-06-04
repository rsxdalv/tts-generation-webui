import numpy as np


def generate_random_seed() -> int:
    return np.random.default_rng().integers(1, 2**32 - 1)
