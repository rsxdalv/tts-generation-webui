import json


def generate_and_save_metadata(prompt, language, speaker_id, text_temp, waveform_temp, seed, filename, date, filename_png, filename_json, history_prompt_npz, filename_npz, history_prompt):
    metadata = {
        "prompt": prompt,
        "language": language,
        "speaker_id": speaker_id,
        "history_prompt": history_prompt,
        "history_prompt_npz": history_prompt_npz,
        "text_temp": text_temp,
        "waveform_temp": waveform_temp,
        "date": date,
        "seed": str(seed),
        "filename": filename,
        "filename_png": filename_png,
        "filename_json": filename_json,
        "filename_npz": filename_npz,
    }
    with open(filename_json, "w") as outfile:
        json.dump(metadata, outfile, indent=2)

    return metadata
