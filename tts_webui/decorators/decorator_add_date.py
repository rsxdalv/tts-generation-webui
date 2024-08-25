from datetime import datetime


def decorator_add_date(fn):
    def wrapper(*args, **kwargs):
        result_dict = fn(*args, **kwargs)
        result_dict["date"] = datetime.now()
        return result_dict

    return wrapper
