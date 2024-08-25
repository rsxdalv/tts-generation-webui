from src.bark.log_generation import middleware_log_generation


def decorator_log_generation(fn):
    def wrapper(*args, **kwargs):
        middleware_log_generation(kwargs)
        return fn(*args, **kwargs)

    return wrapper
