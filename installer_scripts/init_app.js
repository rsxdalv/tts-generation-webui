const fs = require("fs");
const { resolve } = require("path");
const { $ } = require("./js/shell");
const { displayError, displayMessage } = require("./js/displayMessage.js");
const { processExit } = require("./js/processExit.js");
const { startServer } = require("./js/server.js");
const { updateState } = require("./js/installerState.js");

const checkConda = async () => {
  try {
    updateState({ status: "checking_dependencies", currentStep: 1 });

    displayMessage("Checking conda installation...");
    await $("conda --version");

    updateState({ condaReady: true });

    displayMessage("");
    // verify conda paths
    await $("conda info --envs");
    // expect
    // # conda environments:
    // #
    // base                 * .. ..\tts-generation-webui-main\installer_files\env
  } catch (error) {
    updateState({ status: "error", lastError: "Conda installation not found" });

    displayError(
      "Please install conda from https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html"
    );
    processExit(1);
  }
};

const updateConda = async () => {
  await $("conda update -y -n base -c defaults conda");
};

const FORCE_REINSTALL = process.env.FORCE_REINSTALL ? true : false;
const DEBUG_ALWAYS_RETURN_UPDATED =
  FORCE_REINSTALL || process.env.DEBUG_ALWAYS_RETURN_UPDATED ? true : false;

const getGitCommitHash = () =>
  fs.readFileSync("./.git/refs/heads/main", "utf8");

const AppliedGitVersion = {
  file: resolve(__dirname, ".git_version"),
  get: () =>
    fs.existsSync(AppliedGitVersion.file)
      ? fs.readFileSync(AppliedGitVersion.file, "utf8")
      : null,
  save: () => fs.writeFileSync(AppliedGitVersion.file, getGitCommitHash()),
};

const syncRepo = async () => {
  updateState({ status: "updating_repo", currentStep: 2 });

  if (!fs.existsSync(".git")) {
    displayMessage("Linking to tts-generation-webui repository");
    // this is a clone over the files from https://github.com/rsxdalv/tts-generation-webui
    try {
      await $("git init -b main");
      await $(
        "git remote add origin https://github.com/rsxdalv/tts-generation-webui"
      );
      await $("git fetch");
      await $("git reset --hard origin/main"); // Required when the versioned files existed in path before "git init" of this repo.
      await $("git branch --set-upstream-to=origin/main");

      const newHash = getGitCommitHash();
      updateState({ gitHash: newHash });

      return true;
    } catch (error) {
      updateState({
        status: "error",
        lastError: "Failed to initialize git repository",
      });
      displayMessage("Error:");
      displayError(error);
      throw error;
    }
  } else {
    displayMessage("Pulling updates from tts-generation-webui");
    try {
      await $("git pull");
      const newHash = getGitCommitHash();
      updateState({ gitHash: newHash });
      if (AppliedGitVersion.get() === newHash) {
        displayMessage("Current git version: " + newHash);
        displayMessage("No updates found, skipping...");
        return false || DEBUG_ALWAYS_RETURN_UPDATED;
      }
      return true;
    } catch (error) {
      updateState({ lastError: "Problem pulling updates from git" });
      displayMessage(
        "There was a problem while pulling updates. Warning: missing updates might cause issues. Continuing..."
      );
      displayMessage("Error:");
      displayError(error);
      return false;
      // throw error;
    }
  }
};

async function main() {
  startServer();

  const version = "0.1.0";
  displayMessage("\n\nStarting init app (version: " + version + ")...\n\n");

  updateState({ status: "initializing", currentStep: 0, totalSteps: 5 });
  if (process.env.DEBUG_ALWAYS_RETURN_UPDATED) {
    displayMessage("Forcing update");
  }

  try {
    await checkConda();
    // await updateConda();
    // check if there are any packages actually installed inside of conda
    const isUpdated = await syncRepo();
    if (!isUpdated) {
      updateState({ status: "ready", currentStep: 5, totalSteps: 5 });
      return true;
    }

    updateState({ status: "installing", currentStep: 3 });
    const {
      initializeApp,
      setupReactUI,
      repairTorch,
    } = require("./js/initializeApp.js");
    await initializeApp();
    updateState({ torchReady: true, currentStep: 4 });
    await setupReactUI();
    updateState({ reactUIReady: true, currentStep: 5 });
    await repairTorch();

    AppliedGitVersion.save();
    updateState({ status: "ready", currentStep: 5, totalSteps: 5 });
    return true;
  } catch (error) {
    updateState({ status: "error", lastError: error.message });
    displayError(error.message);
    return false;
  }
}

main().then((result) => {
  displayMessage("\n\nFinished init app.\n");
  return setTimeout(() => processExit(result ? 0 : 1), 100);
});
