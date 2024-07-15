from src.utils.save_waveform_plot import plot_waveform_as_image
import gradio as gr
import torchaudio
import torch


def gr_mini_button(value, **kwargs):
    return gr.Button(
        value,
        elem_classes="btn-sm material-symbols-outlined",
        size="sm",
        **kwargs,
    )


def simple_remixer_ui():
    input_audio = gr.Audio(label="Input Audio")

    def create_slot(id=0):
        with gr.Group(
            elem_classes="tts-slot",
        ):
            audio = gr.Audio(label=f"Slot {str(id)}", elem_classes="tts-audio")
            image = gr.Image(
                show_label=False,
                elem_classes="tts-image-tiny",
                interactive=False,
            )

            audio.change(
                fn=lambda x: (
                    image.update(
                        plot_waveform_as_image(x[1]),
                    )
                    if x is not None
                    else None
                ),
                inputs=[audio],
                outputs=[image],
            )
            with gr.Row():
                clear = gr_mini_button("delete").click(
                    fn=lambda: [
                        audio.update(None),
                        image.update(None),
                    ],
                    outputs=[audio, image],
                )
                copy_from_input = gr_mini_button("keyboard_return").click(
                    fn=lambda input_value: [
                        audio.update(input_value),
                        image.update(plot_waveform_as_image(input_value[1])),
                    ],
                    inputs=[input_audio],
                    # outputs=[audio],
                    outputs=[
                        audio,
                        image,
                    ],
                )
        return audio

    def slot_stack(i):
        with gr.Column(variant="compact"):
            a = create_slot(i)
            b = create_slot(i)
            c = create_slot(i)
        return a, b, c

    with gr.Row(elem_classes="studio-slots-row"):
        slots = [slot_stack(i) for i in range(5)]
        slots = [x for y in slots for x in y]

    concat = gr.Button("Concatenate")

    output_audio = gr.Audio(label="Output Audio")

    def concat_audio(*slot_audios):
        sample_rate = max(x[0] for x in slot_audios if x is not None)

        resampled_audios = [
            resample_from_to(x[0], sample_rate, x[1]) if x is not None else None
            for x in slot_audios
        ]
        stacked_audios = [
            resampled_audios[i : i + 3] for i in range(0, len(slot_audios), 3)
        ]

        def mix_audio(x):
            non_null_audios = [i for i in x if i is not None]

            if not non_null_audios:
                return None
            max_len = max(i.shape[0] for i in non_null_audios)

            stack = torch.stack(
                [
                    torch.nn.functional.pad(
                        i,
                        (
                            0,
                            max_len - i.shape[0],
                        ),
                    )
                    for i in non_null_audios
                ]
            )
            return torch.sum(
                stack,
                dim=0,
            )

        merged_audios = [mix_audio(x) for x in stacked_audios]
        if non_null_audios := [x for x in merged_audios if x is not None]:
            return output_audio.update(
                (sample_rate, torch.cat(non_null_audios).cpu().numpy())
            )
        else:
            return output_audio.update(None)

    def resample_from_to(in_sr: int, out_sr: int, in_wav):
        return torchaudio.transforms.Resample(in_sr, out_sr)(
            torch.from_numpy(in_wav).float()
        )

    concat.click(
        fn=concat_audio,
        inputs=slots,  # type: ignore
        outputs=output_audio,
    )

    send_to_input = gr.Button("Send to input")

    send_to_input.click(
        fn=lambda x: input_audio.update(x),
        inputs=output_audio,
        outputs=input_audio,
    )

    return input_audio


def simple_remixer_tab():
    with gr.Tab("Simple Remixer", id="simple_remixer"):
        return simple_remixer_ui()
