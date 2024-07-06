const { spawn, execSync } = require("child_process");

const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", (error) => reject(new Error(`Error: ${error.message}`)));
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Command failed with exit code ${code}`))
    );
  });

const $ = (command) =>
  console.log(`>${command}`) ||
  runCommand(command.split(" ")[0], command.split(" ").slice(1));

exports.$ = $;

const $$ = (command) =>
  console.log(`>${command.join(" ")}`) ||
  runCommand(command[0], command.slice(1));

exports.$$ = $$;

function $sh(cmd) {
  try {
    return execSync(cmd, { stdio: "inherit" });
  } catch (error) {
    try {
      console.error(error.stderr.toString().trim(), error.status);
    } catch (e) {
      console.error(error);
    }
    throw error;
  }
}

exports.$sh = $sh;
