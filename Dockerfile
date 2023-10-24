# Python 3.10 w/ Nvidia Cuda
FROM nvidia/cuda:11.8.0-devel-ubuntu22.04 AS env_base

# Install Pre-reqs
RUN apt-get update && apt-get install --no-install-recommends -y \
    git vim nano build-essential python3-dev python3-venv python3-pip gcc g++ ffmpeg

# Setup venv
RUN pip3 install virtualenv
RUN virtualenv /venv
ENV VIRTUAL_ENV=/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
RUN pip3 install --upgrade pip setuptools && \
    pip3 install torch torchvision torchaudio

# Set working directory
WORKDIR /app

# Clone the repo
RUN git clone https://github.com/rsxdalv/tts-generation-webui.git

# Set working directory to the cloned repo
WORKDIR /app/tts-generation-webui

# Install all requirements
RUN pip3 install -r requirements.txt
RUN pip3 install -r requirements_audiocraft.txt
RUN pip3 install -r requirements_bark_hubert_quantizer.txt
RUN pip3 install -r requirements_rvc.txt

# Add React webui (testing)
# RUN cd react-ui && npm install && npm run build

# Run the server
CMD python server.py
