import datetime


def get_date():
    now = datetime.datetime.now()
    return now.strftime("%Y-%m-%d_%H-%M-%S")