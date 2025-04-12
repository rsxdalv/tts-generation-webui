// In-memory installer state management

// Initial state
let state = {
    status: 'initializing', // initializing, checking_dependencies, updating_repo, installing, ready, error
    currentStep: 0,
    totalSteps: 5,
    lastError: null,
    gitHash: null,
    condaReady: false,
    torchReady: false,
    reactUIReady: false,
    timestamp: new Date().toISOString()
};

// Update the state with new values
function updateState(partialState) {
    state = {
        ...state,
        ...partialState,
        timestamp: new Date().toISOString()
    };

    // Emit state change event to the web console
    emitStateChange();

    return state;
}

// Get the current state
function getState() {
    return state;
}

// Reset state to initial values
function resetState() {
    state = {
        status: 'initializing',
        currentStep: 0,
        totalSteps: 5,
        lastError: null,
        gitHash: null,
        condaReady: false,
        torchReady: false,
        reactUIReady: false,
        timestamp: new Date().toISOString()
    };

    emitStateChange();
    return state;
}

// Import the webConsole module
const { sendStateUpdate } = require('./webConsole');

// Emit state change to web console
function emitStateChange() {
    // Send the current state to the web console
    sendStateUpdate(state);
}

module.exports = {
    updateState,
    getState,
    resetState
};