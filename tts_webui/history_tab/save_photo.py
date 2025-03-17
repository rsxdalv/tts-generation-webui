from PIL import Image


def save_photo(photo: Image.Image, voice_file_name: str):
    photo.save(f"{voice_file_name}".replace(".npz", ".png"))
    return photo
