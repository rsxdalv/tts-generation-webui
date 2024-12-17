const fs = require("fs");
const { resolve } = require("path");
const { displayError, displayMessage } = require("./displayMessage.js");
const { processExit } = require("./processExit.js");
const { menu } = require("./menu.js");
const { $, $$, $sh } = require("./shell.js");
const { applyDatabaseConfig } = require("./applyDatabaseConfig.js");

const DEBUG_DRY_RUN = false;

const torchVersion = "2.3.1"; // 2.4.1+cu118
const cudaVersion = "11.8";

const pythonVersion = `3.10.11`;
const pythonPackage = `python=${pythonVersion}`;
const ffmpegPackage = `conda-forge::ffmpeg=4.4.2[build=lgpl*]`;
const nodePackage = `conda-forge::nodejs=22.9.0`;
const anacondaPostgresqlPackage = `conda-forge::postgresql=16.4`;
// const terraformPackage = `conda-forge::terraform=1.8.2`;
const terraformPackage = ``;

const cudaChannels = [
  "",
  "pytorch",
  `nvidia/label/cuda-${cudaVersion}.0`,
  "nvidia",
].join(" -c ");
const cpuChannels = ["", "pytorch"].join(" -c ");

const windowsOnlyPackages =
  process.platform === "win32" ? ["conda-forge::vswhere"] : [];

const commonPackages = [
  "conda-forge::uv=0.4.17",
  ...windowsOnlyPackages,
  terraformPackage,
  anacondaPostgresqlPackage,
  nodePackage,
  ffmpegPackage,
];

const cudaPackages = `pytorch[version=${torchVersion},build=py3.10_cuda${cudaVersion}.*] pytorch-cuda=${cudaVersion} torchvision torchaudio cuda-toolkit ninja`;
const cudaPytorchInstall$ = [
  "conda install -y -k",
  ...commonPackages,
  cudaPackages,
  cudaChannels,
].join(" ");

const cpuPackages = `pytorch=${torchVersion} torchvision torchaudio cpuonly`;
const pytorchCPUInstall$ = [
  "conda install -y -k",
  ...commonPackages,
  cpuPackages,
  cpuChannels,
].join(" ");

const baseOnlyInstall$ = ["conda install -y -k", ...commonPackages].join(" ");

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
    } else if (gpuchoice === "AMD GPU (ROCM, Linux only, potentially broken)") {
      displayMessage(
        "ROCM is experimental and not well supported yet, installing..."
      );
      displayMessage("Linux only!");
      await $(baseOnlyInstall$);
      await $(
        `pip install torch==${torchVersion} torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0`
      );
    } else if (gpuchoice === "pip torch cpu (experimental, faster install)") {
      await $(baseOnlyInstall$);
      await $(`pip install torch==${torchVersion} torchvision torchaudio`);
      // uv pip install torch==2.5.0+cu118 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
    } else {
      displayMessage("Unsupported or cancelled. Exiting...");
      removeGPUChoice();
      processExit(1);
    }

    saveMajorVersion(majorVersion);
    displayMessage("  Successfully installed torch");
    await pip_install_all(true); // approximate first install
  } catch (error) {
    displayError(`Error during installation: ${error.message}`);
    throw error;
  }
};

const askForGPUChoice = () =>
  menu(
    [
      "NVIDIA GPU",
      "Apple M Series Chip",
      "CPU",
      "Cancel",
      "AMD GPU (ROCM, Linux only, potentially broken)",
      "Intel GPU (unsupported)",
      "Integrated GPU (unsupported)",
      "pip torch cpu (experimental, faster install)",
    ],
    `
These are not yet automatically supported: AMD GPU, Intel GPU, Integrated GPU.
Select the device (GPU/CPU) you are using to run the application:
(use arrow keys to move, enter to select)
  `
  );

const getInstallerFilesPath = (...files) => resolve(__dirname, "..", ...files);

const gpuFile = getInstallerFilesPath(".gpu");
const majorVersionFile = getInstallerFilesPath(".major_version");
const pipPackagesFile = getInstallerFilesPath(".pip_packages");
const majorVersion = "4";

const versions = JSON.parse(
  fs.readFileSync(getInstallerFilesPath("versions.json"))
);
const newPipPackagesVersion = String(versions.pip_packages);

const readGeneric = (file) => {
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf8");
  }
  return -1;
};

const saveGeneric = (file, data) => fs.writeFileSync(file, data.toString());

const readMajorVersion = () => readGeneric(majorVersionFile);
const saveMajorVersion = (data) => saveGeneric(majorVersionFile, data);
const readPipPackagesVersion = () => readGeneric(pipPackagesFile);
const savePipPackagesVersion = (data) => saveGeneric(pipPackagesFile, data);
const readGPUChoice = () => readGeneric(gpuFile);
const saveGPUChoice = (data) => saveGeneric(gpuFile, data);

const removeGPUChoice = () => {
  if (fs.existsSync(gpuFile)) fs.unlinkSync(gpuFile);
};

const dry_run_flag = DEBUG_DRY_RUN ? "--dry-run " : "";

function pip_install(requirements, name = "", pipFallback = false) {
  try {
    displayMessage(`Installing ${name || requirements} dependencies...`);
    $sh(
      `${
        pipFallback ? "pip" : "uv pip"
      } install ${dry_run_flag}${requirements} torch==${torchVersion}`
    );
    displayMessage(
      `Successfully installed ${name || requirements} dependencies\n`
    );
  } catch (error) {
    displayMessage(`Failed to install ${name || requirements} dependencies\n`);
  }
}

// The first install is a temporary safeguard due to mysterious issues with uv
async function pip_install_all(first_install = false) {
  if (readPipPackagesVersion() === newPipPackagesVersion)
    return displayMessage(
      "Dependencies are already up to date, skipping pip installs..."
    );

  const pip_install_all_choice = await menu(
    ["Yes", "No"],
    `Attempt single pip install of all dependencies (potentially faster)?
    (use arrow keys to move, enter to select)`
  );

  if (pip_install_all_choice === "Yes") {
    try {
      displayMessage("Attempting single pip install of all dependencies...");
      pip_install(
        "-r requirements.txt -r requirements_bark_hubert_quantizer.txt -r requirements_rvc.txt -r requirements_audiocraft.txt -r requirements_styletts2.txt -r requirements_vall_e.txt -r requirements_maha_tts.txt -r requirements_stable_audio.txt hydra-core==1.3.2 nvidia-ml-py",
        "All dependencies",
        first_install
      );
      savePipPackagesVersion(newPipPackagesVersion);
      displayMessage("");
      return;
    } catch (error) {
      displayMessage("Failed to install all dependencies, falling back to individual installs...");
    }
  }


  displayMessage("Updating dependencies...");
  // pip_install_all(false); // potential speed optimization
  pip_install(
    "-r requirements.txt",
    "Core Packages, Bark, Tortoise",
    first_install
  );
  pip_install(
    "xformers==0.0.27+cu118 --index-url https://download.pytorch.org/whl/cu118",
    "xformers"
  );
  pip_install(
    "-r requirements_bark_hubert_quantizer.txt",
    "Bark Voice Clone",
    first_install
  );
  pip_install("-r requirements_rvc.txt", "RVC", first_install);
  pip_install("-r requirements_audiocraft.txt", "Audiocraft", first_install);
  pip_install("-r requirements_styletts2.txt", "StyleTTS", first_install);
  pip_install("-r requirements_vall_e.txt", "Vall-E-X", first_install);
  pip_install("-r requirements_maha_tts.txt", "Maha TTS", first_install);
  pip_install("-r requirements_stable_audio.txt", "Stable Audio", true);
  // reinstall hydra-core==1.3.2 because of fairseq
  pip_install(
    "hydra-core==1.3.2",
    "hydra-core fix due to fairseq",
    first_install
  );
  pip_install("nvidia-ml-py", "nvidia-ml-py", first_install);
  savePipPackagesVersion(newPipPackagesVersion);
  displayMessage("");
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

const FORCE_REINSTALL = process.env.FORCE_REINSTALL ? true : false;

async function applyCondaConfig() {
  displayMessage("Applying conda config...");
  displayMessage("  Checking if Torch is installed...");
  if (readMajorVersion() === majorVersion && !FORCE_REINSTALL) {
    if (await checkIfTorchInstalled()) {
      displayMessage("  Torch is already installed. Skipping installation...");
      await pip_install_all();
      return;
    } else {
      displayMessage("  Torch is not installed. Starting installation...\n");
    }
  } else {
    displayMessage(
      "  Major version update detected. Upgrading base environment"
    );
  }

  if (fs.existsSync(gpuFile)) {
    const gpuchoice = readGPUChoice();
    displayMessage(`  Using saved GPU choice: ${gpuchoice}`);
    await installDependencies(gpuchoice);
    return;
  } else {
    const gpuchoice = await askForGPUChoice();
    displayMessage(`  You selected: ${gpuchoice}`);
    saveGPUChoice(gpuchoice);
    await installDependencies(gpuchoice);
  }
}

exports.initializeApp = async () => {
  displayMessage("Ensuring that python has the correct version...");
  await ensurePythonVersion();
  displayMessage("");
  await applyCondaConfig();
  displayMessage("");
  try {
    await applyDatabaseConfig();
    displayMessage("");
  } catch (error) {
    displayError("Failed to apply database config");
  }
};

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

exports.repairTorch = async () => {
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
};

function setupReactUIExtensions() {
  try {
    displayMessage("Initializing extensions...");
    const packageJSONpath = getInstallerFilesPath(
      "..",
      "react-ui",
      "src",
      "extensions",
      "package.json"
    );

    if (!fs.existsSync(packageJSONpath)) {
      fs.writeFileSync(packageJSONpath, "{}");
    }
    // $sh("cd react-ui/src/extensions && npm install");
    // displayMessage("Successfully installed extensions");
  } catch (error) {
    displayMessage("Failed to install extensions");
    throw error;
  }
}

exports.setupReactUI = () => {
  try {
    setupReactUIExtensions();
    displayMessage("Installing node_modules...");
    $sh("cd react-ui && npm install");
    displayMessage("Successfully installed node_modules");
    displayMessage("Building react-ui...");
    $sh("cd react-ui && npm run build");
    displayMessage("Successfully built react-ui");
  } catch (error) {
    displayMessage("Failed to install node_modules or build react-ui");
    throw error;
  }
};
