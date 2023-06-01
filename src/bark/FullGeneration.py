import numpy as np
from typing import Any, TypedDict


class FullGeneration(TypedDict):
    semantic_prompt: np.ndarray
    coarse_prompt: Any
    fine_prompt: Any
