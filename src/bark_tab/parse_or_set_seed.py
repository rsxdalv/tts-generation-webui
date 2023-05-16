from src.bark_tab.generate_random_seed import generate_random_seed
from src.set_seed import set_seed

def parse_or_set_seed(seed, index):
    if seed is not None:
        seed = int(seed)
        if seed == -1:
            seed = generate_random_seed()
    set_seed(seed + index)
    return seed
