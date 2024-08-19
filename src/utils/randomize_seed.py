import numpy as np


def randomize_seed(seed, randomize_seed):
    if randomize_seed:
        return np.random.randint(0, 2**32 - 1, dtype=np.uint32)
    else:
        return int(seed)
