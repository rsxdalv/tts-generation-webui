// Unified API for sending messages to the web console
// This module combines functionality from longpoll.js and displayMessage.js

// Store messages for long polling
const messages = [];

// Store state updates for polling
const stateUpdates = [];

// Function to send a message to the web console
function sendToWebConsole(message) {
  // Add message to the messages array for long polling
  if (message && typeof message === 'string') {
    messages.push(message);
  }
}

// Function to send a state update to the web console
function sendStateUpdate(state) {
  // Add state update to the stateUpdates array
  stateUpdates.push({
    state,
    timestamp: new Date().toISOString()
  });

  // Keep only the last 20 state updates
  if (stateUpdates.length > 20) {
    stateUpdates.shift();
  }
}

// Function to get all messages (for long polling)
function getMessages() {
  return messages;
}

// Function to get all state updates (for long polling)
function getStateUpdates() {
  return stateUpdates;
}

// Function to get the latest state update
function getLatestStateUpdate() {
  return stateUpdates.length > 0 ? stateUpdates[stateUpdates.length - 1] : null;
}

// Function to clear all messages
function clearMessages() {
  messages.length = 0;
}

// Function to clear all state updates
function clearStateUpdates() {
  stateUpdates.length = 0;
}

// Export the functions
module.exports = {
  sendToWebConsole,
  sendStateUpdate,
  getMessages,
  getStateUpdates,
  getLatestStateUpdate,
  clearMessages,
  clearStateUpdates
};
