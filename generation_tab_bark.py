import os
from create_base_filename import create_base_filename
from gen_tortoise import generate_tortoise_
from get_date import get_date
from get_speaker_gender import get_speaker_gender
from models.bark.bark import SAMPLE_RATE, generate_audio
from scipy.io.wavfile import write as write_wav
import json
from models.bark.bark.generation import SUPPORTED_LANGS
import gradio as gr
from save_waveform_plot import save_waveform_plot
from model_manager import model_manager
from config import config

value_empty_history = "Empty history"
value_use_last_gen = "or Use last generation as history"
value_use_voice = "or Use a voice:"
history_settings = [value_empty_history, value_use_last_gen, value_use_voice]

last_generation = None


def create_voice_string(language, speaker_id, useV2):
    history_prompt = f"{SUPPORTED_LANGS[language][1]}_speaker_{speaker_id}"
    if useV2:
        history_prompt = os.path.join("v2", history_prompt)
    return history_prompt


def generate_choice_string(useV2, language, speaker_id):
    history_prompt = create_voice_string(language, speaker_id, useV2)
    gender = get_speaker_gender(history_prompt)
    return gr.Markdown.update(
        value=f"Chosen voice: {history_prompt}, Gender: {gender}"
    )


def get_history_prompt_verbal(history_prompt, use_last_generation):
    return "last_generation" if use_last_generation else (history_prompt or "None")

def generate(prompt, history_setting, language=None, speaker_id=0, useV2=False, text_temp=0.7, waveform_temp=0.7):
    if not model_manager.models_loaded:
        model_manager.reload_models(config)

    use_voice = history_setting == value_use_voice
    use_last_generation = history_setting == value_use_last_gen

    global last_generation
    if use_last_generation and last_generation is not None:
        history_prompt = last_generation
    else:
        history_prompt = create_voice_string(
            language, speaker_id, useV2) if use_voice else None

    history_prompt_verbal = get_history_prompt_verbal(history_prompt, use_last_generation)

    print("Generating:", prompt, "history_prompt:", history_prompt_verbal,
          "text_temp:", text_temp, "waveform_temp:", waveform_temp,
          "useV2:", useV2, "use_voice:", use_voice, "use_last_generation", use_last_generation)
    full_generation, audio_array = generate_audio(
        prompt, history_prompt=history_prompt, text_temp=text_temp, waveform_temp=waveform_temp, output_full=True)

    last_generation = full_generation

    model = "bark"
    date = get_date()
    base_filename = create_base_filename(
        history_prompt_verbal, "outputs", model, date)
    filename = f"{base_filename}.wav"
    write_wav(filename, SAMPLE_RATE, audio_array)
    filename_png = f"{base_filename}.png"
    save_waveform_plot(audio_array, filename_png)

    filename_json = f"{base_filename}.json"
    # Generate metadata for the audio file
    metadata = {
        "prompt": prompt,
        "language": SUPPORTED_LANGS[language][0] if use_voice else None,
        "speaker_id": speaker_id if use_voice else None,
        "history_prompt": history_prompt_verbal,
        "text_temp": text_temp,
        "waveform_temp": waveform_temp,
        "date": date,
        "filename": filename,
        "filename_png": filename_png,
        "filename_json": filename_json,
    }
    with open(filename_json, "w") as outfile:
        json.dump(metadata, outfile, indent=2)

    return [filename, filename_png]


def generate_multi(count=1):
    def gen(prompt, history_setting, language=None, speaker_id=0, useV2=False, text_temp=0.7, waveform_temp=0.7):
        filenames = []
        for i in range(count):
            filename, filename_png = generate(
                prompt, history_setting, language, speaker_id, useV2, text_temp=text_temp, waveform_temp=waveform_temp)
            filenames.extend((filename, filename_png))
        return filenames
    return gen


def generation_tab_bark():
    with gr.Tab("Generation (Bark)"):
        history_setting = gr.Radio(
            history_settings,
            value="Empty history",
            type="value",
            label="History Prompt (voice) setting:"
        )

        with gr.Row():
            useV2 = gr.Checkbox(
                label="Use V2", value=False, visible=False)
            choice_string = gr.Markdown("Chosen voice: en_speaker_0, Gender: Unknown", visible=False)

        languages = [lang[0] for lang in SUPPORTED_LANGS]
        languageRadio = gr.Radio(languages, type="index", show_label=False,
                                 value="English", visible=False)

        speaker_ids = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        speakerIdRadio = gr.Radio(speaker_ids, type="value",
                                  label="Speaker ID", value="0", visible=False)

        # Show the language and speakerId radios only when useHistory is checked
        history_setting.change(
            fn=lambda choice: [
                gr.Radio.update(visible=(choice == value_use_voice)),
                gr.Radio.update(visible=(choice == value_use_voice)),
                gr.Checkbox.update(visible=(choice == value_use_voice)),
                gr.Markdown.update(visible=(choice == value_use_voice)),
            ],
            inputs=[history_setting],
            outputs=[languageRadio, speakerIdRadio, useV2, choice_string])

        with gr.Row():
            text_temp = gr.Slider(label="Text temperature",
                                  value=0.7, minimum=0.0, maximum=1.0, step=0.1)
            waveform_temp = gr.Slider(
                label="Waveform temperature", value=0.7, minimum=0.0, maximum=1.0, step=0.1)

        prompt = gr.Textbox(label="Prompt", lines=3,
                            placeholder="Enter text here...")

        inputs = [
            prompt,
            history_setting,
            languageRadio,
            speakerIdRadio,
            useV2,
            text_temp,
            waveform_temp
        ]

        voice_inputs = [
            useV2,
            languageRadio,
            speakerIdRadio
        ]

        for i in voice_inputs:
            i.change(
                fn=generate_choice_string,
                inputs=voice_inputs,
                outputs=[choice_string])

        with gr.Row():
            audio_1 = gr.Audio(type="filepath", label="Generated audio")
            audio_2 = gr.Audio(
                type="filepath", label="Generated audio", visible=False)
            audio_3 = gr.Audio(
                type="filepath", label="Generated audio", visible=False)

        with gr.Row():
            image_1 = gr.Image(label="Waveform")
            image_2 = gr.Image(label="Waveform", visible=False)
            image_3 = gr.Image(label="Waveform", visible=False)

        outputs = [audio_1, image_1]
        outputs2 = [audio_2, image_2]
        outputs3 = [audio_3, image_3]
        # examples = [
        #     ["The quick brown fox jumps over the lazy dog."],
        #     ["To be or not to be, that is the question."],
        #     ["In a hole in the ground there lived a hobbit."],
        #     ["This text uses a history prompt, resulting in a more predictable voice.",
        #         True, "English", "0"],
        # ]

        with gr.Row():
            generate3_button = gr.Button("Generate 3")
            generate2_button = gr.Button("Generate 2")
            generate1_button = gr.Button("Generate", variant="primary")

        prompt.submit(fn=generate_multi(1), inputs=inputs, outputs=outputs)
        generate1_button.click(fn=generate_multi(1), inputs=inputs,
                               outputs=outputs)
        generate2_button.click(fn=generate_multi(2), inputs=inputs,
                               outputs=outputs + outputs2)
        generate3_button.click(fn=generate_multi(3), inputs=inputs,
                               outputs=outputs + outputs2 + outputs3)

        def show(count): return [
            gr.Audio.update(visible=True),
            gr.Image.update(visible=True),
            gr.Audio.update(visible=count > 1),
            gr.Image.update(visible=count > 1),
            gr.Audio.update(visible=count > 2),
            gr.Image.update(visible=count > 2),
        ]

        generate1_button.click(fn=lambda: show(
            1), outputs=outputs + outputs2 + outputs3)
        generate2_button.click(fn=lambda: show(
            2), outputs=outputs + outputs2 + outputs3)
        generate3_button.click(fn=lambda: show(
            3), outputs=outputs + outputs2 + outputs3)


def test():
    text_prompt = """
        Hello, my name is Suno. And, uh — and I like pizza. [laughs] 
        But I also have other interests such as playing tic tac toe.
    """

    history_prompt = "en_speaker_0"
    generate(text_prompt, True, history_prompt)
    generate(text_prompt, False, history_prompt)


def generation_tab_tortoise():
    with gr.Tab("Generation (Tortoise)"):
        prompt_tortoise = gr.Textbox(label="Prompt", lines=3,
                                     placeholder="Enter text here...")

        inputs = [
            prompt_tortoise
        ]

        with gr.Row():
            audio_1 = gr.Audio(type="filepath", label="Generated audio")
            audio_2 = gr.Audio(
                type="filepath", label="Generated audio", visible=False)
            audio_3 = gr.Audio(
                type="filepath", label="Generated audio", visible=False)

        with gr.Row():
            image_1 = gr.Image(label="Waveform")
            image_2 = gr.Image(label="Waveform", visible=False)
            image_3 = gr.Image(label="Waveform", visible=False)

        outputs = [audio_1, image_1]
        outputs2 = [audio_2, image_2]
        outputs3 = [audio_3, image_3]

        with gr.Row():
            generate3_button = gr.Button("Generate 3", visible=False)
            generate2_button = gr.Button("Generate 2", visible=False)
            generate1_button = gr.Button("Generate", variant="primary")

        prompt_tortoise.submit(fn=generate_tortoise_,
                               inputs=inputs, outputs=outputs)
        generate1_button.click(fn=generate_tortoise_,
                               inputs=inputs, outputs=outputs)
        generate2_button.click(fn=generate_tortoise_, inputs=inputs,
                               outputs=outputs + outputs2)
        generate3_button.click(fn=generate_tortoise_, inputs=inputs,
                               outputs=outputs + outputs2 + outputs3)

        def show_closure(count):
            def show():
                return [
                    gr.Audio.update(visible=True),
                    gr.Image.update(visible=True),
                    gr.Audio.update(visible=count > 1),
                    gr.Image.update(visible=count > 1),
                    gr.Audio.update(visible=count > 2),
                    gr.Image.update(visible=count > 2),
                ]
            return show

        generate1_button.click(fn=show_closure(
            1), outputs=outputs + outputs2 + outputs3)
        generate2_button.click(fn=show_closure(
            2), outputs=outputs + outputs2 + outputs3)
        generate3_button.click(fn=show_closure(
            3), outputs=outputs + outputs2 + outputs3)
