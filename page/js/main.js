// DOM Elements
const customTimersContainer = document.querySelector(".custom-timers");
const display = document.querySelector(".countdown-display");
const timeText = document.querySelector(".time-text");
const buttonContainer = document.querySelector(".button-container");
const cancelBtn = document.querySelector(".cancel-btn");
const addTimerForm = document.querySelector(".add-timer-form");
const timerInput = addTimerForm.querySelector('input[name="timer-seconds"]');

// State
let intervalId = null;
let customTimers = [];

// Load and Render Timers on Page Load
loadCustomTimers();

// Event Listeners
addTimerForm.addEventListener("submit", onAddTimer);
cancelBtn.addEventListener("click", cancelCountdown);
display.addEventListener("click", () => {
    if (display.classList.contains("flash")) {
        cancelCountdown();
    }
});

/**
 * Load custom timers from localStorage
 */
function loadCustomTimers() {
    const stored = localStorage.getItem("customTimers");
    customTimers = stored ? JSON.parse(stored) : [];
    renderCustomTimers();
}

/**
 * Save custom timers to localStorage
 */
function saveCustomTimers() {
    localStorage.setItem("customTimers", JSON.stringify(customTimers));
}

/**
 * Render the custom timers to the DOM
 */
function renderCustomTimers() {
    customTimersContainer.innerHTML = "";
    customTimers.forEach((seconds, index) => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("custom-timer-item");

        const startBtn = document.createElement("button");
        startBtn.classList.add("start-timer");
        startBtn.setAttribute("data-seconds", seconds);
        startBtn.textContent = formatTimeNatural(seconds);

        const removeBtn = document.createElement("button");
        removeBtn.classList.add("remove-timer");
        removeBtn.textContent = "x";
        removeBtn.addEventListener("click", () => removeCustomTimer(index));

        startBtn.addEventListener("click", () => startCountdown(seconds));

        itemDiv.appendChild(startBtn);
        itemDiv.appendChild(removeBtn);
        customTimersContainer.appendChild(itemDiv);
    });
}

/**
 * Handler for adding a new custom timer
 */
function onAddTimer(e) {
    e.preventDefault();
    const val = parseInt(timerInput.value, 10);
    if (val > 0) {
        customTimers.push(val);
        saveCustomTimers();
        renderCustomTimers();
        timerInput.value = "";
    }
}

/**
 * Remove a custom timer by index
 */
function removeCustomTimer(index) {
    customTimers.splice(index, 1);
    saveCustomTimers();
    renderCustomTimers();
}

/**
 * Start the countdown for a given time (in seconds)
 */
function startCountdown(timeLeft) {
    // Hide main UI, show countdown
    buttonContainer.style.display = "none";
    display.style.display = "flex";
    cancelBtn.style.display = "block";
    timeText.textContent = formatTime(timeLeft);

    intervalId = setInterval(() => {
        timeLeft--;
        timeText.textContent = formatTime(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(intervalId);
            countdownFinished();
        }
    }, 1000);
}

/**
 * Handle the end of the countdown
 */
function countdownFinished() {
    display.classList.add("flash");
    timeText.textContent = "0:00";

    // After 5 seconds of flashing, reset the UI
    setTimeout(resetUI, 5000);
}

/**
 * Cancel the ongoing countdown
 */
function cancelCountdown() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    resetUI();
}

/**
 * Reset the UI to initial state
 */
function resetUI() {
    display.classList.remove("flash");
    display.style.display = "none";
    cancelBtn.style.display = "none";
    buttonContainer.style.display = "flex";
}

/**
 * Convert seconds to a natural language format:
 * - e.g., "1 h 2 m 5 s", "3 min", "45 s"
 */
function formatTimeNatural(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const remainderAfterHours = seconds % 3600;
    const mins = Math.floor(remainderAfterHours / 60);
    const secs = remainderAfterHours % 60;

    if (hrs > 0) {
        if (mins > 0 && secs > 0) return `${hrs} h ${mins} m ${secs} s`;
        if (mins > 0) return `${hrs} h ${mins} m`;
        if (secs > 0) return `${hrs} h ${secs} s`;
        return `${hrs} h`;
    } else if (mins > 0) {
        if (secs > 0) return `${mins} min ${secs} s`;
        return `${mins} min`;
    } else {
        return `${secs} s`;
    }
}

/**
 * Convert seconds to mm:ss format
 */
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Register service worker
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.error('Service Worker Registration Failed:', err));
  }
  