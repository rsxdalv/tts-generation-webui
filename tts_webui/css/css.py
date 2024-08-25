from tts_webui.bark.bark_css import bark_css
from tts_webui.css.material_symbols_css import material_symbols_css
from tts_webui.history_tab.history_css import history_css
from tts_webui.tortoise.css_tortoise import css_tortoise

def load_css(filename: str):
    with open(filename, "r") as f:
        return f.read()

full_css = ""
full_css += material_symbols_css
full_css += css_tortoise
full_css += history_css
full_css += bark_css
full_css += load_css("src/musicgen/musicgen.css")

# full_css += load_css("src/studio/studio_tab.css")
