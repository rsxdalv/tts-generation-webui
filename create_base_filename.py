import os


def create_base_filename(title, output_path, model, date):
    return os.path.join(output_path, f"audio__{model}__{replace_path_sep(title)}__{date}")

def replace_path_sep(title):
    return title.replace(os.path.sep, '_')
