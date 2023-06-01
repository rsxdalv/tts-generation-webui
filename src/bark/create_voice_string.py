from models.bark.bark.generation import SUPPORTED_LANGS

import os


def create_voice_string(language: str, speaker_id: int, use_v2: bool) -> str:
    history_prompt = f"{SUPPORTED_LANGS[language][1]}_speaker_{speaker_id}"
    if use_v2:
        history_prompt = os.path.join("v2", history_prompt)
    return history_prompt
