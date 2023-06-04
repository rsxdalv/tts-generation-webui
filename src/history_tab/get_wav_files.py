from src.history_tab.get_hash_memoized import get_hash_memoized
from src.history_tab.generate_pretty_name import generate_pretty_name
from src.history_tab.generate_relative_date import generate_relative_date
from src.history_tab.parse_time import extract_and_parse_time


import glob
import os
import datetime


def get_wav_files(directory: str):
    def get_wav_in_dir(directory: str):
        return os.path.join(directory, f"{os.path.basename(directory)}.wav")

    list_of_directories = glob.glob(f"{directory}/*")
    file_date_list = [
        [
            extract_and_parse_time(directory),
            generate_pretty_name(directory),
            generate_relative_date(extract_and_parse_time(directory)),  # type: ignore
            get_wav_in_dir(directory),
        ]
        for directory in list_of_directories
    ]
    # order by date
    file_date_list.sort(key=lambda x: x[0], reverse=True)
    return file_date_list


def get_wav_files_img(directory):
    return [file[-1].replace(".wav", ".png") for file in get_wav_files(directory)]


def generate_pretty_name_npz(name: str):
    return name.replace(".npz", "").strip().capitalize()


if __name__ == "__main__":
    print(generate_pretty_name_npz("Alice.npz"))


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


# TODO: add hash column
def get_npz_files_voices(directory: str = "voices"):
    file_list = list(os.scandir(directory))
    data_list = [
        get_npz_file_data(file) for file in file_list if file.name.endswith(".npz")
    ]
    data_list.sort(key=lambda x: x[0], reverse=True)
    return data_list
