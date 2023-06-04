class HistorySettings:
    EMPTY = "Empty history"
    VOICE = "or Use a voice:"
    NPZ_FILE = "or Use old generation as history:"

    choices = [
        EMPTY,
        VOICE,
        NPZ_FILE,
    ]


class PromptSplitSettings:
    NONE = "Short prompt (<15s)"
    LINES = "Split prompt by lines"
    LENGTH = "Split prompt by length"

    choices = [
        NONE,
        LINES,
        # LENGTH,
    ]


class LongPromptHistorySettings:
    CONTINUE = "Use old generation as history"
    CONSTANT = "or Use history prompt setting"
    EMPTY = "or Clear history"

    choices = [
        CONTINUE,
        CONSTANT,
        EMPTY,
    ]
