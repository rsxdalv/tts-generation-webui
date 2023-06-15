import numpy as np
import json
from typing import Any, Dict, List

import subprocess
import ffmpeg


def callback_save_generation_musicgen(
    audio_array: np.ndarray,
    files: Dict[str, str],
    metadata: Dict[str, Any],
    SAMPLE_RATE: int,
) -> None:
    print("Saving generation to", files.get("ogg"))

    filename = files.get("ogg")
    input_data = audio_array.tobytes()
    metadata["prompt"] = double_escape_quotes(metadata["prompt"])
    metadata["prompt"] = double_escape_newlines(metadata["prompt"])
    metadata_str = json.dumps(metadata, ensure_ascii=False)

    pipe_input = ffmpeg.input("pipe:", format="f32le", ar=str(SAMPLE_RATE))
    metadata_filename = files.get("ogg") + ".ffmetadata.ini"  # type: ignore
    with open(metadata_filename, "w", encoding="utf-8") as f:
        f.write(
            f""";FFMETADATA1
comment={metadata_str}
"""
        )

    metadata_input = ffmpeg.input(metadata_filename)

    args = (
        ffmpeg.output(
            pipe_input,
            metadata_input,
            filename,
            format="ogg",
            map_metadata=f"1",
            loglevel="error",
        )
        .overwrite_output()
        .get_args()
    )

    def find_map_1_index(args: List[str]) -> int:
        return next(
            (i for i in range(len(args)) if args[i] == "-map" and args[i + 1] == "1"), 0
        )

    def remove_map_1(args: List[str]) -> List[str]:
        index = find_map_1_index(args)
        return args[:index] + args[index + 2 :] if index > 0 else args

    args = remove_map_1(args)

    p = subprocess.Popen(
        ["ffmpeg"] + args, stdin=subprocess.PIPE, stderr=subprocess.PIPE
    )
    output_data = p.communicate(input=input_data)
    # wait for the subprocess to exit
    p.wait()
    # print(p.returncode)
    # Show if success
    if p.returncode == 0:
        print("Saved generation to", files.get("ogg"))
    else:
        print("Failed to save generation to", files.get("ogg"))
        print("ffmpeg args:", args)
        print(output_data[0])
        # print(output_data[1])
        # print b'ffmpeg
        print("ffmpeg stderr:", output_data[1].decode("utf-8"))


def double_escape_newlines(prompt):
    return prompt.replace("\n", "\\\n")


def double_escape_quotes(prompt):
    return prompt.replace('"', '\\"')


if __name__ == "__main__":
    wav_input = "./temp/ogg-vs-npz/audio__bark__None__2023-05-29_10-12-46.wav"
    args_output = "./temp/ogg-vs-npz/audio__bark__None__2023-05-29_10-12-46.ogg"

    audio_array = np.load(wav_input)

    metadata = {
        "_version": "0.0.1",
        "_hash_version": "0.0.2",
        "_type": "bark",
        "is_big_semantic_model": False,
        "is_big_coarse_model": False,
        "is_big_fine_model": True,
        "prompt": "♪ これはテストです。",
        "language": None,
        "speaker_id": None,
        "hash": "04d5509a7fd1fabda167e219812ee617",
        "history_prompt": "None",
        "history_prompt_npz": None,
        "history_hash": "6adf97f83acf6453d4a6a4b1070f3754",
        "text_temp": 0.4,
        "waveform_temp": 0.85,
        "date": "2023-06-09_09-40-36",
        "seed": "1542369587",
    }

    callback_save_generation_musicgen(
        audio_array, {"ogg": args_output}, metadata, SAMPLE_RATE=22050
    )

    b = ffmpeg.probe(args_output)
    import json

    print(json.dumps(b, indent=4, sort_keys=True))

    x = b["streams"][0]["tags"]["comment"]
    print(x)
    b = json.loads(x)
    print(b)
    print(b["prompt"])
