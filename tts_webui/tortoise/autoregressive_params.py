import gradio as gr


def autoregressive_params():
    with gr.Accordion(label="Autoregressive Parameters", open=False):
        samples = gr.Slider(
            label="Samples",
            value=16,
            minimum=4,
            maximum=256,
            step=1,
        )

        temperature = gr.Slider(
            label="Temperature",
            value=0.8,
            minimum=0.0,
            maximum=1.0,
            step=0.1,
        )

        length_penalty = gr.Slider(
            label="Length Penalty",
            value=1.0,
            minimum=0.0,
            maximum=10.0,
            step=0.1,
        )

        repetition_penalty = gr.Slider(
            label="Repetition Penalty",
            value=2.0,
            minimum=0.0,
            maximum=10.0,
            step=0.1,
        )

        top_p = gr.Slider(
            label="Top P",
            value=0.8,
            minimum=0.0,
            maximum=1.0,
            step=0.1,
        )
        max_mel_tokens = gr.Slider(
            label="Max Mel Tokens",
            value=500,
            minimum=10,
            maximum=600,
            step=1,
        )

    return (
        samples,
        temperature,
        length_penalty,
        repetition_penalty,
        top_p,
        max_mel_tokens,
    )
