const fs = require("fs");
const { displayError, displayMessage } = require("./displayMessage.js");
const { processExit } = require("./processExit.js");
const { menu } = require("./menu.js");
const { $, $$, $sh } = require("./shell.js");

const DEBUG_DRY_RUN = false;

// const torchVersion = $$(`pip show torch | grep Version`);
const torchVersion = "2.3.1";
const cudaVersion = "11.8";

// xformers==0.0.19 # For torch==2.0.0 project plane
// xformers==xformers-0.0.22.post7 # For torch==2.1.0 project plane
const pythonVersion = `3.10.11`;
const pythonPackage = `python=${pythonVersion}`;
const ffmpegPackage = `pytorch::ffmpeg`;
const cudaChannels = [
  "",
  "pytorch",
  `nvidia/label/cuda-${cudaVersion}.0`,
  "nvidia",
].join(" -c ");
const cpuChannels = ["", "pytorch"].join(" -c ");

const cudaPackages = `pytorch[version=${torchVersion},build=py3.10_cuda${cudaVersion}*] torchvision torchaudio pytorch-cuda=${cudaVersion} cuda-toolkit ninja`;
const cudaPytorchInstall$ = `conda install -y -k ${ffmpegPackage} ${cudaPackages} ${cudaChannels}`;

const cpuPackages = `pytorch=${torchVersion} torchvision torchaudio cpuonly`;
const pytorchCPUInstall$ = `conda install -y -k ${ffmpegPackage} ${cpuPackages} ${cpuChannels}`;

// console.log(cudaPytorchInstall$);
// console.log(pytorchCPUInstall$);

const ensurePythonVersion = async () => {
  try {
    displayMessage("Checking python version...");
    const version = await getPythonVersion();
    if (version !== `Python ${pythonVersion}`) {
      displayMessage(`Current python version is """${version}"""`);
      displayMessage(`Python version is not ${pythonVersion}. Reinstalling...`);
      await $(`conda install -y -k -c conda-forge ${pythonPackage}`);
      await $(`conda install -y -k -c conda-forge pip==23.3.2`);
    }
  } catch (error) {
    displayError("Failed to check/install python version");
  }

  async function getPythonVersion() {
    await $sh(`python --version > installer_scripts/.python_version`);
    return fs.readFileSync("installer_scripts/.python_version", "utf8").trim();
  }
};

const installDependencies = async (gpuchoice) => {
  try {
    if (gpuchoice === "NVIDIA GPU") {
      await $(cudaPytorchInstall$);
    } else if (gpuchoice === "Apple M Series Chip" || gpuchoice === "CPU") {
      await $(pytorchCPUInstall$);
    } else {
      displayMessage("Unsupported or cancelled. Exiting...");
      removeGPUChoice();
      processExit(1);
    }

    saveMajorVersion(majorVersion);
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
const majorVersionFile = "./installer_scripts/.major_version";
const majorVersion = "2";

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

const readMajorVersion = () => {
  if (fs.existsSync(majorVersionFile)) {
    return fs.readFileSync(majorVersionFile, "utf8");
  }
  return -1;
};

const saveMajorVersion = (majorVersion) => {
  fs.writeFileSync(majorVersionFile, majorVersion.toString());
};

const dry_run_flag = DEBUG_DRY_RUN ? "--dry-run " : "";

function tryInstall(requirements, name = "") {
  try {
    displayMessage(`Installing ${name || requirements} dependencies...`);
    $sh(`pip install ${dry_run_flag}${requirements} torch==${torchVersion}`);
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

  displayMessage("Updating dependencies...");
  tryInstall("-r requirements.txt", "Core Packages, Bark, Tortoise");
  tryInstall(
    "xformers==0.0.27 --index-url https://download.pytorch.org/whl/cu118",
    "xformers"
  );
  tryInstall("-r requirements_bark_hubert_quantizer.txt", "Bark Voice Clone");
  tryInstall("-r requirements_rvc.txt", "RVC");
  tryInstall("-r requirements_audiocraft.txt", "Audiocraft");
  tryInstall("-r requirements_styletts2.txt", "StyleTTS");
  tryInstall("-r requirements_vall_e.txt", "Vall-E-X");
  tryInstall("-r requirements_maha_tts.txt", "Maha TTS");
  tryInstall("-r requirements_stable_audio.txt", "Stable Audio");
  // reinstall hydra-core==1.3.2 because of fairseq
  tryInstall("hydra-core==1.3.2", "hydra-core fix due to fairseq");
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
  displayMessage("Ensuring that python has the correct version...");
  await ensurePythonVersion();
  displayMessage("Checking if Torch is installed...");
  if (readMajorVersion() === majorVersion) {
    if (await checkIfTorchInstalled()) {
      displayMessage("Torch is already installed. Skipping installation...");
      await updateDependencies();
      return;
    } else {
      displayMessage("Torch is not installed. Starting installation...\n");
    }
  } else {
    displayMessage("Major version update detected. Upgrading base environment");
  }

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
  const gpuChoice = readGPUChoice();
  if (!checkIfTorchHasCuda() && gpuChoice === "NVIDIA GPU") {
    displayMessage("Backend is NVIDIA GPU, fixing PyTorch");
    try {
      await $(`conda install -y -k --force-reinstall ${cudaPackages}`);
    } catch (error) {
      displayError("Failed to fix torch");
    }
  } else if (gpuChoice === "CPU" || gpuChoice === "Apple M Series Chip") {
    displayMessage("Backend is CPU/Apple M Series Chip, fixing PyTorch");
    try {
      await $(`conda install -y -k --force-reinstall ${cpuPackages}`);
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
