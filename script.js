// -------------------- Global Variables & Local Storage --------------------
let totalFocus = parseInt(localStorage.getItem('totalFocus')) || 0; // in minutes
let totalBreak = parseInt(localStorage.getItem('totalBreak')) || 0; // in minutes
let streak = parseInt(localStorage.getItem('streak')) || 0;
let lastSessionDate = localStorage.getItem('lastSessionDate') || "";
// weeklyFocus: object with keys as dates (YYYY-MM-DD) and values as focus minutes
let weeklyFocus = JSON.parse(localStorage.getItem('weeklyFocus')) || {};
// Maximum focus (in minutes) for full colour intensity (example: 2400 minutes = 40 hours)
const maxFocusForIntensity = 2400;
let musicEnabled = localStorage.getItem('musicEnabled') === 'true';

// -------------------- Timer State Management --------------------
const timerState = {
  intervalID: null,
  totalSeconds: 0,
  remainingSeconds: 0,
  isPaused: false,
  mode: "focus" // either "focus" or "break"
};

// -------------------- DOM Elements --------------------
const timerDisplay = document.getElementById('timerDisplay');
const timerRing = document.getElementById('timerRing');
const urlForm = document.getElementById('urlForm');
const startButton = document.getElementById('startButton');
// Removed stopButton logic as per request
const tree = document.getElementById('tree');
const focusSelect = document.getElementById('focusTime');
const breakSelect = document.getElementById('breakTime');
const skipBreakButton = document.getElementById('skipBreak');
const streakCounter = document.getElementById('streakCounter');
const weekBars = document.getElementById('weekBars');
const totalFocusDisplay = document.getElementById('totalFocus');
const totalBreakDisplay = document.getElementById('totalBreak');
const themeSelect = document.getElementById('themeSelect');
const musicToggle = document.getElementById('musicToggle');
const githubTracker = document.getElementById('githubTracker');
const focusActivityGrid = document.getElementById('focusActivityGrid');
const musicPlayer = document.getElementById('musicPlayer');
const youtubePlayer = document.getElementById('youtubePlayer');
const pauseButton = document.getElementById('pauseButton');
// Snackbar element (make sure an element with id "snackbar" exists in your HTML)
const snackbar = document.getElementById('snackbar');

// -------------------- Sounds --------------------
const endSound = new Audio('https://actions.google.com/sounds/v1/alerts/beep.ogg');
const warningSound = new Audio('https://actions.google.com/sounds/v1/alerts/ding.ogg');

// -------------------- Snackbar Notification --------------------
function showSnackbar(message, type) {
  // type: "success" for green, "error" for red
  if (!snackbar) return; // if no element found, simply return
  snackbar.textContent = message;
  snackbar.style.backgroundColor = type === "success" ? "#4CAF50" : "#F44336";
  snackbar.className = "show";
  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
  }, 3000);
}

// -------------------- YouTube ID Extraction --------------------
function extractYoutubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// -------------------- YouTube Music Logic --------------------
// Process the URL form submission to set the YouTube video ID and show a snackbar message.
urlForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const customMusicUrl = document.getElementById('videoUrl').value;
  const videoId = customMusicUrl ? extractYoutubeId(customMusicUrl) : 'jfKfPfyJRdk';
  if (videoId) {
    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

    // Add animation keyframes to snackbar
    showSnackbar("YouTube Break Music loaded successfully!", "success");
    musicPlayer.classList.remove('hidden');    // Apply animation
    snackbar.style.animation = 'slideIn 0.5s ease-out, fadeOut 0.5s ease-out 2.5s';
    // Remove animation after it completes
    setTimeout(() => {
      snackbar.style.animation = '';
    }, 3000);
    // Reset the form and hide it
    urlForm.reset();
    if (!urlForm.classList.contains('hidden')) {
      urlForm.classList.add('hidden');
    }
    // Save the musicEnabled state
    localStorage.setItem('musicEnabled', musicEnabled.toString());
    // Update the music toggle button text
    musicToggle.textContent = musicEnabled ? "Disable Break Time Music" : "Enable  Break Time Music";
    // Update the music toggle button color
    musicToggle.style.backgroundColor = musicEnabled ? "#4CAF50" : "#F44336";
    // Update the music toggle button text color
    musicToggle.style.color = musicEnabled ? "white" : "black";
    // Update the music toggle button border color
    musicToggle.style.borderColor = musicEnabled ? "#4CAF50" : "#F44336";
    // Update the music toggle button hover color
    musicToggle.style.hoverColor = musicEnabled ? "#4CAF50" : "#F44336";

    urlForm.classList.add('hidden');
  } else {
    showSnackbar("Error: Invalid YouTube URL!", "error");
  }
});

// If there's a separate "load" button, trigger form submission when clicked.
const loadButton = document.getElementById('loadButton');
if (loadButton) {
  loadButton.addEventListener('click', () => {
    urlForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });
}

function playBreakMusic() {
  if (musicEnabled) {
    const storedVideoUrl = localStorage.getItem('videoUrl');
    let videoId = 'jfKfPfyJRdk'; // Default video ID

    if (storedVideoUrl) {
      const extracted = extractYoutubeId(storedVideoUrl);
      if (extracted) {
        videoId = extracted;
      } else {
        showSnackbar("Error: Invalid YouTube URL!", "error");
        videoId = 'jfKfPfyJRdk'; // Fallback to default if extraction fails
      }
    }

    // Add parameters to prevent playback issues
    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`;
    musicPlayer.classList.remove('hidden');
  }
}

function stopBreakMusic() {
  youtubePlayer.src = "";
  musicPlayer.classList.add('hidden');
}

// -------------------- Timer Functions --------------------
function updateTimerDisplay(seconds, totalSeconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  const circumference = 283;
  const offset = circumference - (circumference * (seconds / totalSeconds));
  timerRing.style.strokeDashoffset = offset;
}

function animateTree(total, current) {
  // Example animation: scale the tree element based on time progress.
  const progress = current / total;
  const scale = 1 + (1 - progress) * 0.5; // scales from 1 to 1.5 as time elapses
  tree.style.transform = `scale(${scale})`;
}

function startTimer(durationMinutes, mode) {
  timerState.mode = mode;
  timerState.totalSeconds = durationMinutes * 60;
  timerState.remainingSeconds = timerState.totalSeconds;
  timerState.isPaused = false;
  // Enable Pause button when timer starts
  pauseButton.disabled = false;
  // Ensure Pause button shows "Pause"
  pauseButton.textContent = 'Pause';
  clearInterval(timerState.intervalID);
  timerState.intervalID = setInterval(() => {
    timerState.remainingSeconds--;
    if (timerState.remainingSeconds <= 0) {
      clearInterval(timerState.intervalID);
      timerState.remainingSeconds = 0;
      updateTimerDisplay(0, timerState.totalSeconds);
      animateTree(timerState.totalSeconds, 0);
      handleSessionEnd();
      return;
    }
    updateTimerDisplay(timerState.remainingSeconds, timerState.totalSeconds);
    animateTree(timerState.totalSeconds, timerState.remainingSeconds);
  }, 1000);
}

function pauseTimer() {
  timerState.isPaused = true;
  clearInterval(timerState.intervalID);
  document.getElementById('pauseIcon').classList.remove('hidden');
}

function resumeTimer() {
  timerState.isPaused = false;
  document.getElementById('pauseIcon').classList.add('hidden');
  clearInterval(timerState.intervalID);
  timerState.intervalID = setInterval(() => {
    timerState.remainingSeconds--;
    if (timerState.remainingSeconds <= 0) {
      clearInterval(timerState.intervalID);
      timerState.remainingSeconds = 0;
      updateTimerDisplay(0, timerState.totalSeconds);
      animateTree(timerState.totalSeconds, 0);
      handleSessionEnd();
      return;
    }
    updateTimerDisplay(timerState.remainingSeconds, timerState.totalSeconds);
    animateTree(timerState.totalSeconds, timerState.remainingSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerState.intervalID);
  timerState.remainingSeconds = 0;
  timerState.totalSeconds = 0;
  timerState.isPaused = false;
  pauseButton.disabled = true;
}

// -------------------- Pause Button Logic --------------------
pauseButton.addEventListener('click', () => {
  if (!timerState.isPaused && timerState.totalSeconds > 0) {
    pauseTimer();
    pauseButton.textContent = 'Resume';
    pauseButton.classList.add('bg-green-500');
  } else if (timerState.totalSeconds > 0) {
    resumeTimer();
    pauseButton.textContent = 'Pause';
    pauseButton.classList.remove('bg-green-500');
  }
});

// -------------------- Session & Dashboard Logic --------------------
function handleSessionEnd() {
  endSound.play();
  if (timerState.mode === "focus") {
    const focusDuration = parseInt(focusSelect.value);
    totalFocus += focusDuration;
    localStorage.setItem('totalFocus', totalFocus);
    totalFocusDisplay.textContent = `${Math.floor(totalFocus / 60)}h`;
    updateWeeklyFocus(focusDuration);
    updateStreak();
    playBreakMusic();
    skipBreakButton.classList.remove('hidden');
    // Switch to break mode after a brief delay
    setTimeout(() => startBreak(), 1000);
  } else {
    const breakDuration = parseInt(breakSelect.value);
    totalBreak += breakDuration;
    localStorage.setItem('totalBreak', totalBreak);
    totalBreakDisplay.textContent = `${Math.floor(totalBreak / 60)}h`;
    stopBreakMusic();
    skipBreakButton.classList.add('hidden');
    // Switch back to focus mode
    startFocus();
  }
  updateDashboard();
  // Undo any animations and reset timer display
  tree.style.transform = 'scale(1)';
  timerRing.style.strokeDashoffset = 283;
  timerDisplay.textContent = `${focusSelect.value}:00`;
  stopTimer();
}

function startFocus() {
  timerRing.classList.remove('stroke-red-500', 'stroke-blue-500');
  timerRing.classList.add('stroke-green-500');
  startTimer(parseInt(focusSelect.value), "focus");
  startButton.classList.add('hidden');
  pauseButton.classList.remove('hidden');
}

function startBreak() {
  timerRing.classList.remove('stroke-green-500', 'stroke-red-500');
  timerRing.classList.add('stroke-blue-500');
  startTimer(parseInt(breakSelect.value), "break");
  startButton.classList.add('hidden');
  pauseButton.classList.remove('hidden');
}

function skipBreak() {
  clearInterval(timerState.intervalID);
  stopBreakMusic();
  skipBreakButton.classList.add('hidden');
  startFocus();
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (lastSessionDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = (lastSessionDate === yesterday) ? streak + 1 : 1;
    lastSessionDate = today;
    localStorage.setItem('lastSessionDate', today);
    localStorage.setItem('streak', streak);
  }
  streakCounter.textContent = streak >= 2 ? `🔥 x ${streak}` : streak;
}

function updateWeeklyFocus(sessionMinutes) {
  const today = new Date().toISOString().slice(0, 10);
  weeklyFocus[today] = (weeklyFocus[today] || 0) + sessionMinutes;
  localStorage.setItem('weeklyFocus', JSON.stringify(weeklyFocus));
  renderWeekChart();
  renderFocusActivity();
}

function renderWeekChart() {
  weekBars.innerHTML = '';
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  days.forEach(day => {
    const minutes = weeklyFocus[day] || 0;
    const percentage = Math.min((minutes / 480) * 100, 100);
    const dayContainer = document.createElement('div');
    dayContainer.className = 'flex flex-col items-center';
    const bar = document.createElement('div');
    bar.className = 'bg-green-500 day-bar w-6';
    bar.style.height = `${percentage}%`;
    bar.title = `${day}: ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const dayLabel = document.createElement('span');
    const weekday = new Date(day).toLocaleDateString('en-US', { weekday: 'short' });
    dayLabel.textContent = weekday;
    dayLabel.className = 'mt-1 text-sm';
    dayContainer.appendChild(bar);
    dayContainer.appendChild(dayLabel);
    weekBars.appendChild(dayContainer);
  });
}

function renderFocusActivity() {
  focusActivityGrid.innerHTML = '';
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  days.forEach(day => {
    const minutes = weeklyFocus[day] || 0;
    const intensity = Math.min(minutes / 480, 1);
    const lightness = 80 - 40 * intensity;
    const box = document.createElement('div');
    box.className = 'w-10 h-10 rounded';
    box.style.backgroundColor = `hsl(120, 50%, ${lightness}%)`;
    box.title = `${day}: ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    focusActivityGrid.appendChild(box);
  });
}

function updateGithubTracker() {
  const intensity = Math.min(totalFocus / maxFocusForIntensity, 1);
  const lightness = 80 - 40 * intensity;
  githubTracker.style.backgroundColor = `hsl(120, 50%, ${lightness}%)`;
  githubTracker.textContent = `Focus Activity: ${Math.floor(totalFocus / 60)}h ${totalFocus % 60}m`;
}

function updateDashboard() {
  totalFocusDisplay.textContent = `${Math.floor(totalFocus / 60)}h`;
  totalBreakDisplay.textContent = `${Math.floor(totalBreak / 60)}h`;
  renderWeekChart();
  renderFocusActivity();
  updateGithubTracker();
}

// -------------------- Theme & Music Toggle --------------------
function updateTheme() {
  const selection = themeSelect.value;
  document.documentElement.classList.remove('dark', 'light');

  if (selection === "system") {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
  } else {
    document.documentElement.classList.add(selection);
  }

  localStorage.setItem('theme', selection);
}

// Listen for system theme changes and select changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
themeSelect.addEventListener('change', updateTheme);

// Set initial theme
const storedTheme = localStorage.getItem('theme') || 'system';
themeSelect.value = storedTheme;
updateTheme();

// Music toggle: show/hide the URL form and update localStorage
musicToggle.checked = musicEnabled;
musicToggle.addEventListener('click', () => {
  urlForm.classList.toggle('hidden');
});
musicToggle.addEventListener('change', () => {
  musicEnabled = musicToggle.checked;
  localStorage.setItem('musicEnabled', musicEnabled);
});

// -------------------- Event Listeners --------------------
startButton.addEventListener('click', startFocus);
skipBreakButton.addEventListener('click', skipBreak);
focusSelect.addEventListener('change', () => {
  timerDisplay.textContent = `${focusSelect.value}:00`;
});

// -------------------- Initialization --------------------
window.addEventListener('DOMContentLoaded', () => {
  updateDashboard();
  timerDisplay.textContent = `${focusSelect.value}:00`;
  // Disable Pause button if no timer is active.
  if (!timerState.intervalID) {
    pauseButton.disabled = true;
  }
});
