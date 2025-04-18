def _get_typed_dict_name(typed_dict: dict) -> str:
    if typed_dict.get("_type", None):
        return typed_dict["_type"].capitalize()
    return "Params"


def custom_repr(value):
    if isinstance(value, dict):
        return "dict"
    return repr(value)


def StringifyParams(x):
    params = ",\n    ".join(f"{k}={custom_repr(v)}" for k, v in x.items())
    return f"{_get_typed_dict_name(x)}(\n    {params}\n)"


def middleware_log_generation(params: dict):
    print("Generating: '''", params["text"], "'''")
    print(StringifyParams(params))


if __name__ == "__main__":
    kwargs = {
        "text": "I am a robot.",
        "text_temp": 1.0,
        "waveform_temp": 1.0,
        "history_prompt": "",
        "output_full": False,
        "seed": 0,
        "max_length": 15,
        "burn_in_prompt": "",
        "history_prompt_semantic": None,
    }

    middleware_log_generation(kwargs)
