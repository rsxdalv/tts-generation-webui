import os
import datetime

from tts_webui.bark.voices.get_hash_memoized import get_hash_memoized
from tts_webui.history_tab.generate_relative_date import generate_relative_date


def get_npz_files_voices(directory: str = "voices"):

    def generate_pretty_name_npz(name: str):
        return name.replace(".npz", "").strip().capitalize()

    def get_npz_file_data(file: os.DirEntry):
        date = datetime.datetime.fromtimestamp(file.stat().st_mtime)
        # remove milliseconds
        date = date.replace(microsecond=0)
        return [
            date,
            generate_pretty_name_npz(file.name),
            generate_relative_date(date),
            get_hash_memoized(file.path),
            file.path,
        ]

    file_list = list(os.scandir(directory))
    data_list = [
        get_npz_file_data(file) for file in file_list if file.name.endswith(".npz")
    ]
    data_list.sort(key=lambda x: x[0], reverse=True)
    return data_list
