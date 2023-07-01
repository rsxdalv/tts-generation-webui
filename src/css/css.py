from src.bark.bark_css import bark_css
from src.css.material_symbols_css import material_symbols_css
from src.history_tab.history_css import history_css
from src.tortoise.css_tortoise import css_tortoise
from src.utils.load_css import load_css

full_css = ""
full_css += material_symbols_css
full_css += css_tortoise
full_css += history_css
full_css += bark_css
full_css += load_css("src/musicgen/musicgen.css")
full_css += load_css("src/studio/studio_tab.css")
