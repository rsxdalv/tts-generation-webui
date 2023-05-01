from matplotlib import pyplot as plt


def save_waveform_plot(audio_array, filename_png):
    plt.figure(figsize=(10, 3))
    plt.style.use('dark_background')
    plt.plot(audio_array, color='orange')
    plt.axis("off")
    plt.savefig(filename_png)
