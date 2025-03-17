from typing import Union
from tts_webui.bark.generate_random_seed import generate_random_seed
from tts_webui.utils.set_seed import set_seed


def parse_or_generate_seed(seed: Union[str, int, None], index: int) -> int:
    if seed is not None:
        seed = int(seed)
        if seed == -1:
            seed = generate_random_seed()
    indexed_seed = seed + index  # type: ignore
    return indexed_seed


def parse_or_set_seed(seed: Union[str, int, None], index: int) -> int:
    seed = parse_or_generate_seed(seed, index)
    set_seed(seed)
    return seed
