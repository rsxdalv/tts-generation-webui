from typing import Dict, Optional, Union

import numpy as np

from bark import text_to_semantic, semantic_to_waveform
from bark.generation import SEMANTIC_RATE_HZ

semantic_cache = {}


def custom_generate_audio(
    text: str,
    burn_in_prompt: Optional[str] = None,
    history_prompt: Optional[Union[Dict, str]] = None,
    history_prompt_semantic: Optional[Union[Dict, str]] = None,
    text_temp: float = 0.7,
    waveform_temp: float = 0.7,
    silent: bool = False,
    output_full: bool = False,
    max_gen_duration_s=None,
    cache_semantic=False,  # Experimental
):
    """Generate audio array from input text.

    Args:
        text: text to be turned into audio
        history_prompt: history choice for audio cloning
        text_temp: generation temperature (1.0 more diverse, 0.0 more conservative)
        waveform_temp: generation temperature (1.0 more diverse, 0.0 more conservative)
        silent: disable progress bar
        output_full: return full generation to be used as a history prompt

    Returns:
        numpy audio array at sample frequency 24khz
    """
    history_prompt_semantic = history_prompt_semantic or history_prompt
    # if cache_semantic:
    #     global semantic_cache
    #     if semantic_cache is None:
    #         semantic_cache = {}
    #     if text in semantic_cache:
    #         semantic_tokens = semantic_cache[text]
    #     else:
    #         semantic_tokens = text_to_semantic(
    #             text,
    #             history_prompt=history_prompt_semantic,
    #             temp=text_temp,
    #             silent=silent,
    #         )
    #         semantic_cache[text] = semantic_tokens
    # else:
    if burn_in_prompt is not None and len(burn_in_prompt) > 0:
        burn_in_prompt_semantic = text_to_semantic(
            burn_in_prompt,
            history_prompt=history_prompt_semantic,
            temp=text_temp,
            silent=silent,
        )
        history_prompt_semantic = {
            "coarse_prompt": None,
            "fine_prompt": None,
            "semantic_prompt": burn_in_prompt_semantic,
        }

    semantic_tokens = text_to_semantic(
        text,
        history_prompt=history_prompt_semantic,
        temp=text_temp,
        silent=silent,
    )

    out = semantic_to_waveform(
        semantic_tokens,
        history_prompt=history_prompt,
        temp=waveform_temp,
        silent=silent,
        output_full=output_full,
        max_gen_duration_s=max_gen_duration_s,
    )
    if output_full:
        full_generation, audio_arr = out
        if max_gen_duration_s is not None:
            semantic_tokens = semantic_tokens[
                : int(max_gen_duration_s * SEMANTIC_RATE_HZ)
            ]
            full_generation["semantic_prompt"] = semantic_tokens
        return full_generation, audio_arr
    else:
        audio_arr = out
    return audio_arr
