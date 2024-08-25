def get_filenames(base_filename: str):
    filename = f"{base_filename}.wav"
    filename_png = f"{base_filename}.png"
    filename_json = f"{base_filename}.json"
    filename_npz = f"{base_filename}.npz"
    return filename, filename_png, filename_json, filename_npz
