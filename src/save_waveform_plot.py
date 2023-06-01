import io
import matplotlib
import matplotlib.figure as mpl_fig
from matplotlib import pyplot as plt
import numpy as np

matplotlib.use('agg')


def save_waveform_plot(audio_array: np.ndarray, filename_png: str):
    fig = plt.figure(figsize=(10, 3))
    plt.style.use('dark_background')
    plt.plot(audio_array, color='orange')
    plt.axis("off")
    plt.savefig(filename_png)
    plt.close()
    return figure_to_image(fig)


def figure_to_image(fig: mpl_fig.Figure):
    with io.BytesIO() as buff:
        fig.savefig(buff, format='raw')
        buff.seek(0)
        data = np.frombuffer(buff.getvalue(), dtype=np.uint8)
    w, h = fig.canvas.get_width_height()
    return data.reshape((int(h), int(w), -1))


if __name__ == "__main__":
    print("Testing save_waveform_plot.py")
    audio_array = np.random.rand(100)
    filename_png = "test.png"
    data = save_waveform_plot(audio_array, filename_png)
    print(data)
    print("Testing save_waveform_plot.py done")
