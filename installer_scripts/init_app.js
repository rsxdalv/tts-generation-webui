const fs = require("fs");
const http = require("http");
const { resolve } = require("path");
const { $ } = require("./js/shell");
const { displayError, displayMessage } = require("./js/displayMessage.js");
const { processExit } = require("./js/processExit.js");

const checkConda = async () => {
  try {
    displayMessage("Checking conda installation...");
    await $("conda --version");
    displayMessage("");
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
      await $("git pull");
      const newHash = getGitCommitHash();
      if (AppliedGitVersion.get() === newHash) {
        displayMessage("Current git version: " + newHash);
        displayMessage("No updates found, skipping...");
        return false || DEBUG_ALWAYS_RETURN_UPDATED;
      }
      return true;
    } catch (error) {
      displayMessage(
        "There was a problem while pulling updates. Warning: missing updates might cause issues. Continuing..."
      );
      displayError(error);
      // throw error;
    }
  }
};

async function main() {
  // streamOutput();

  const version = "0.0.6";
  displayMessage("\n\nStarting init app (version: " + version + ")...\n\n");

  if (process.env.DEBUG_ALWAYS_RETURN_UPDATED) {
    displayMessage("Forcing update");
  }

  try {
    await checkConda();
    // await updateConda();
    // check if there are any packages actually installed inside of conda
    const isUpdated = await syncRepo();
    if (!isUpdated) return;

    const {
      initializeApp,
      setupReactUI,
      repairTorch,
    } = require("./js/initializeApp.js");
    await initializeApp();
    await setupReactUI();
    await repairTorch();

    AppliedGitVersion.save();
  } catch (error) {
    displayError(error.message);
    processExit(1);
  }
  displayMessage("\n\nFinished init app.\n");
  processExit(0);
}

main();

function streamOutput() {
  // Create a buffer to store output for new connections
  let outputBuffer = [];
  let clients = [];

  // Hook into stdout to capture output
  const originalStdoutWrite = process.stdout.write;
  process.stdout.write = function (chunk, encoding, callback) {
    // Convert chunk to string
    const data = chunk.toString();

    // Store in our buffer for new connections
    outputBuffer.push(data);
    // Keep the buffer at a reasonable size
    if (outputBuffer.length > 1000) {
      outputBuffer.shift();
    }

    // Send to all connected clients
    clients.forEach((client, index) => {
      try {
        client.write(data);
      } catch (error) {
        // If we can't write to the client, remove it from our list
        clients.splice(index, 1);
      }
    });

    // Pass through to original stdout
    return originalStdoutWrite.apply(process.stdout, arguments);
  };

  // Create HTTP server that streams stdout
  const server = http
    .createServer(function (req, res) {
      res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      // Send the current buffer first
      outputBuffer.forEach((chunk) => {
        res.write(chunk);
      });

      // Add this client to our list
      clients.push(res);

      // Handle client disconnect
      req.on("close", function () {
        const index = clients.indexOf(res);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      });

      // Close the connection after 5 seconds
      setTimeout(() => {
        res.end();
        const index = clients.indexOf(res);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      }, 5000);
    })
    .listen(8080);
}
