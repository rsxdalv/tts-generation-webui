# Manual Installation Guide

> **Warning**: These instructions may be outdated compared to the automated installer but serve as reference for debugging or understanding what the installer does. Hopefully they can be a basis for supporting new platforms, such as AMD/Intel.

## Prerequisites
* Install conda (https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html)
  * (Windows) Install Visual Studio compiler / Visual Studio Build Tools https://visualstudio.microsoft.com/visual-cpp-build-tools/

## Basic Environment Setup
* Set up an environment: `conda create -n venv`
* Install git, node.js `conda install -y -c conda-forge git python=3.10.11 conda-forge::nodejs=22.9.0 conda pip==23.3.2 conda-forge::uv=0.4.17 ninja conda-forge::postgresql=16.4 conda-forge::vswhere conda-forge::ffmpeg=4.4.2[build=lgpl*]`

## Installation Options
* a) Either Continue with the installer script
  * activate the environment: `conda activate venv` and
  * (venv) `node installer_scripts\init_app.js`
  * then run the server with (venv) `python server.py`
* b) Or install the requirements manually
  
  ### PyTorch Installation
  * Set up pytorch with CUDA or CPU (https://pytorch.org/audio/stable/build.windows.html#install-pytorch):
    * (venv) `pip install -U torch==2.6.0+cpu torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu` for CPU/Mac
    * (venv) `pip install -U torch==2.6.0+cu124 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124` for CUDA
    * (venv) `pip install -U torch==2.6.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0` for ROCM on Linux
  
  ### Project Setup
  * Clone the repo: `git clone https://github.com/rsxdalv/tts-generation-webui.git`
  * Install the requirements:
    * install all the requirements*.txt (this list might not be up to date, check https://github.com/rsxdalv/tts-generation-webui/blob/main/Dockerfile#L39-L40):
      * (venv) `pip install -r requirements.txt`
      * (venv) `pip install -r requirements_bark_hubert_quantizer.txt`
      * (venv) `pip install -r requirements_rvc.txt`
      * (venv) `pip install -r requirements_audiocraft.txt`
      * (venv) `pip install -r requirements_styletts2.txt`
      * (venv) `pip install -r requirements_vall_e.txt`
      * (venv) `pip install -r requirements_maha_tts.txt`
      * (venv) `pip install -r requirements_stable_audio.txt`
      * (venv) `pip install hydra-core==1.3.2`
      * (venv) `pip install nvidia-ml-py`
    * optionally install all of them together, which might fail on some systems:
      * (venv) `pip install -r requirements.txt -r requirements_bark_hubert_quantizer.txt -r requirements_rvc.txt -r requirements_audiocraft.txt -r requirements_styletts2.txt -r requirements_vall_e.txt -r requirements_maha_tts.txt -r requirements_stable_audio.txt hydra-core==1.3.2 nvidia-ml-py`
    
    ### Frontend Setup
    * build the react app: (venv) `cd react-ui && npm install && npm run build`
  
  ### Optional Database Setup
  * (optional) setup the database: (venv) `node installer_scripts/js/applyDatabaseConfig.js`
  
  ### Start Server
  * run the server: (venv) `python server.py`

## React UI Setup
* Install nodejs (if not already installed with conda)
* Install react dependencies: `npm install`
* Build react: `npm run build`
* Run react: `npm start`
* Also run the python server: `python server.py` or with `start_tts_webui` script
