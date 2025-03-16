const state = {
    timeLeft: 0,
    isRunning: false,
    isBreak: false,
    totalSeconds: 0,
    streak: 0,
    todayHours: 0,
    weeklyData: Array(7).fill(0),
    theme: 'system'
};

// DOM Elements
const elements = {
    timeDisplay: document.getElementById('timeDisplay'),
    startBtn: document.getElementById('startBtn'),
    skipBtn: document.getElementById('skipBtn'),
    focusTime: document.getElementById('focusTime'),
    timerRing: document.querySelector('#timerRing circle'),
    youtubePlayer: document.getElementById('youtubePlayer'),
    tree: document.getElementById('tree'),
    weekBars: document.getElementById('weekBars'),
    streak: document.getElementById('streak'),
    todayHours: document.getElementById('todayHours')
};

// Initialize
function init() {
    loadState();
    setupTheme();
    setupTimerRing();
    renderWeekBars();
    updateStatsDisplay();

    elements.startBtn.addEventListener('click', toggleTimer);
    elements.skipBtn.addEventListener('click', skipBreak);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

function setupTimerRing() {
    const radius = elements.timerRing.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    // Corrected: Remove backslashes so that interpolation works
    elements.timerRing.style.strokeDasharray = `${circumference} ${circumference}`;
    elements.timerRing.style.strokeDashoffset = circumference;
}

function updateTimerRing(percent) {
    const circumference = elements.timerRing.r.baseVal.value * 2 * Math.PI;
    const offset = circumference - (percent * circumference);
    elements.timerRing.style.strokeDashoffset = offset;
    elements.timerRing.style.stroke = percent < 0.1 ? '#ef4444' : '#22c55e';
}

function toggleTimer() {
    if (state.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    state.isRunning = true;
    state.totalSeconds = state.isBreak ? 300 : parseInt(elements.focusTime.value) * 60;
    state.timeLeft = state.totalSeconds;
    elements.startBtn.textContent = 'Pause';
    elements.tree.classList.add('growing-tree');
    
    if (state.isBreak) {
        elements.skipBtn.classList.remove('hidden');
    }
    
    const timerInterval = setInterval(() => {
        state.timeLeft--;
        updateDisplay();
        
        const percent = state.timeLeft / state.totalSeconds;
        updateTimerRing(percent);
        
        if (state.timeLeft <= 5) {
            document.getElementById('alertSound').play();
        }
        
        if (state.timeLeft <= 0) {
            clearInterval(timerInterval);
            finishSession();
        }
    }, 1000);
}

function pauseTimer() {
    state.isRunning = false;
    elements.startBtn.textContent = 'Resume';
    elements.tree.classList.remove('growing-tree');
}

function finishSession() {
    state.isRunning = false;
    
    if (!state.isBreak) {
        state.todayHours += parseInt(elements.focusTime.value);
        state.weeklyData[new Date().getDay()] += parseInt(elements.focusTime.value);
        updateStreak();
        saveState();
    }
    
    state.isBreak = !state.isBreak;
    elements.startBtn.textContent = state.isBreak ? 'Start Break' : 'Start Focus';
    elements.skipBtn.classList.add('hidden');
    
    if (state.isBreak && document.getElementById('youtubeEnabled').checked) {
        elements.youtubePlayer.classList.remove('hidden');
        elements.youtubePlayer.querySelector('iframe').src = 
            'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1';
    }
    
    updateStatsDisplay();
}

function skipBreak() {
    state.isBreak = false;
    elements.startBtn.textContent = 'Start Focus';
    elements.youtubePlayer.classList.add('hidden');
    elements.skipBtn.classList.add('hidden');
}

function updateDisplay() {
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    elements.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateStreak() {
    const lastDate = localStorage.getItem('lastFocusDate');
    const today = new Date().toDateString();
    
    if (lastDate === today) return;
    
    const lastFocusDate = new Date(lastDate);
    const dayDiff = (new Date(today) - lastFocusDate) / (1000 * 3600 * 24);
    
    if (!lastDate || dayDiff === 1) {
        state.streak++;
    } else if (dayDiff > 1) {
        state.streak = 1;
    }
    
    localStorage.setItem('lastFocusDate', today);
    // Corrected: Remove backslashes from template literal
    elements.streak.textContent = `${state.streak}${state.streak >= 2 ? '🔥' : ''}`;
}

function renderWeekBars() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    elements.weekBars.innerHTML = days.map((day, index) => `
        <div class="flex flex-col items-center">
            <div class="day-bar w-8 bg-green-400 rounded-t" 
                 style="height: ${state.weeklyData[index] * 30}px"></div>
            <span class="text-sm dark:text-white">${day}</span>
        </div>
    `).join('');
}

function updateStatsDisplay() {
    elements.todayHours.textContent = `${state.todayHours}h`;
    renderWeekBars();
}

// Theme Management
function setupTheme() {
    state.theme = localStorage.getItem('theme') || 'system';
    if (state.theme === 'dark' || (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    setupTheme();
}

// Persistence
function saveState() {
    localStorage.setItem('pomondoroState', JSON.stringify({
        ...state,
        lastFocusDate: localStorage.getItem('lastFocusDate')
    }));
}

function loadState() {
    const saved = localStorage.getItem('pomondoroState');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state, parsed);
    }
    // Initialize weeklyData if not present
    if (!state.weeklyData || state.weeklyData.length !== 7) {
        state.weeklyData = Array(7).fill(0);
    }
}

// Initialize the app
init();

