def gradio_dict_decorator(fn, gradio_fn_input_dictionary, outputs):
    """
    A helper function that allows specifying gradio inputs and outputs as a dictionary.

    For example:
    text = gr.Textbox(label="Text")
    description = gr.Textbox(label="Context")

    audio_out = gr.Audio(label="Parler-TTS generation", type="numpy", elem_id="audio_out")

    gradion_fn_input_dictionary = {
        text: "text",
        description: "description",
    }

    outputs = { "audio_out": audio_out }

    def fn(text, description):
        return { "audio_out": (SAMPLE_RATE, text + description) }

    gr.Button("Generate").click(
        inputs={*gradion_fn_input_dictionary},
        outputs=[v for _, v in outputs.items()],
        fn=gradio_dict_decorator(fn, gradion_fn_input_dictionary, outputs)
    )

    """

    def unmap_outputs(result_dict):
        return {v: result_dict[k] for k, v in outputs.items()}

    return lambda dict_args: unmap_outputs(
        fn(
            **{gradio_fn_input_dictionary[k]: v for k, v in dict_args.items()},
            outputs=outputs,
        )
    )
