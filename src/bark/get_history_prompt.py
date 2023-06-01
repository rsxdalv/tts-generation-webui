from src.bark.create_voice_string import create_voice_string


def get_history_prompt(language: str, speaker_id: int, useV2: bool, history_prompt: str, use_voice: bool):
    if history_prompt is None:
        history_prompt = create_voice_string(
            language, speaker_id, useV2) if use_voice else None
        history_prompt_verbal = history_prompt or "None"
    else:
        history_prompt_verbal = history_prompt if isinstance(
            history_prompt, str) else "continued_generation"

    return history_prompt, history_prompt_verbal
