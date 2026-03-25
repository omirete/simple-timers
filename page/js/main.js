// DOM Elements
const customTimersContainer = document.querySelector(".custom-timers");
const display = document.querySelector(".countdown-display");
const timeText = document.querySelector(".time-text");
const buttonContainer = document.querySelector(".button-container");
const cancelBtn = document.querySelector(".cancel-btn");
const addTimerForm = document.querySelector(".add-timer-form");
const timerMinInput = addTimerForm.querySelector('input[name="timer-minutes"]');
const timerSecInput = addTimerForm.querySelector('input[name="timer-seconds"]');

// State
let intervalId = null;
let customTimers = [];
let wakeLockSentinel = null;

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
    const mins = parseInt(timerMinInput.value, 10) || 0;
    const secs = parseInt(timerSecInput.value, 10) || 0;
    const seconds = mins * 60 + secs;
    if (seconds > 0 && (timerMinInput.value !== "" || timerSecInput.value !== "")) {
        customTimers.push(seconds);
        saveCustomTimers();
        renderCustomTimers();
        timerMinInput.value = "";
        timerSecInput.value = "";
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
    requestWakeLock();

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
    requestWakeLock();
    display.classList.add("flash");
    timeText.textContent = "0:00";
    playAlarmSound();
    // Flashing continues until the user presses the cancel button
}

/**
 * Play a soft 3-beep alarm using the Web Audio API
 */
function playAlarmSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beepCount = 3;
    const beepDuration = 0.3; // seconds each beep lasts
    const beepInterval = 1.0; // seconds between beep starts

    for (let i = 0; i < beepCount; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "sine";
        oscillator.frequency.value = 880;

        const startTime = ctx.currentTime + i * beepInterval;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);

        oscillator.start(startTime);
        oscillator.stop(startTime + beepDuration);
    }
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
    releaseWakeLock();
    display.classList.remove("flash");
    display.style.display = "none";
    cancelBtn.style.display = "none";
    buttonContainer.style.display = "flex";
}

/**
 * Keep the screen awake while the app is actively running a timer/alarm.
 * Works in Android PWAs that implement the Wake Lock API.
 * iOS currently has limited/no support, so this fails silently there.
 */
async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    if (document.visibilityState !== "visible") return;
    if (wakeLockSentinel) return;

    try {
        wakeLockSentinel = await navigator.wakeLock.request("screen");
        wakeLockSentinel.addEventListener("release", () => {
            wakeLockSentinel = null;
        });
    } catch (_) {
        // Ignore wake lock failures to avoid disrupting timer behavior
    }
}

/**
 * Release the wake lock when no timer/alarm is active.
 */
async function releaseWakeLock() {
    if (!wakeLockSentinel) return;
    try {
        await wakeLockSentinel.release();
    } catch (_) {
        // Ignore release failures; sentinel listener will clear state when possible
    } finally {
        wakeLockSentinel = null;
    }
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
 * Request fullscreen for a true full-screen PWA experience.
 * - Tries immediately (works on Android without a gesture when launched as a PWA).
 * - Falls back to first user touch/click (required by iOS and some Android builds).
 * - Re-registers the listener whenever fullscreen is exited so it can be restored.
 */
function tryEnterFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) req.call(el).catch(() => {});
}

tryEnterFullscreen();

function onFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!isFullscreen) {
        // Re-enter on the next user interaction
        ['click', 'touchstart'].forEach(evt =>
            document.addEventListener(evt, tryEnterFullscreen, { once: true, passive: true })
        );
    }
}

document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);

// Ensure first touch also triggers fullscreen if the immediate call above was blocked
['click', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, tryEnterFullscreen, { once: true, passive: true })
);

// Wake lock may be released automatically when the page is hidden.
// Re-acquire it when the app becomes visible again and a timer/alarm is active.
document.addEventListener("visibilitychange", () => {
    const countdownActive = display.style.display === "flex";
    if (document.visibilityState === "visible" && countdownActive) {
        requestWakeLock();
    }
});

/**
 * Register service worker
 */
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.error('Service Worker Registration Failed:', err));
  }
  
