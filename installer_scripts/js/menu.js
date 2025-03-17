const readline = require("readline");

const menu = (choices, label) => {
  let selectedIndex = 0;
  const clearMenu = () => {
    readline.moveCursor(process.stdout, 0, -choices.length);
    readline.clearScreenDown(process.stdout);
  };

  const renderMenu = () => {
    choices.forEach((choice, index) => {
      if (index === selectedIndex) {
        console.log(`> ${choice}`);
      } else {
        console.log(`  ${choice}`);
      }
    });
  };

  // Refactored to use a direction parameter for cleaner code
  function updateSelectedIndex(direction) {
    if (direction === "up") {
      selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
    } else if (direction === "down") {
      selectedIndex = (selectedIndex + 1) % choices.length;
    }
    clearMenu();
    renderMenu();
  }

  const handleKeyPress = (resolve) => (str, key) => {
    if (key.name === "up" || key.name === "down") {
      updateSelectedIndex(key.name);
    } else if (key.name === "return") {
      rl.close();
      resolve(choices[selectedIndex]);
    }
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  return new Promise((resolve, reject) => {
    console.log(label);
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    renderMenu();
    rl.input.on("keypress", handleKeyPress(resolve));
  });
};
exports.menu = menu;
