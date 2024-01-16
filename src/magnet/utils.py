import time
import os
from src.utils.set_seed import set_seed


class Timer:
    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.end_time = time.time()
        elapsed_time = self.end_time - self.start_time
        print("Generated in", "{:.3f}".format(elapsed_time), "seconds")


class Seed:
    def __init__(self, seed):
        self.seed = seed

    def __enter__(self):
        set_seed(self.seed)

    def __exit__(self, exc_type, exc_value, traceback):
        set_seed(-1)
