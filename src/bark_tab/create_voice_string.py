from models.bark.bark.generation import SUPPORTED_LANGS


import os


def create_voice_string(language, speaker_id, useV2):
    history_prompt = f"{SUPPORTED_LANGS[language][1]}_speaker_{speaker_id}"
    if useV2:
        history_prompt = os.path.join("v2", history_prompt)
    return history_prompt
