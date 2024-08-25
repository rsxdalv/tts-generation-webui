from bark.generation import SUPPORTED_LANGS
from typing import Union
import os


def create_voice_string(
    language: str, speaker_id: Union[int, str], use_v2: bool
) -> str:
    history_prompt = f"{SUPPORTED_LANGS[language][1]}_speaker_{speaker_id}"  # type: ignore
    if use_v2:
        history_prompt = os.path.join("v2", history_prompt)
    return history_prompt
