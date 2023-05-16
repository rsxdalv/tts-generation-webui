import datetime


# 2023-05-16_11-45-00
def parse_time(text):
    # extract date and time
    date, time = text.split("_")
    # extract year, month, day
    year, month, day = date.split("-")
    # extract hour, minute, second
    hour, minute, second = time.split("-")
    # create a native date
    return datetime.datetime(int(year), int(month), int(day), int(hour), int(minute), int(second))

# audio__bark__None__2023-05-16_11-45-00__long.wav
def extract_time(filename):
    return filename.split("__")[-1].replace(".wav", "").replace("_long", "")