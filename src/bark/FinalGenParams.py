from typing import TypedDict


class FinalGenParams(TypedDict):
    text: str
    history_prompt: str
    text_temp: float
    waveform_temp: float
    output_full: bool
