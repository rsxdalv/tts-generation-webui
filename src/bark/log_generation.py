from src.bark.FinalGenParams import FinalGenParams


class LogGenerationParams(FinalGenParams):
    history_prompt_verbal: str


def log_generation(
    text: str, text_temp: float, waveform_temp: float, history_prompt_verbal: str, **_
):
    print("Generating: '''", text, "'''")
    print(
        "Parameters: history_prompt:",
        history_prompt_verbal,
        "text_temp:",
        text_temp,
        "waveform_temp:",
        waveform_temp,
    )


if __name__ == "__main__":
    kwargs = LogGenerationParams(
        text="I am a robot.",
        text_temp=1.0,
        waveform_temp=1.0,
        history_prompt="",
        history_prompt_verbal="",
        output_full=False,
    )

    log_generation(**kwargs)
