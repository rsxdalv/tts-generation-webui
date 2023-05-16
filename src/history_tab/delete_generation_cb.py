import os


def delete_generation_cb(refresh):
    def delete_generation(json):
        os.remove(json["filename"])
        os.remove(json["filename_png"])
        os.remove(json["filename_json"])
        os.remove(json["filename_npz"])

        return refresh()

    return delete_generation