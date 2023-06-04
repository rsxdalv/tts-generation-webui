from typing import Any, TypedDict


class FinalGenParams(TypedDict):
    text: str
    history_prompt: str | Any
    text_temp: float
    waveform_temp: float
    output_full: bool
