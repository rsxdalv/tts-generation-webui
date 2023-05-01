import json


def load_config():
    with open('config.json', 'r') as infile:
        return json.load(infile)
