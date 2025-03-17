````markdown
# Focus Flow - Pomodoro Timer App 🌳

A modern, gamified Pomodoro timer application to help you stay focused and track your productivity.

## Features ✨

- **Customizable Focus Sessions**
  - Adjustable focus duration via dropdown
  - Default break time of 5 minutes
  - Option to skip breaks
- **Visual Timer**
  - Animated growing tree visualization
  - Circular timer with dynamic dashed border
  - Color-coded status indicators
    - Green: Session in progress
    - Red: Session nearly complete
- **Progress Tracking**
  - Daily focus hours logged
  - Break time tracking
  - Weekly progress visualization
  - Streak system with 🔥 for consecutive days
- **Smart Notifications**
  - Audio alerts for session end
  - Warning sounds when time is running low
  - Optional YouTube Music integration
- **Theme Support**
  - Light/Dark mode toggle
  - System theme detection
  - Responsive color schemes

## Technical Stack 🛠

- Vanilla JavaScript
- Tailwind CSS
- Web Storage API
- YouTube Music Embed API

## Getting Started 🚀

1. Clone the repository
2. Open `index.html` in your browser
3. Set your preferred focus duration
4. Click Start to begin your session

## Data Storage 💾

The app uses local web storage to maintain:

- Focus session history
- Break time logs
- Daily streaks
- Theme preferences

## Theme Customization 🎨

The app includes two theme modes:

```css
/* Light Theme */
.light-theme {
  --primary: #4CAF50;
  --background: #ffffff;
  --text: #333333;
  --accent: #2196F3;
  --warning: #f44336;
}

/* Dark Theme */
.dark-theme {
  --primary: #81C784;
  --background: #121212;
  --text: #ffffff;
  --accent: #64B5F6;
  --warning: #FF5252;
```
````
