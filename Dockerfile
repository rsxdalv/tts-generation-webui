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
RUN pip3 install virtualenv
RUN virtualenv /venv
ENV VIRTUAL_ENV=/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
# Version 24 is broken due to fairseq
RUN pip3 install --upgrade pip==23.3.2 setuptools && \
    pip3 install torch torchvision torchaudio

# Set working directory
WORKDIR /app

# Clone the repo
RUN git clone https://github.com/rsxdalv/tts-generation-webui.git

# Set working directory to the cloned repo
WORKDIR /app/tts-generation-webui

# Install all requirements
RUN pip3 install -r requirements.txt
RUN pip3 install -r requirements_audiocraft_only.txt --no-deps
RUN pip3 install -r requirements_audiocraft_deps.txt
RUN pip3 install -r requirements_bark_hubert_quantizer.txt
RUN pip3 install -r requirements_rvc.txt
RUN pip3 install hydra-core==1.3.2
RUN pip3 install -r requirements_styletts2.txt
RUN pip3 install -r requirements_vall_e.txt
RUN pip3 install -r requirements_maha_tts.txt

# Build the React UI
RUN cd react-ui && npm install && npm run build

# Run the server
CMD python server.py
