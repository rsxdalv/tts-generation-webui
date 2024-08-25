from typing import Optional, Dict
from tts_webui.bark.create_voice_string import create_voice_string


def get_history_prompt(
    language: Optional[str],
    speaker_id: Optional[int],
    useV2: bool,
    history_prompt: Optional[str | Dict],
    use_voice: bool,
):
    if history_prompt is None:
        return create_voice_string(language, speaker_id, useV2) if use_voice else None
    return history_prompt
