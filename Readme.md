PULSE: Personal Unified Lifestyle and Smart Empowerment

PULSE is a comprehensive health dashboard designed to unify health tracking, expert connections, and AI insights into a single, user-friendly interface. It features a dark-themed, responsive design built with standard HTML5, CSS3, and Vanilla JavaScript.

Features

Unified Dashboard: Track Activity, Sleep, Stress, and Nutrition scores in real-time.

AI Integration: Built-in Gemini AI assistant for health queries (supports text and voice).

Health Tools: BMI Calculator, Symptom Checker, and Report Generator (PDF).

Planning: Custom Nutrition and Workout planners.

Telemedicine: Simulated video consultation interface and appointment booking.

PWA Ready: Installable on mobile devices as a Progressive Web App.

Local Storage: Persists user data locally in the browser.

Project Structure

pulse-health-dashboard/
├── css/
│   └── style.css       # Custom styles and animations
├── js/
│   └── app.js          # Core logic, charts, and API handling
├── index.html          # Main application structure
├── manifest.json       # PWA manifest
└── service-worker.js   # Offline capabilities


Setup & Usage

Clone the repository:

git clone [https://github.com/adityajha-coder/pulse-dashboard.git](https://github.com/adityajha-coder/pulse-dashboard.git)


API Key Configuration:

Open js/app.js.

Locate const apiKey = ""; around line 100.

Insert your Google Gemini API key to enable the AI chatbot features.

Run Locally:

Open index.html in any modern web browser.

For PWA features (installation), serve the folder using a local server (e.g., VS Code Live Server or Python http.server).

Technologies Used

Frontend: HTML5, CSS3, JavaScript (ES6+)

Styling: Tailwind CSS (CDN)

Icons: Lucide Icons

Charts: Chart.js

PDF Generation: jsPDF

AI: Google Gemini API
