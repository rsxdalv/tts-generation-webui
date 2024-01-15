import gradio as gr
import torchaudio
from transformers import AutoProcessor, SeamlessM4Tv2Model

model = None

def get_model():
    global model
    if not model:
        model = SeamlessM4Tv2Model.from_pretrained("facebook/seamless-m4t-v2-large")
    return model

processor = None

def get_processor():
    global processor
    if not processor:
        processor = AutoProcessor.from_pretrained("facebook/seamless-m4t-v2-large")
    return processor

def from_text(text, src_lang, tgt_lang):
    model = get_model()
    processor = get_processor()
    text_inputs = processor(text=text, src_lang=src_lang, return_tensors="pt")
    audio_array_from_text = model.generate(**text_inputs, tgt_lang=tgt_lang)[0].cpu().squeeze()
    return audio_array_from_text


# from audio
# audio, orig_freq = torchaudio.load("https://www2.cs.uic.edu/~i101/SoundFiles/preamble10.wav")
# audio = torchaudio.functional.resample(audio, orig_freq=orig_freq, new_freq=16_000) # must be a 16 kHz waveform array
# audio_inputs = processor(audios=audio, return_tensors="pt")
# audio_array_from_audio = model.generate(**audio_inputs, tgt_lang="rus")[0].cpu().squeeze()

# torchaudio.save(
#     <path_to_save_audio>,
#     audio_array_from_audio,  # or audio_array_from_text
#     sample_rate=model.config.sampling_rate,
# )

language_code_to_name = {
    "afr": "Afrikaans",
    "amh": "Amharic",
    "arb": "Modern Standard Arabic",
    "ary": "Moroccan Arabic",
    "arz": "Egyptian Arabic",
    "asm": "Assamese",
    "ast": "Asturian",
    "azj": "North Azerbaijani",
    "bel": "Belarusian",
    "ben": "Bengali",
    "bos": "Bosnian",
    "bul": "Bulgarian",
    "cat": "Catalan",
    "ceb": "Cebuano",
    "ces": "Czech",
    "ckb": "Central Kurdish",
    "cmn": "Mandarin Chinese",
    "cmn_Hant": "Traditional Mandarin Chinese",
    "cym": "Welsh",
    "dan": "Danish",
    "deu": "German",
    "ell": "Greek",
    "eng": "English",
    "est": "Estonian",
    "eus": "Basque",
    "fin": "Finnish",
    "fra": "French",
    "gaz": "West Central Oromo",
    "gle": "Irish",
    "glg": "Galician",
    "guj": "Gujarati",
    "heb": "Hebrew",
    "hin": "Hindi",
    "hrv": "Croatian",
    "hun": "Hungarian",
    "hye": "Armenian",
    "ibo": "Igbo",
    "ind": "Indonesian",
    "isl": "Icelandic",
    "ita": "Italian",
    "jav": "Javanese",
    "jpn": "Japanese",
    "kam": "Kamba",
    "kan": "Kannada",
    "kat": "Georgian",
    "kaz": "Kazakh",
    "kea": "Kabuverdianu",
    "khk": "Halh Mongolian",
    "khm": "Khmer",
    "kir": "Kyrgyz",
    "kor": "Korean",
    "lao": "Lao",
    "lit": "Lithuanian",
    "ltz": "Luxembourgish",
    "lug": "Ganda",
    "luo": "Luo",
    "lvs": "Standard Latvian",
    "mai": "Maithili",
    "mal": "Malayalam",
    "mar": "Marathi",
    "mkd": "Macedonian",
    "mlt": "Maltese",
    "mni": "Meitei",
    "mya": "Burmese",
    "nld": "Dutch",
    "nno": "Norwegian Nynorsk",
    "nob": "Norwegian Bokm\u00e5l",
    "npi": "Nepali",
    "nya": "Nyanja",
    "oci": "Occitan",
    "ory": "Odia",
    "pan": "Punjabi",
    "pbt": "Southern Pashto",
    "pes": "Western Persian",
    "pol": "Polish",
    "por": "Portuguese",
    "ron": "Romanian",
    "rus": "Russian",
    "slk": "Slovak",
    "slv": "Slovenian",
    "sna": "Shona",
    "snd": "Sindhi",
    "som": "Somali",
    "spa": "Spanish",
    "srp": "Serbian",
    "swe": "Swedish",
    "swh": "Swahili",
    "tam": "Tamil",
    "tel": "Telugu",
    "tgk": "Tajik",
    "tgl": "Tagalog",
    "tha": "Thai",
    "tur": "Turkish",
    "ukr": "Ukrainian",
    "urd": "Urdu",
    "uzn": "Northern Uzbek",
    "vie": "Vietnamese",
    "xho": "Xhosa",
    "yor": "Yoruba",
    "yue": "Cantonese",
    "zlm": "Colloquial Malay",
    "zsm": "Standard Malay",
    "zul": "Zulu",

    "fuv": "Nigerian Fulfulde",
    "gle": "Irish",
    "sat": "Santali",
    "pbt": "Southern Pashto",
    "zsm": "Standard Malay",
    "xho": "Xhosa",
    "kea": "Kabuverdianu",
}

def get_language_name(language_code):
    return language_code_to_name[language_code]

text_source_codes = ["afr","amh","arb","ary","arz","asm","azj","bel","ben","bos","bul","cat","ceb","ces","ckb","cmn","cmn_Hant","cym","dan","deu","ell","eng","est","eus","fin","fra","fuv","gaz","gle","glg","guj","heb","hin","hrv","hun","hye","ibo","ind","isl","ita","jav","jpn","kan","kat","kaz","khk","khm","kir","kor","lao","lit","lug","luo","lvs","mai","mal","mar","mkd","mlt","mni","mya","nld","nno","nob","npi","nya","ory","pan","pbt","pes","pol","por","ron","rus","slk","slv","sna","snd","som","spa","srp","swe","swh","tam","tel","tgk","tgl","tha","tur","ukr","urd","uzn","vie","yor","yue","zsm","zul"]
text_target_codes = ["afr","amh","arb","ary","arz","asm","azj","bel","ben","bos","bul","cat","ceb","ces","ckb","cmn","cmn_Hant","cym","dan","deu","ell","eng","est","eus","fin","fra","fuv","gaz","gle","glg","guj","heb","hin","hrv","hun","hye","ibo","ind","isl","ita","jav","jpn","kan","kat","kaz","khk","khm","kir","kor","lao","lit","lug","luo","lvs","mai","mal","mar","mkd","mlt","mni","mya","nld","nno","nob","npi","nya","ory","pan","pbt","pes","pol","por","ron","rus","slk","slv","sna","snd","som","spa","srp","swe","swh","tam","tel","tgk","tgl","tha","tur","ukr","urd","uzn","vie","yor","yue","zsm","zul"]
speech_source_codes = ["afr","amh","arb","ary","arz","asm","ast","azj","bel","ben","bos","bul","cat","ceb","ces","ckb","cmn","cmn_Hant","cym","dan","deu","ell","eng","est","eus","fin","fra","fuv","gaz","gle","glg","guj","heb","hin","hrv","hun","hye","ibo","ind","isl","ita","jav","jpn","kam","kan","kat","kaz","kea","khk","khm","kir","kor","lao","lit","ltz","lug","luo","lvs","mai","mal","mar","mkd","mlt","mni","mya","nld","nno","nob","npi","nya","oci","ory","pan","pbt","pes","pol","por","ron","rus","slk","slv","sna","snd","som","spa","srp","swe","swh","tam","tel","tgk","tgl","tha","tur","ukr","urd","uzn","vie","xho","yor","yue","zlm","zul"]
speech_target_codes = ["arb","ben","cat","ces","cmn","cmn_Hant","cym","dan","deu","eng","est","fin","fra","hin","ind","ita","jpn","kor","mlt","nld","pes","pol","por","ron","rus","slk","spa","swe","swh","tel","tgl","tha","tur","ukr","urd","uzn","vie"]

text_source_languages = [get_language_name(code) for code in text_source_codes]
text_target_languages = [get_language_name(code) for code in text_target_codes]
speech_source_languages = [get_language_name(code) for code in speech_source_codes]
speech_target_languages = [get_language_name(code) for code in speech_target_codes]


def seamless_translate(text, src_lang_name, tgt_lang_name):
    model = get_model()
    processor = get_processor()
    src_lang = text_source_codes[text_source_languages.index(src_lang_name)]
    tgt_lang = speech_target_codes[speech_target_languages.index(tgt_lang_name)]
    text_inputs = processor(text=text, src_lang=src_lang, return_tensors="pt")
    audio_array_from_text = model.generate(**text_inputs, tgt_lang=tgt_lang)[0].cpu().squeeze()
    sample_rate = model.config.sampling_rate
    return sample_rate, audio_array_from_text.numpy()

def seamless_ui():
    gr.Markdown(
        """
    # Seamless Demo
    To use it, simply enter your text, and click "Translate".
    The model will translate the text into the target language, and then synthesize the translated text into speech.
    It uses the [SeamlessM4Tv2Model](https://huggingface.co/facebook/seamless-m4t-v2-large) model from HuggingFace.
    """
    )
    with gr.Row(equal_height=False):
        with gr.Column():
            # seamless_input = Joutai.singleton.seamless_input
            # seamless_input.render()
            seamless_input = gr.Textbox(lines=2, label="Input Text")
            source_language = gr.Dropdown(
                choices=text_source_languages, # type: ignore
                label="Source Language",
                default="eng",
                type="value",
                allow_multiple=False,
                allow_nan=False,
                allow_empty=False,
                allow_duplicate=False,
                allow_update=False,
                order=None,
                live=False,
            )
            target_language = gr.Dropdown(
                choices=speech_target_languages, # type: ignore
                label="Target Language",
                default="cmn",
                type="value",
                allow_multiple=False,
                allow_nan=False,
                allow_empty=False,
                allow_duplicate=False,
                allow_update=False,
                order=None,
                live=False,
            )
            button = gr.Button("Translate")

        with gr.Column():
            # seamless_output = Joutai.singleton.seamless_output
            # seamless_output.render()
            seamless_output = gr.Audio(label="Output Audio")
    button.click(
        inputs=[
            seamless_input,
            source_language,
            target_language,
        ],
        outputs=seamless_output,
        fn=seamless_translate,
        api_name="seamless",
    )

def seamless_tab():
    with gr.Tab("SeamlessM4Tv2Model Demo", id="seamless"):
        seamless_ui()
