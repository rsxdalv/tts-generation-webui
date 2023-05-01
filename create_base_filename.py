import os


def create_base_filename(title, output_path, model, date):
    return os.path.join(output_path, f"audio__{model}__{title}__{date}")
