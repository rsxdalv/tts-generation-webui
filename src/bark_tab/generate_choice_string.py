from src.bark_tab.create_voice_string import create_voice_string
from src.get_speaker_gender import get_speaker_gender


import gradio as gr


def generate_choice_string(useV2, language, speaker_id):
    history_prompt = create_voice_string(language, speaker_id, useV2)
    gender = get_speaker_gender(history_prompt)
    return gr.Markdown.update(
        value=f"Chosen voice: {history_prompt}, Gender: {gender}"
    )
