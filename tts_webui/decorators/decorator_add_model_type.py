def decorator_add_model_type(model_type):
    def wrapper(fn):
        def inner(*args, **kwargs):
            return fn(*args, _type=model_type, **kwargs)

        return inner

    return wrapper
