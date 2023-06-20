import json


def save_json(filename: str, data):
    import json

    with open(filename, "w") as f:
        json.dump(data, f)
