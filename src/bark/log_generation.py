from src.bark.BarkParams import BarkParams
from typing import TypedDict, Optional

# Add OtherParams as needed
class OtherParams(TypedDict):
    example_field: str


# Function to get the name of the TypedDict
def _get_typed_dict_name(typed_dict: dict) -> Optional[str]:
    if typed_dict.keys() == BarkParams.__annotations__.keys():
        return "BarkParams"
    elif typed_dict.keys() == OtherParams.__annotations__.keys():
        return "OtherParams"
    elif typed_dict.get("_type", None):
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
    kwargs = BarkParams(
        text="I am a robot.",
        text_temp=1.0,
        waveform_temp=1.0,
        history_prompt="",
        output_full=False,
        seed=0,
        max_gen_duration_s=15,
        burn_in_prompt="",
        history_prompt_semantic=None,
    )

    middleware_log_generation(kwargs)
