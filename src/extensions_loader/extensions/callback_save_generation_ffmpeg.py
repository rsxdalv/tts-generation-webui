# from bark.FullGeneration import FullGeneration
import numpy as np
import json
from typing import Any, Dict
from models.bark.bark.generation import SAMPLE_RATE

import subprocess
import ffmpeg

import base64


def ndarray_to_base64(arr):
    # Convert ndarray to bytes
    arr_bytes = arr.tobytes()
    # Encode bytes to base64
    return base64.b64encode(arr_bytes).decode('utf-8')


def decode_base64_to_ndarray(base64_string):
    # Decode base64 string to bytes
    decoded_bytes = base64.b64decode(base64_string)
    # Convert bytes to NumPy ndarray
    return np.frombuffer(decoded_bytes, dtype=np.int16)


def callback_save_generation(
        # full_generation: FullGeneration,
        full_generation: Any,
        audio_array: np.ndarray,
        files: Dict[str, str],
        metadata: Dict[str, Any]
) -> None:
    print("Saving generation to", files.get("ogg"))

    attach_generation_meta(
        full_generation, "semantic_prompt", metadata
    )
    attach_generation_meta(
        full_generation, "coarse_prompt", metadata
    )
    filename = files.get("ogg")
    input_data = audio_array.tobytes()
    metadata_str = json.dumps(metadata)

    args = (
        ffmpeg.input('pipe:', format='f32le', ar=str(SAMPLE_RATE))
        .output(
            filename, format='ogg', metadata=f"comment={metadata_str}"
        )
        .overwrite_output()
        .get_args()
    )
    p = subprocess.Popen(['ffmpeg'] + args, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    output_data = p.communicate(input=input_data)[0]
    print(output_data)
    # wait for the subprocess to exit
    p.wait()
    print(p.returncode)

    print("Saved generation to", files.get("ogg"))


def attach_generation_meta(full_generation, arg1, metadata):
    semantic_prompt: np.ndarray = full_generation[arg1]
    semantic_prompt_base64 = ndarray_to_base64(semantic_prompt)
    metadata[arg1] = semantic_prompt_base64
