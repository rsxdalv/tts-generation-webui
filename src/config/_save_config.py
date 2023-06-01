import json


def _save_json(filename, data):
    with open(filename, 'w') as outfile:
        json.dump(data, outfile, indent=2)


def _save_config(data):
    _save_json('config.json', data)
