import os
from typing import Optional


def create_base_filename(title: Optional[str], output_path: str, model: str, date: str) -> str:
    return os.path.join(output_path, f"{date}__{model}__{replace_path_sep(title)}")

def replace_path_sep(title: Optional[str]) -> str:
    return title if title is None else title.replace(os.path.sep, '_')
