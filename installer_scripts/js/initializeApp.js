const fs = require("fs");
const { displayError, displayMessage } = require("./displayMessage.js");
const { processExit } = require("./processExit.js");
const { menu } = require("./menu.js");
const { $$, $sh } = require("./shell.js");

// pytorch::ffmpeg
const cudaPackages =
  "pytorch[version=2,build=py3.10_cuda11.7*] torchvision torchaudio pytorch-cuda=11.7 cuda-toolkit ninja ffmpeg -c pytorch -c nvidia/label/cuda-11.7.0 -c nvidia";
const cudaPytorchInstall$ = `conda install -y -k ${cudaPackages}`;

const installDependencies = async (gpuchoice) => {
  try {
    if (gpuchoice === "NVIDIA GPU") {
      await $(cudaPytorchInstall$);
    } else if (gpuchoice === "Apple M Series Chip" || gpuchoice === "CPU") {
      await $(
        "conda install -y -k pytorch torchvision torchaudio cpuonly ffmpeg -c pytorch"
      );
    } else {
      displayMessage("Unsupported or cancelled. Exiting...");
      removeGPUChoice();
      processExit(1);
    }

    await updateDependencies(false);
  } catch (error) {
    displayError(`Error during installation: ${error.message}`);
  }
};

const askForGPUChoice = () =>
  menu(
    [
      "NVIDIA GPU",
      "Apple M Series Chip",
      "CPU",
      "Cancel",
      "AMD GPU (unsupported)",
      "Intel GPU (unsupported)",
      "Integrated GPU (unsupported)",
    ],
    `
These are automatically supported yet: AMD GPU, Intel GPU, Integrated GPU. Select CPU mode.
Select the device (GPU/CPU) you are using to run the application:
(use arrow keys to move, enter to select)
  `
  );

const gpuFile = "./installer_scripts/.gpu";

const saveGPUChoice = (gpuchoice) => {
  fs.writeFileSync(gpuFile, gpuchoice.toString());
};

const removeGPUChoice = () => {
  if (fs.existsSync(gpuFile)) {
    fs.unlinkSync(gpuFile);
  }
};

const readGPUChoice = () => {
  if (fs.existsSync(gpuFile)) {
    return fs.readFileSync(gpuFile, "utf8");
  }
  return -1;
};

function tryInstall(requirements, name = "") {
  try {
    displayMessage(`Installing ${name || requirements} dependencies...`);
    // const torchVersion = $$(`pip show torch | grep Version`);
    const torchVersion = "2.0.0";
    $sh(`pip install ${requirements} torch==${torchVersion}`);
    displayMessage(
      `Successfully installed ${name || requirements} dependencies`
    );
  } catch (error) {
    displayMessage(`Failed to install ${name || requirements} dependencies`);
  }
}

async function updateDependencies(optional = true) {
  if (optional) {
    if (
      (await menu(
        ["Yes", "No"],
        "Do you want to update dependencies?\n(not updating might break new features)"
      )) === "No"
    ) {
      displayMessage("Skipping dependencies update");
      return;
    }
  }

  tryInstall("-r requirements.txt", "Core Packages, Bark, Tortoise");
  displayMessage("Updating dependencies...");
  // xformers==0.0.19 # For torch==2.0.0 project plane
  tryInstall("-r requirements_audiocraft.txt xformers==0.0.19", "Audiocraft");
  tryInstall("-r requirements_bark_hubert_quantizer.txt", "Bark Voice Clone");
  tryInstall("-r requirements_rvc.txt", "RVC");
  tryInstall("-r requirements_styletts2.txt", "StyleTTS");
  tryInstall("-r requirements_vall_e.txt", "Vall-E-X");
  tryInstall("-r requirements_maha_tts.txt", "Maha TTS");
  tryInstall("-r requirements_stable_audio.txt", "Stable Audio");
}

const checkIfTorchInstalled = async () => {
  try {
    await $$([
      "python",
      "-c",
      'import importlib.util; import sys; package_name = "torch"; spec = importlib.util.find_spec(package_name); sys.exit(0) if spec else sys.exit(1)',
    ]);
    return true;
  } catch (error) {
    return false;
  }
};

const initializeApp = async () => {
  displayMessage("Checking if Torch is installed...");
  if (await checkIfTorchInstalled()) {
    displayMessage("Torch is already installed. Skipping installation...");
    await updateDependencies();
    return;
  }
  displayMessage("Torch is not installed. Starting installation...\n");

  if (fs.existsSync(gpuFile)) {
    const gpuchoice = readGPUChoice();
    displayMessage(`Using saved GPU choice: ${gpuchoice}`);
    await installDependencies(gpuchoice);
    return;
  } else {
    const gpuchoice = await askForGPUChoice();
    displayMessage(`You selected: ${gpuchoice}`);
    saveGPUChoice(gpuchoice);
    await installDependencies(gpuchoice);
  }
};
exports.initializeApp = initializeApp;

const checkIfTorchHasCuda = async () => {
  try {
    displayMessage("Checking if torch has CUDA...");
    await $$([
      "python",
      "-c",
      "import torch; exit(0 if torch.cuda.is_available() else 1)",
    ]);
    return true;
  } catch (error) {
    return false;
  }
};

async function repairTorch() {
  // get gpu choice
  const choice = readGPUChoice();
  if (!checkIfTorchHasCuda() && choice === "NVIDIA GPU") {
    displayMessage("Backend is NVIDIA GPU, fixing PyTorch");
    try {
      await $(`conda install -y -k --force-reinstall ${cudaPackages}`);
    } catch (error) {
      displayError("Failed to fix torch");
    }
  } else if (choice === "CPU" || choice === "Apple M Series Chip") {
    displayMessage("Backend is CPU/Apple M Series Chip, fixing PyTorch");
    try {
      await $(
        "conda install -y -k --force-reinstall pytorch torchvision torchaudio cpuonly -c pytorch"
      );
    } catch (error) {
      displayError("Failed to fix torch");
    }
    displayMessage("Torch has CUDA, skipping reinstall");
  }
}
exports.repairTorch = repairTorch;

function setupReactUI() {
  try {
    displayMessage("Installing node_modules...");
    $sh("cd react-ui && npm install");
    displayMessage("Successfully installed node_modules");
    displayMessage("Building react-ui...");
    $sh("cd react-ui && npm run build");
    displayMessage("Successfully built react-ui");
  } catch (error) {
    displayMessage("Failed to install node_modules or build react-ui");
  }
}
exports.setupReactUI = setupReactUI;
