from typing import Any, TypedDict, Optional


class BarkParams(TypedDict):
    burn_in_prompt: str | Any
    text: str
    history_prompt: str | Any
    history_prompt_semantic: Optional[str | Any]
    text_temp: float
    waveform_temp: float
    output_full: bool
    seed: int
    max_gen_duration_s: int
