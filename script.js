 // -------------------- Global Variables & Local Storage --------------------
    let timer, currentSessionSeconds, currentDuration; // duration in minutes
    let isFocus = true;
    let totalFocus = parseInt(localStorage.getItem('totalFocus')) || 0; // in minutes
    let totalBreak = parseInt(localStorage.getItem('totalBreak')) || 0; // in minutes
    let streak = parseInt(localStorage.getItem('streak')) || 0;
    let lastSessionDate = localStorage.getItem('lastSessionDate') || "";
    // weeklyFocus: object with keys as dates (YYYY-MM-DD) and values as focus minutes
    let weeklyFocus = JSON.parse(localStorage.getItem('weeklyFocus')) || {};
    // Maximum focus (in minutes) for full colour intensity (example: 2400 minutes = 40 hours)
    const maxFocusForIntensity = 2400;
    let musicEnabled = localStorage.getItem('musicEnabled') === 'true';

    // -------------------- DOM Elements --------------------
    const timerDisplay = document.getElementById('timerDisplay');
    const timerRing = document.getElementById('timerRing');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
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

    // -------------------- Sounds --------------------
    const endSound = new Audio('https://actions.google.com/sounds/v1/alerts/beep.ogg');
    const warningSound = new Audio('https://actions.google.com/sounds/v1/alerts/ding.ogg');

    // -------------------- YouTube Music (Basic Embed Logic) --------------------
    function playBreakMusic() {
      if (musicEnabled) {
     
        youtubePlayer.src = "https://www.youtube.com/embed/v=jfKfPfyJRdk?autoplay=1";
        musicPlayer.classList.remove('hidden');
      }
    }
    function stopBreakMusic() {
      youtubePlayer.src = "";
      musicPlayer.classList.add('hidden');
    }

    // -------------------- Timer Functions --------------------
    function startTimer(duration) {
      currentDuration = duration; // minutes
      currentSessionSeconds = duration * 60;
      const startTime = Date.now();
      updateTimerDisplay(currentSessionSeconds, duration);
      animateTree(duration * 60, currentSessionSeconds);

      clearInterval(timer);
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        currentSessionSeconds = duration * 60 - elapsed;

        if (currentSessionSeconds <= 0) {
          clearInterval(timer);
          currentSessionSeconds = 0;
          updateTimerDisplay(0, duration);
          animateTree(duration * 60, 0);
          handleSessionEnd();
          return;
        }

        // For focus sessions, change timer ring to red when less than 60 sec remain
        if (currentSessionSeconds <= 60 && isFocus) {
          timerRing.classList.remove('stroke-green-500');
          timerRing.classList.add('stroke-red-500');
          if (currentSessionSeconds % 2 === 0) warningSound.play();
        } else {
          if (isFocus) {
            timerRing.classList.remove('stroke-red-500');
            timerRing.classList.add('stroke-green-500');
          } else {
            timerRing.classList.remove('stroke-red-500');
            timerRing.classList.add('stroke-blue-500');
          }
        }

        updateTimerDisplay(currentSessionSeconds, duration);
        animateTree(duration * 60, currentSessionSeconds);
      }, 1000);
    }

    function updateTimerDisplay(seconds, duration) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

      const circumference = 283; // Based on circle r=45
      const offset = circumference - (circumference * (seconds / (duration * 60)));
      timerRing.style.strokeDashoffset = offset;
    }

    // Animate tree using provided focus growth code combined with oscillation effect
    function animateTree(totalSeconds, remainingSeconds) {
      const growthStages = ['🌱', '🌿', '🌳'];
      const progress = 1 - (remainingSeconds / totalSeconds);
      const stage = Math.min(Math.floor(progress * growthStages.length), growthStages.length - 1);
      tree.textContent = growthStages[stage];
      const oscillation = 1 + 0.05 * Math.sin(Date.now() / 250);
      tree.style.transform = `scale(${(1 + progress) * oscillation})`;
    }

    // -------------------- Session & Dashboard Logic --------------------
    function handleSessionEnd() {
      endSound.play();
      if (isFocus) {
        totalFocus += parseInt(focusSelect.value);
        localStorage.setItem('totalFocus', totalFocus);
        totalFocusDisplay.textContent = `${Math.floor(totalFocus / 60)}h`;
        updateWeeklyFocus(parseInt(focusSelect.value));
        updateStreak();

        playBreakMusic();
        skipBreakButton.classList.remove('hidden');
        isFocus = false;
        setTimeout(() => startBreak(), 1000);
      } else {
        totalBreak += parseInt(breakSelect.value);
        localStorage.setItem('totalBreak', totalBreak);
        totalBreakDisplay.textContent = `${Math.floor(totalBreak / 60)}h`;
        stopBreakMusic();
        skipBreakButton.classList.add('hidden');
        isFocus = true;
        startFocus();
      }
      updateDashboard();
      // Reset buttons: show Start and hide Stop after a session ends
      startButton.classList.remove('hidden');
      stopButton.classList.add('hidden');
    }

    function startFocus() {
      isFocus = true;
      timerRing.classList.remove('stroke-red-500', 'stroke-blue-500');
      timerRing.classList.add('stroke-green-500');
      startTimer(parseInt(focusSelect.value));
      startButton.classList.add('hidden');
      stopButton.classList.remove('hidden');
    }

    function startBreak() {
      isFocus = false;
      timerRing.classList.remove('stroke-green-500', 'stroke-red-500');
      timerRing.classList.add('stroke-blue-500');
      startTimer(parseInt(breakSelect.value));
      startButton.classList.add('hidden');
      stopButton.classList.remove('hidden');
    }

    function stopSession() {
      clearInterval(timer);
      stopBreakMusic();
      timerDisplay.textContent = `${focusSelect.value}:00`;
      tree.style.transform = 'scale(1)';
      timerRing.style.strokeDashoffset = 283;
      startButton.classList.remove('hidden');
      stopButton.classList.add('hidden');
    }

    function skipBreak() {
      clearInterval(timer);
      stopBreakMusic();
      skipBreakButton.classList.add('hidden');
      isFocus = true;
      startFocus();
    }

    function updateStreak() {
      const today = new Date().toISOString().slice(0, 10);
      if (lastSessionDate === today) {
        // already logged today
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = (lastSessionDate === yesterday) ? streak + 1 : 1;
        lastSessionDate = today;
        localStorage.setItem('lastSessionDate', today);
        localStorage.setItem('streak', streak);
      }
      // Show fire emoji for streaks of 2 or more
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
        // Create a container for the bar and day label
        const dayContainer = document.createElement('div');
        dayContainer.className = 'flex flex-col items-center';
        const bar = document.createElement('div');
        bar.className = 'bg-green-500 day-bar w-6';
        bar.style.height = `${percentage}%`;
        bar.title = `${day}: ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
        const dayLabel = document.createElement('span');
        // Get abbreviated weekday (Mon, Tue, etc.)
        const weekday = new Date(day).toLocaleDateString('en-US', { weekday: 'short' });
        dayLabel.textContent = weekday;
        dayLabel.className = 'mt-1 text-sm';
        dayContainer.appendChild(bar);
        dayContainer.appendChild(dayLabel);
        weekBars.appendChild(dayContainer);
      });
    }

    // Render Focus Activity grid card (small boxes for each of the last 7 days)
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

    // GitHub Tracker: green box intensifies with focus activity
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
      if (selection === "system") {
        document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else if (selection === "dark") {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', selection);
    }
    themeSelect.addEventListener('change', updateTheme);
    const storedTheme = localStorage.getItem('theme') || 'system';
    themeSelect.value = storedTheme;
    updateTheme();

    musicToggle.checked = musicEnabled;
    musicToggle.addEventListener('change', () => {
      musicEnabled = musicToggle.checked;
      localStorage.setItem('musicEnabled', musicEnabled);
    });

    // -------------------- Event Listeners --------------------
    startButton.addEventListener('click', startFocus);
    stopButton.addEventListener('click', stopSession);
    skipBreakButton.addEventListener('click', skipBreak);

    // -------------------- Initialization --------------------
    window.addEventListener('DOMContentLoaded', () => {
      updateDashboard();
      timerDisplay.textContent = `${focusSelect.value}:00`;
    });