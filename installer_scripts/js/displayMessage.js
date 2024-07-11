const sendToWebConsole = (message) => void message;

const displayMessage = async (...message) => {
  console.log(...message);
  await sendToWebConsole(message.join(" "));
};
exports.displayMessage = displayMessage;

const displayError = async (...message) => {
  console.error(...message);
  await sendToWebConsole(message.join(" "));
};
exports.displayError = displayError;
