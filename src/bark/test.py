from src.bark.generation_tab_bark import generate


def test():
    text_prompt = """
        Hello, my name is Suno. And, uh — and I like pizza. [laughs] 
        But I also have other interests such as playing tic tac toe.
    """

    history_prompt = "en_speaker_0"
    generate(text_prompt, True, history_prompt)
    generate(text_prompt, False, history_prompt)
