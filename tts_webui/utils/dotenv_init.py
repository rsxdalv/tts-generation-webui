# from dotenv import load_dotenv

try:
    from dotenv import load_dotenv
except ImportError:
    print(
        "Missing core packages (dotenv), the app has not been installed successfully."
    )
    exit(1)


def init():
    load_dotenv()
