import os


def delete_generation_cb(refresh: callable):
    def delete_generation(json: dict):
        os.remove(json["filename"])
        os.remove(json["filename_png"])
        os.remove(json["filename_json"])
        os.remove(json["filename_npz"])

        return refresh()

    return delete_generation
