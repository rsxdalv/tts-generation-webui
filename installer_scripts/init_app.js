// import fs from "fs";
// import { $, $$, $sh } from "./js/shell";
// import { initializeApp, repairTorch, setupReactUI } from "./js/initializeApp.mjs";
// import { displayError, displayMessage } from "./js/displayMessage.mjs";
// import { processExit } from "./js/processExit.mjs";
const fs = require("fs");
const { $, $$, $sh } = require("./js/shell");
const { displayError, displayMessage } = require("./js/displayMessage.js");
const { processExit } = require("./js/processExit.js");

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
  const version = "0.0.3";
  displayMessage("\n\nStarting init app (version: " + version + ")...\n\n");
  try {
    await checkConda();
    // await updateConda();
    const isUpdated = await syncRepo();
    if (!isUpdated) {
      // return;
    }
    const {
      initializeApp,
      repairTorch,
      setupReactUI,
    } = require("./js/initializeApp.js");
    await initializeApp();
    await setupReactUI();
    await repairTorch();
  } catch (error) {
    displayError(error.message);
    processExit(1);
  }
  displayMessage("\n\nFinished init app.\n");
  // processExit(1);
  processExit(0);
}

main();
