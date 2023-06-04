# from bark.FullGeneration import FullGeneration
from typing import Any, Dict
import numpy as np


def callback_save_generation(
    # full_generation: FullGeneration,
    full_generation: Any,
    audio_array: np.ndarray,
    files: Dict[str, str],
    metadata: Dict[str, Any],
) -> None:
    pass
