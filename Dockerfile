# Python 3.10 w/ Nvidia Cuda
FROM nvidia/cuda:11.8.0-devel-ubuntu22.04 AS env_base

# Install Pre-reqs
RUN apt-get update && apt-get install --no-install-recommends -y \
    git vim nano build-essential python3-dev python3-venv python3-pip gcc g++ ffmpeg

ENV NODE_VERSION=18.16.1
RUN apt-get update && apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

# Setup venv
RUN pip3 install --no-cache-dir virtualenv
RUN virtualenv /venv
ENV VIRTUAL_ENV=/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Define PyTorch version, torch 2.0.0 known to work
ENV TORCH_VERSION=2.0.0

# Version 24 is broken due to fairseq
RUN pip3 install --no-cache-dir --upgrade pip==23.3.2 setuptools && \
    pip3 install --no-cache-dir torch==$TORCH_VERSION torchvision torchaudio

# Set working directory
WORKDIR /app

# Clone the repo
RUN git clone https://github.com/rsxdalv/tts-generation-webui.git

# Set working directory to the cloned repo
WORKDIR /app/tts-generation-webui

# Install all requirements
RUN pip3 install --no-cache-dir torch==$TORCH_VERSION -r requirements.txt
RUN pip3 install --no-cache-dir torch==$TORCH_VERSION -r requirements_audiocraft.txt
RUN pip3 install --no-cache-dir torch==$TORCH_VERSION -r requirements_bark_hubert_quantizer.txt
RUN pip3 install --no-cache-dir torch==$TORCH_VERSION -r requirements_rvc.txt
RUN pip3 install --no-cache-dir torch==$TORCH_VERSION -r requirements_styletts2.txt
RUN pip3 install --no-cache-dir torch==$TORCH_VERSION -r requirements_vall_e.txt
RUN pip3 install --no-cache-dir torch==$TORCH_VERSION -r requirements_maha_tts.txt
RUN pip3 install --no-cache-dir torch==$TORCH_VERSION -r requirements_stable_audio.txt

# Build the React UI
RUN cd react-ui && npm install && npm run build

# Run the server
CMD python server.py
