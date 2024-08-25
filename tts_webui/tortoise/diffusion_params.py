import gradio as gr


def diffusion_params():
    with gr.Accordion(label="Diffusion Parameters", open=False):
        iterations = gr.Slider(
            label="Diffusion Iterations", value=30, minimum=4, maximum=400, step=1
        )
        cond_free = gr.Checkbox(label="Cond Free", value=False)
        cond_free_k = gr.Slider(
            label="Cond Free K", value=2, minimum=0, maximum=10, step=1
        )
        diffusion_temperature = gr.Slider(
            label="Temperature",
            value=1.0,
            minimum=0.0,
            maximum=1.0,
            step=0.1,
        )

    return iterations, cond_free, cond_free_k, diffusion_temperature
