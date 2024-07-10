const fs = require("fs");
const { $, $$, $sh } = require("./js/shell");
const { menu } = require("./js/menu");
// const { sendToWebConsole, endConnection } = require("./js/longpoll");

// declare process
// declare var process: {
//   stdin: any;
//   stdout(stdout: any, arg1: number, arg2: number): unknown;
//   env: {
//     [key: string]: string;
//   };
//   exit(code?: number): void;
// };

const processExit = (code) => {
  // endConnection(() => {
  process.exit(code);
  // });
};

const sendToWebConsole = (message) => void message;

const displayMessage = async (...message) => {
  console.log(...message);
  await sendToWebConsole(message.join(" "));
};

const displayError = async (...message) => {
  console.error(...message);
  await sendToWebConsole(message.join(" "));
};

const checkConda = async () => {
  try {
    displayMessage("Checking conda installation...");
    await $("conda --version");
  } catch (error) {
    displayError(
      "Please install conda from https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html"
    );
    processExit(1);
  }
};

const updateConda = async () => {
  await $("conda update -y -n base -c defaults conda");
};

const syncRepo = async () => {
  if (!fs.existsSync(".git")) {
    displayMessage("Linking to tts-generation-webui repository");
    // this is a clone over the files from https://github.com/rsxdalv/tts-generation-webui
    await $("git init -b main");
    await $(
      "git remote add origin https://github.com/rsxdalv/tts-generation-webui"
    );
    await $("git fetch");
    await $("git reset --hard origin/main"); // Required when the versioned files existed in path before "git init" of this repo.
    await $("git branch --set-upstream-to=origin/main");
    return true;
  } else {
    displayMessage("Pulling updates from tts-generation-webui");
    try {
      const file = ".git/refs/heads/main";
      const currentHash = fs.readFileSync(file, "utf8");
      await $("git pull");
      const newHash = fs.readFileSync(file, "utf8");
      if (currentHash === newHash) {
        displayMessage("No updates found, skipping...");
        return false;
      }
      return true;
    } catch (error) {
      displayMessage("There was a problem while pulling updates. Aborting...");
      throw error;
    }
  }
};

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

// pytorch::ffmpeg
const cudaPytorchInstall$ =
  "conda install -y -k pytorch[version=2,build=py3.10_cuda11.7*] torchvision torchaudio pytorch-cuda=11.7 cuda-toolkit ninja ffmpeg -c pytorch -c nvidia/label/cuda-11.7.0 -c nvidia";

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

async function repairTorch() {
  // get gpu choice
  const choice = readGPUChoice();
  if (!checkIfTorchHasCuda() && choice === "NVIDIA GPU") {
    displayMessage("Backend is NVIDIA GPU, fixing PyTorch");
    try {
      await $(cudaPytorchInstall$);
    } catch (error) {
      displayError("Failed to fix torch");
    }
  } else if (choice === "CPU" || choice === "Apple M Series Chip") {
    displayMessage("Backend is CPU/Apple M Series Chip, fixing PyTorch");
    try {
      await $(
        "conda install -y -k pytorch torchvision torchaudio cpuonly -c pytorch"
      );
    } catch (error) {
      displayError("Failed to fix torch");
    }
    displayMessage("Torch has CUDA, skipping reinstall");
  }
}

async function main() {
  // http
  //   .createServer(function (req, res) {
  //     // res.writeHead(200, { "Content-Type": "text/html" });
  //     res.writeHead(200, { "Content-Type": "text/plain" });
  //     process.stdout.on("data", (data) => {
  //       res.write(data);
  //     });
  //   })
  //   .listen(8080);
  const version = "0.0.2";
  displayMessage("\n\nStarting init app (version: " + version + ")...\n\n");
  try {
    await checkConda();
    await updateConda();
    const isUpdated = await syncRepo();
    if (!isUpdated) {
      return;
    }
    await initializeApp();
    await setupReactUI();
    await repairTorch();
  } catch (error) {
    displayError(error.message);
    processExit(1);
  }
  displayMessage("\n\nFinished init app.\n\n");
  // processExit(1);
  processExit(0);
}

main();
