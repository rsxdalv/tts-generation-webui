from ..bark.FullGeneration import FullGeneration

import numpy as np

from typing import Any, Callable, Dict

CallbackSaveGeneration = Callable[
    [FullGeneration, np.ndarray, Dict[str, str], Dict[str, Any]],
    None
]
