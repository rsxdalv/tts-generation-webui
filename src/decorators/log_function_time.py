from src.magnet.utils import Timer


def log_function_time(fn):
    def wrapper(*args, **kwargs):
        with Timer():
            return fn(*args, **kwargs)

    return wrapper
