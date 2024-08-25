import sys


class hide_argv:
    def __enter__(self):
        self.argv = sys.argv
        sys.argv = [""]

    def __exit__(self, *args):
        sys.argv = self.argv