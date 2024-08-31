import numpy as np
from typing import Any, TypedDict


class FullGeneration(TypedDict):
    semantic_prompt: np.ndarray
    coarse_prompt: np.ndarray  # shape (2, N), type int16/int64
    fine_prompt: np.ndarray  # shape (8, N), type int16/int64
