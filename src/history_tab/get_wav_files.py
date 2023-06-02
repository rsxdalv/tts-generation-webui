from src.history_tab.generate_pretty_name import generate_pretty_name
from src.history_tab.generate_relative_date import generate_relative_date
from src.history_tab.parse_time import extract_and_parse_time


import glob
import os


def get_wav_files(directory: str):
    def get_wav_in_dir(directory: str):
        return os.path.join(directory, f"{os.path.basename(directory)}.wav")
    list_of_directories = glob.glob(f"{directory}/*")
    file_date_list = [
        [
            extract_and_parse_time(directory),
            generate_pretty_name(directory),
            generate_relative_date(extract_and_parse_time(directory)),
            get_wav_in_dir(directory),
        ]
        for directory in list_of_directories
    ]
    # order by date
    file_date_list.sort(key=lambda x: x[0], reverse=True)
    return file_date_list


def get_wav_files_img(directory):
    return [file[-1].replace(".wav", ".png") for file in get_wav_files(directory)]