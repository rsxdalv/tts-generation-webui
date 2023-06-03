def log_generation(prompt: str, useV2: bool, text_temp: float, waveform_temp: float, use_voice: bool, history_prompt_verbal: str):
    print("Generating: '''", prompt, "'''")
    print("Parameters: history_prompt:", history_prompt_verbal,
          "text_temp:", text_temp, "waveform_temp:", waveform_temp,
          "useV2:", useV2, "use_voice:", use_voice)
