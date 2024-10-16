from tts_webui.utils.manage_model_state import manage_model_state


@manage_model_state("vocos")
def get_vocos_model(model_name="charactr/vocos-encodec-24khz"):
    from vocos import Vocos

    return Vocos.from_pretrained(model_name)
