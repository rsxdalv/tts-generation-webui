from typing import Union
from src.bark.generate_random_seed import generate_random_seed
from src.utils.set_seed import set_seed


def parse_or_set_seed(seed: Union[str, int, None], index: int) -> int:
    if seed is not None:
        seed = int(seed)
        if seed == -1:
            seed = generate_random_seed()
    indexed_seed = seed + index  # type: ignore
    set_seed(indexed_seed)
    return indexed_seed
