def log_generation(prompt, useV2, text_temp, waveform_temp, use_voice, history_prompt_verbal):
    print("Generating: '''", prompt, "'''")
    print("Parameters: history_prompt:", history_prompt_verbal,
          "text_temp:", text_temp, "waveform_temp:", waveform_temp,
          "useV2:", useV2, "use_voice:", use_voice)