// =======================================================
// 1. GLOBAL STATE & DATA DECLARATIONS
// =======================================================

let isLoggedIn = false;
let loggedInUser = '';
let plannerChartInstance = null;
let dashboardChartInstance = null;
let currentTheme = 'dark';

const mockGoals = [
    { id: 1, name: "Daily Steps (10,000)", target: 10000, current: 7500, type: "Activity" },
    { id: 2, name: "Sleep Avg (8 hours)", target: 8, current: 8.25, type: "Sleep" },
    { id: 3, name: "Strength Training (3x/wk)", target: 3, current: 2, type: "Workout" },
];
let nextGoalId = 4;

let mockActivities = [
    { id: 1, metric: "STEPS", value: 15000, date: new Date().toLocaleDateString(), type: "Activity" },
    { id: 2, metric: "SLEEP", value: "8 hours", date: new Date(Date.now() - 86400000).toLocaleDateString(), type: "Sleep" },
    { id: 3, metric: "BP", value: "130/85", date: new Date(Date.now() - 2 * 86400000).toLocaleDateString(), type: "Health" },
];
let nextActivityId = 4;

let mockMedications = [
    { id: 101, name: "Metformin (500mg)", schedule: "8:00 AM Daily", status: "Active", adherence: 88, nextDose: "8:00 AM", dosage: "500mg", frequency: "Daily" },
    { id: 102, name: "Vitamin D (1000 IU)", schedule: "1:00 PM Daily", status: "Active", adherence: 95, nextDose: "1:00 PM", dosage: "1000 IU", frequency: "Daily" },
    { id: 103, name: "Aspirin (81mg)", schedule: "6:00 PM Daily", status: "Active", adherence: 75, nextDose: "6:00 PM", dosage: "81mg", frequency: "Daily" },
    { id: 104, name: "Amoxicillin", schedule: "2x/Day for 7 days", status: "Completed", adherence: 100, nextDose: "-", dosage: "250mg", frequency: "Twice Daily" },
];
let nextMedicationId = 105;

let hasNewActivity = false;

let healthScores = {
    activity: 92,
    sleep: 85,
    stress: 79,
    nutrition: 95
};

const NUTRITION_TASKS = [
    { name: 'Log Dinner (Target: 600 kcal)', completed: false, icon: 'apple' },
    { name: 'Drink 8 glasses of water', completed: true, icon: 'droplet' },
    { name: 'Review Macro Breakdown', completed: false, icon: 'utensils' },
    { name: 'Take multivitamin', completed: true, icon: 'milk' }
];

const WORKOUT_TASKS = [
    { name: 'Complete Leg Day Routine', completed: false, icon: 'run' },
    { name: 'Log 1 hour yoga session', completed: true, icon: 'dumbbell' },
    { name: 'Set recovery day reminder', completed: false, icon: 'stretching' },
    { name: 'Check heart rate zones', completed: false, icon: 'heart-pulse' }
];

const apiKey = "";
const geminiUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

let isListening = false;
let recognition = null;
let base64ImageFile = null;

// =======================================================
// 2. GLOBALLY ACCESSED FUNCTIONS
// =======================================================

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function showAuthModal(mode = 'login') {
    const authModal = document.getElementById('auth-modal-backdrop');
    authModal.style.display = 'flex';
    switchAuthMode(null, mode);
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function hideAuthModal() {
    document.getElementById('auth-modal-backdrop').style.display = 'none';
}

function switchAuthMode(event, mode) {
    if (event) event.preventDefault();

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const title = document.getElementById('auth-title');
    const switchToSignupLink = document.getElementById('switch-to-signup');
    const switchToLoginLink = document.getElementById('switch-to-login');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        title.textContent = 'Login to PULSE';
        switchToSignupLink.classList.remove('hidden');
        switchToLoginLink.classList.add('hidden');
    } else if (mode === 'signup') {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        title.textContent = 'Create PULSE Account';
        switchToSignupLink.classList.add('hidden');
        switchToLoginLink.classList.remove('hidden');
    }
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function signOutUser() {
    isLoggedIn = false;
    loggedInUser = '';
    updateHeaderAuthDisplay();
    showView('home');
    showModal('Signed Out', 'You have successfully signed out. Your dashboard data is now protected.', 'Login Again');
}

function showMentalHealthCrisisModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close crisis intervention modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-red-400 flex items-center space-x-2"><i data-lucide="alert-triangle" class="w-7 h-7"></i><span>Immediate Crisis Intervention</span></h3>
        <p class="text-white mb-4" style="color: var(--text-primary);">If you are facing an emergency or feeling unsafe, please choose the option below that best supports you right now. **We are here to listen.**</p>
        <div class="space-y-4">
            <button onclick="crisisAction('Emergency Services')" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="phone" class="w-5 h-5"></i><span>Call Emergency Services (108/102)</span>
            </button>
            <button onclick="crisisAction('National Helpline')" class="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="message-square" class="w-5 h-5"></i><span>Connect to National Helpline (Chat/Call)</span>
            </button>
            <button onclick="crisisAction('Emergency Contact')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="user-plus" class="w-5 h-5"></i><span>Alert Emergency Contact</span>
            </button>
        </div>
        <div class="mt-6 p-4 rounded-lg bg-gray-800 border" style="border-color: var(--input-border);">
            <h4 class="text-base font-semibold mb-2" style="color: var(--text-primary);">Feeling Overwhelmed?</h4>
            <p class="text-xs text-gray-400">If you are not in immediate danger, consider using the <button onclick="hideModal(); showView('wellness')" class="text-pink-400 underline">Wellness Studio</button> or talking to our <button onclick="hideModal(); showView('chatbot')" class="color-accent-text underline">AI Assistant</button> for immediate de-stressing techniques.</p>
        </div>
        <p class="text-gray-500 text-xs mt-4 text-center">Your privacy is paramount. This information is used solely for intervention purposes.</p>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

// =======================================================
// 3. REMAINING FUNCTIONS
// =======================================================

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response.json();
            }
            if (response.status === 429) {
                throw new Error(`Rate limit exceeded. Retrying in ${2 ** i}s...`);
            }
            throw new Error(`API error: ${response.statusText}`);
        } catch (error) {
            if (i === retries - 1) {
                throw error;
            }
            const delay = 2 ** i * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

function updateHeaderAuthDisplay() {
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const userGreeting = document.getElementById('user-greeting');
    const homeTeaser = document.getElementById('home-wellness-teaser');

    if (isLoggedIn) {
        authButtons.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        userGreeting.textContent = `Welcome Back!`;
        homeTeaser.style.display = 'inline-block';
    } else {
        authButtons.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
        homeTeaser.style.display = 'none';
    }
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function applyAccentColor(colorName) {
    let color, hover;
    switch (colorName) {
        case 'Teal':
            color = '#2dd4bf';
            hover = '#14b8a6';
            break;
        case 'Indigo':
            color = '#818cf8';
            hover = '#6366f1';
            break;
        case 'Pink':
            color = '#f472b6';
            hover = '#ec4899';
            break;
        default:
            color = '#2dd4bf';
            hover = '#14b8a6';
    }

    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-color-hover', hover);
    document.documentElement.style.setProperty('--accent-text', color);

    if (dashboardChartInstance) renderDashboardChart();
    if (plannerChartInstance) renderPlannerChart(document.getElementById('planner-title').textContent.includes('Nutrition') ? 'Nutrition' : 'Workout');
}

function toggleTheme() {
    const html = document.documentElement;
    currentTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);

    if (dashboardChartInstance) renderDashboardChart();
    if (plannerChartInstance) renderPlannerChart(document.getElementById('planner-title').textContent.includes('Nutrition') ? 'Nutrition' : 'Workout');

    hideModal();
    showModal('Theme Switched', `Theme changed to **${currentTheme.toUpperCase()}** mode.`, 'OK');
}

window.onload = () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    currentTheme = savedTheme;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    updateHeaderAuthDisplay();
    applyAccentColor('Teal');

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            const micButton = document.getElementById('mic-button');
            if (micButton) micButton.classList.add('mic-active');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chat-input').value = transcript;
            sendChat(null, transcript);
        };

        recognition.onend = () => {
            const micButton = document.getElementById('mic-button');
            if (micButton) micButton.classList.remove('mic-active');
            isListening = false;
        };

        recognition.onerror = (event) => {
            const micButton = document.getElementById('mic-button');
            if (micButton) micButton.classList.remove('mic-active');
            isListening = false;
            console.error("Speech recognition error:", event.error);
            showModal('Voice Error', `Speech recognition failed: ${event.error}. Please ensure your microphone is enabled.`, 'OK');
        };

    } else {
        console.warn("Web Speech API not supported in this browser.");
        const micButton = document.getElementById('mic-button');
        if (micButton) micButton.disabled = true;
    }
};

function toggleVoiceInput() {
    if (!recognition) {
         showModal('Voice Unavailable', 'Your browser does not support the Web Speech API required for voice chat.', 'OK');
         return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
            isListening = true;
        } catch (e) {
            isListening = false;
            document.getElementById('mic-button').classList.remove('mic-active');
            showModal('Mic In Use', 'The microphone is already in use or access was denied. Please check permissions.', 'OK');
        }
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        fileToBase64(file).then(base64Data => {
            base64ImageFile = base64Data;
            event.target.value = null;
            showModal(
                'Image Ready for AI',
                `Image uploaded successfully! Please type your question or request (e.g., "Analyze this meal for calorie estimate" or "What is this plant?") and hit send. The image will be included with your text.`,
                'Got It'
            );
        }).catch(error => {
            console.error("Image processing error:", error);
            showModal('Upload Failed', 'Could not process the image file. Please try again.', 'OK');
        });
    }
}

function calculateAndRenderScores() {
    const totalSteps = mockActivities
        .filter(a => a.metric === 'STEPS')
        .reduce((sum, a) => sum + (parseInt(a.value) || 0), 0);

    let newActivityScore = Math.min(100, 85 + Math.floor(totalSteps / 10000));
    const mindfulCount = mockActivities.filter(a => a.metric === 'MEDITATION').length;
    let newStressScore = Math.min(100, 79 + (mindfulCount * 5));

    healthScores.activity = newActivityScore;
    healthScores.stress = newStressScore;

    const totalScore = (healthScores.activity + healthScores.sleep + healthScores.stress + healthScores.nutrition) / 4;
    const roundedScore = Math.round(totalScore);

    document.getElementById('overall-score').textContent = roundedScore;
    document.getElementById('score-activity').textContent = healthScores.activity;
    document.getElementById('score-sleep').textContent = healthScores.sleep;
    document.getElementById('score-stress').textContent = healthScores.stress;
    document.getElementById('score-nutrition').textContent = healthScores.nutrition;

    document.getElementById('home-score-display').textContent = `${roundedScore}/100`;

    renderGoalsAndActivities();
    renderDashboardChart();
}

function checkAuthAndShowDashboard() {
    const content = document.getElementById('dashboard-content');
    const prompt = document.getElementById('dashboard-auth-prompt');

    if (isLoggedIn) {
        prompt.classList.add('hidden');
        content.classList.remove('hidden');
        setTimeout(() => {
            calculateAndRenderScores();
        }, 100);
    } else {
        content.classList.add('hidden');
        prompt.classList.remove('hidden');
        if (dashboardChartInstance) dashboardChartInstance.destroy();
    }
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function renderGoalsAndActivities() {
    const goalsContainer = document.querySelector('#dashboard-content .card:nth-child(2) .space-y-4');
    if (goalsContainer) {
        goalsContainer.innerHTML = mockGoals.map(goal => {
            const percentage = (goal.current / goal.target) * 100;
            const width = Math.min(100, percentage);
            const color = percentage >= 100 ? 'bg-green-500' : 'color-bg-accent';
            const textColor = 'color-accent-text';

            return `
                <div>
                    <div class="flex justify-between items-center text-sm mb-1">
                        <span class="font-medium" style="color: var(--text-primary);">${goal.name}</span>
                        <span class="${textColor} font-bold">${goal.type === 'Sleep' ? `${goal.current}h 15m` : `${Math.floor(percentage)}%`}</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-2.5">
                        <div class="${color} h-2.5 rounded-full transition-all duration-500" style="width: ${width}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    const activityFeed = document.querySelector('#dashboard-content .card:nth-child(3) ul.space-y-3');
    if (activityFeed) {
        activityFeed.innerHTML = mockActivities.slice().reverse().slice(0, 3).map(activity => {
            let icon, label, time, color;

            if (activity.metric === 'STEPS') {
                icon = 'footprints';
                label = `Logged ${activity.metric} count: ${activity.value}.`;
                time = '4 hours ago';
                color = 'text-green-400';
            } else if (activity.metric === 'WEIGHT') {
                icon = 'scale';
                label = `Logged ${activity.metric}: ${activity.value} kg.`;
                time = '5 hours ago';
                color = 'text-yellow-400';
            } else if (activity.metric === 'SLEEP') {
                icon = 'moon';
                label = `Logged ${activity.metric}: ${activity.value}.`;
                time = '4 hours ago';
                color = 'text-indigo-400';
            } else if (activity.metric === 'BP') {
                icon = 'heart-pulse';
                label = `Logged ${activity.metric}: ${activity.value}.`;
                time = 'Yesterday';
                color = 'text-red-400';
            } else if (activity.metric === 'MEDITATION') {
                icon = 'lotus';
                label = `Logged ${activity.metric} session: ${activity.value}.`;
                time = 'Just Now';
                color = 'text-pink-400';
            } else if (activity.metric === 'NUTRITION' || activity.metric === 'WORKOUT') {
                icon = activity.metric === 'NUTRITION' ? 'apple' : 'dumbbell';
                label = `Logged ${activity.metric} entry: ${activity.value}.`;
                time = 'Just Now';
                color = 'color-accent-text';
            } else {
                icon = 'bolt';
                label = `Logged ${activity.metric}: ${activity.value}.`;
                time = 'Just Now';
                color = 'text-white';
            }

            return `
                <li class="flex items-center space-x-3 text-sm">
                    <i data-lucide="${icon}" class="w-5 h-5 ${color}"></i>
                    <span class="flex-1" style="color: var(--text-primary);">${label}</span>
                    <span class="text-xs text-gray-400">${time}</span>
                </li>
            `;
        }).join('');
    }

    const activityDot = document.getElementById('activity-dot');
    if (activityDot) {
        if (mockActivities.length > 3 || hasNewActivity) {
            activityDot.classList.remove('hidden');
            activityDot.classList.add('activity-dot');
        } else {
            activityDot.classList.add('hidden');
            activityDot.classList.remove('activity-dot');
        }
    }


    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function renderDashboardChart() {
    const ctx = document.getElementById('weeklyPerformanceChart');
    if (!ctx) return;

    if (dashboardChartInstance) {
        dashboardChartInstance.destroy();
        dashboardChartInstance = null;
    }

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    const gridColor = currentTheme === 'dark' ? '#2d333b' : '#e5e7eb';


    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Steps (x1000)',
                data: [8, 12, 10, 15, 9, 11, 14],
                backgroundColor: accentColor,
                borderColor: accentColor,
                yAxisID: 'y',
                tension: 0.3,
                type: 'bar',
                borderRadius: 5
            },
            {
                label: 'Sleep Quality (%)',
                data: [85, 90, 80, 75, 95, 88, 92],
                backgroundColor: '#a78bfa',
                borderColor: '#a78bfa',
                yAxisID: 'y1',
                tension: 0.4,
                pointRadius: 5,
                type: 'line'
            }
        ]
    };

    dashboardChartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Steps (x1000)', color: accentColor },
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Sleep Quality (%)', color: '#a78bfa' },
                    grid: { drawOnChartArea: false, color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } },
                tooltip: {
                    backgroundColor: currentTheme === 'dark' ? '#1f2937' : '#ffffff',
                    titleColor: currentTheme === 'dark' ? '#fff' : '#1f2937',
                    bodyColor: textColor,
                    borderColor: accentColor,
                    borderWidth: 1
                },
                title: {
                    display: true,
                    text: 'Weekly Health Trend',
                    color: textColor
                }
            }
        },
    });
}

function renderPlannerChart(plannerType) {
    const ctx = document.getElementById('longTermChart');
    if (!ctx) return;

    if (plannerChartInstance) {
        plannerChartInstance.destroy();
        plannerChartInstance = null;
    }

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    const gridColor = currentTheme === 'dark' ? '#2d333b' : '#e5e7eb';


    const dataLabel = plannerType === 'Nutrition' ? 'Weight (kg)' : 'Strength Score (RM)';
    const chartData = plannerType === 'Nutrition'
        ? [85, 84.5, 83, 83.5, 82, 81.5, 80.8, 80]
        : [50, 55, 60, 65, 63, 70, 75, 80];
    const chartColor = plannerType === 'Nutrition' ? accentColor : '#a78bfa';

    plannerChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [{
                label: dataLabel,
                data: chartData,
                borderColor: chartColor,
                backgroundColor: chartColor + '40',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: currentTheme === 'dark' ? '#161b22' : '#ffffff',
                pointBorderColor: chartColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: dataLabel,
                        color: textColor
                    },
                    grid: {
                        color: gridColor,
                    },
                    ticks: {
                        color: textColor
                    }
                },
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: plannerType === 'Nutrition' ? '8-Week Weight Progress' : '8-Week Strength Progression',
                    color: textColor
                },
                tooltip: {
                    backgroundColor: currentTheme === 'dark' ? '#1f2937' : '#ffffff',
                    titleColor: currentTheme === 'dark' ? '#fff' : '#1f2937',
                    bodyColor: textColor,
                    borderColor: accentColor,
                    borderWidth: 1
                },
            }
        }
    });
}

function showView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));

    const targetView = document.getElementById(viewId + '-view');
    if (targetView) {
        targetView.classList.add('active');
        window.scrollTo(0, 0);
    }

    if (viewId === 'dashboard') {
        checkAuthAndShowDashboard();
    }

    const mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
    }

    if (viewId !== 'dashboard') {
        hasNewActivity = false;
        renderGoalsAndActivities();
    }

    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showModal(title, message, buttonText = 'Close', modalClass = 'modal-content', onConfirm = null) {
    const modalContent = document.getElementById('universal-modal-content');
    modalContent.className = '';
    modalContent.classList.add(modalClass.includes('modal-content') ? 'modal-content' : modalClass);

    let buttonHtml = `<button onclick="hideModal()" class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150">${buttonText}</button>`;

    if (onConfirm) {
        const confirmButtonClass = buttonText.toLowerCase().includes('delete') ? 'bg-red-600 hover:bg-red-700 text-white' : 'color-bg-accent color-bg-accent-hover text-black';

        buttonHtml = `<button onclick="hideModal(); ${onConfirm}()" class="${confirmButtonClass} font-bold py-2 px-4 rounded-lg transition duration-150 mr-3">${buttonText}</button>`;
        buttonHtml += `<button onclick="hideModal()" class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150">Cancel</button>`;
    }

    modalContent.innerHTML = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close modal">&times;</button>
        <h3 class="text-2xl font-bold mb-3" style="color: var(--text-primary);">${title}</h3>
        <p class="text-gray-400 mb-6">${message}</p>
        <div class="flex justify-end">
            ${buttonHtml}
        </div>
    `;
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function hideModal() {
    document.getElementById('universal-modal-backdrop').style.display = 'none';
}

function showSettingsModal() {
    const themeIcon = currentTheme === 'dark' ? 'sun' : 'moon';
    const themeLabel = currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close settings modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="settings" class="w-7 h-7 color-accent-text mr-2"></i><span>App Settings</span></h3>
        <p class="text-gray-400 mb-6">General, data, and privacy features for a personalized experience.</p>

        <div class="space-y-4">
            <div class="p-3 bg-gray-800 rounded-lg">
                <h4 class="font-bold mb-2 flex items-center space-x-2" style="color: var(--text-primary);"><i data-lucide="paint-roller" class="w-5 h-5 text-purple-400"></i><span>Appearance</span></h4>
                <div class="space-y-2 text-sm text-gray-400">
                    <button onclick="toggleTheme()" class="w-full text-left p-2 rounded-lg bg-gray-700 hover:bg-gray-600 flex justify-between items-center text-white font-semibold">
                        <span>${themeLabel}</span>
                        <i data-lucide="${themeIcon}" class="w-5 h-5"></i>
                    </button>
                    <div class="flex justify-between items-center">
                        <span>Color Accent</span>
                        <select onchange="applyAccentColor(this.value)" class="bg-gray-700 border border-gray-600 rounded-lg p-1 text-xs text-white focus:ring-accent-teal">
                            <option value="Teal" ${getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() === '#2dd4bf' ? 'selected' : ''}>Teal (Default)</option>
                            <option value="Indigo" ${getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() === '#818cf8' ? 'selected' : ''}>Indigo</option>
                            <option value="Pink" ${getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() === '#f472b6' ? 'selected' : ''}>Pink</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="p-3 bg-gray-800 rounded-lg">
                <h4 class="font-bold mb-2 flex items-center space-x-2" style="color: var(--text-primary);"><i data-lucide="database" class="w-5 h-5 text-red-400"></i><span>Data & Privacy</span></h4>
                <div class="space-y-2 text-sm text-gray-400">
                    <button onclick="hideModal(); showDataPermissionsModal()" class="w-full text-left p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
                        Manage Data Permissions
                    </button>
                    <button onclick="hideModal(); showDataExportModal()" class="w-full text-left p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
                        Export All Health Data
                    </button>
                    <button onclick="showModal('Erase Data', 'This will permanently delete ALL your health data. Are you absolutely sure?', 'Delete All', 'modal-content', 'eraseAllData')" class="w-full text-left p-2 rounded-lg bg-red-800 hover:bg-red-700 text-red-300 font-bold">
                        Erase All Data
                    </button>
                </div>
            </div>

            <button onclick="hideModal(); showDeviceLinkModal()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="watch" class="w-5 h-5"></i>
                <span>Connect/Manage Smart Device</span>
            </button>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showDataExportModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="file-down" class="w-7 h-7 text-green-400 mr-2"></i><span>Export Health Data</span></h3>
        <p class="text-gray-400 mb-6">Select the format and data range for your download.</p>
        <div class="space-y-4">
            <div class="input-group">
                <label for="export-format" class="block text-sm font-medium mb-1">Format</label>
                <i data-lucide="file-text" class="w-5 h-5"></i>
                <select id="export-format" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]">
                    <option>JSON (Recommended)</option>
                    <option>CSV</option>
                    <option>FHIR (EHR)</option>
                </select>
            </div>
            <div class="input-group">
                <label for="export-range" class="block text-sm font-medium mb-1">Date Range</label>
                <i data-lucide="calendar" class="w-5 h-5"></i>
                <select id="export-range" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]">
                    <option>Last 30 Days</option>
                    <option>Last 1 Year</option>
                    <option>All Time</option>
                </select>
            </div>
            <button onclick="simulateExport()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
                Generate & Download
            </button>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function simulateExport() {
    hideModal();
    showModal('Export Complete', 'Your health data file has been securely generated and is ready for download.', 'Download Now');
}

function eraseAllData() {
    mockActivities = [];
    mockGoals = [];
    mockMedications = [];
    nextActivityId = 1;
    nextGoalId = 1;
    nextMedicationId = 101;
    healthScores = { activity: 50, sleep: 50, stress: 50, nutrition: 50 };
    isLoggedIn = false;
    loggedInUser = '';

    updateHeaderAuthDisplay();
    calculateAndRenderScores();
    showView('home');
    showModal('Data Erased', 'All personalized data has been permanently deleted. Your privacy is secured.', 'Restart App');
}

function simulateBandPurchase() {
    hideModal();
    showModal('Purchase Confirmation', 'Your PULSE Smart Fitness Band order is confirmed! Your band will be auto-connected upon arrival. Proceeding to checkout.', 'Checkout');
    setTimeout(() => {
        if (document.getElementById('connect-view').classList.contains('active')) {
            showDeviceLinkModal('pulse-band-connected');
        } else {
            showModal('Band Ready', 'Your PULSE Smart Band has been simulated as delivered and is ready for connection in the Device Link Hub!', 'Go to Hub');
        }
    }, 3000);
}

function showManualDataImportModal() {
    const content = `
        <button onclick="hideModal(); showDeviceLinkModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="upload-cloud" class="w-7 h-7 text-indigo-400 mr-2"></i><span>Manual Data Import</span></h3>
        <p class="text-gray-400 mb-6">Upload previously exported data (CSV/JSON) from another service.</p>
        <form onsubmit="simulateDataUpload(event)" class="space-y-4">
            <div>
                <label for="data-file" class="block text-sm font-medium mb-1">Select File (CSV, JSON)</label>
                <input type="file" id="data-file" accept=".csv, .json" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600" required>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="overwrite" class="h-4 w-4 rounded border-gray-700 bg-gray-700 text-accent-teal focus:ring-[var(--accent-color)]">
                <label for="overwrite" class="ml-2 text-sm text-gray-400">Overwrite existing data</label>
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
                Start Secure Import
            </button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function simulateDataUpload(event) {
    if (event) event.preventDefault();
    hideModal();
    showModal('Import Success', 'File upload simulated. **250 new data points** successfully imported and merged into your dashboard.', 'View Dashboard');
    setTimeout(() => calculateAndRenderScores(), 1000);
}

function showDataPermissionsModal() {
    const content = `
        <button onclick="hideModal(); showDeviceLinkModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="key" class="w-7 h-7 text-yellow-400 mr-2"></i><span>Manage Data Permissions</span></h3>
        <p class="text-gray-400 mb-6">Control which data categories linked devices and external partners can access.</p>

        <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span class="text-sm" style="color: var(--text-primary);">Real-time Heart Rate</span>
                <input type="checkbox" checked class="h-4 w-4 rounded border-gray-700 bg-gray-700 text-accent-teal focus:ring-[var(--accent-color)]">
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span class="text-sm" style="color: var(--text-primary);">Sleep Stage Data</span>
                <input type="checkbox" checked class="h-4 w-4 rounded border-gray-700 bg-gray-700 text-accent-teal focus:ring-[var(--accent-color)]">
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span class="text-sm" style="color: var(--text-primary);">Location History (Activity Mapping)</span>
                <input type="checkbox" class="h-4 w-4 rounded border-gray-700 bg-gray-700 text-accent-teal focus:ring-[var(--accent-color)]">
            </div>
        </div>

        <p class="text-xs text-gray-500 mt-4">Note: Disabling permissions may limit personalized AI insights.</p>
            <button onclick="hideModal(); showDeviceLinkModal()" class="mt-6 w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg transition duration-150">
                Save Permissions
            </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function simulateDeviceLink(provider) {
    hideModal();
    showModal('Device Linking', `Redirecting to **${provider}** for secure authorization. Your data sync will begin shortly after approval.`, 'Authorize Now');
}

function loginUser(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('login-email').value;
    loggedInUser = email.split('@')[0];

    hideAuthModal();
    isLoggedIn = true;
    updateHeaderAuthDisplay();

    showModal('Login Successful', `Welcome back to PULSE, **${loggedInUser}**! Redirecting to your Dashboard.`, 'Continue');
    setTimeout(() => showView('dashboard'), 1500);
}

function signUpUser(event) {
    if (event) event.preventDefault();
    const fullNameInput = document.getElementById('signup-name').value.trim();
    const fullName = fullNameInput || 'PULSE User';

    loggedInUser = fullName;

    hideAuthModal();
    isLoggedIn = true;
    updateHeaderAuthDisplay();

    showModal('Account Created', `Your PULSE account is ready, **${loggedInUser}**! Redirecting to your Dashboard.`, 'Continue');
    setTimeout(() => showView('dashboard'), 1500);
}

function showDeepDiveModal() {
    const currentScore = document.getElementById('overall-score').textContent;

    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close deep dive modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="scan" class="w-7 h-7 color-accent-text mr-2"></i><span>Weekly Wellness Deep Dive (Score: ${currentScore})</span></h3>
        <p class="text-gray-400 mb-6">AI analysis of key health dimensions based on tracked data.</p>
        <ul class="space-y-4">
            <li class="score-item p-4 rounded-lg border-l-4 border-green-500">
                <p class="font-bold text-white">Activity (${healthScores.activity}/100):</p>
                <p class="text-sm text-gray-400">Excellent performance. Maintain 150+ minutes of moderate activity. Recommendation: Increase interval training slightly.</p>
            </li>
            <li class="score-item p-4 rounded-lg border-l-4 border-yellow-500">
                <p class="font-bold text-white">Sleep (${healthScores.sleep}/100):</p>
                <p class="text-sm text-gray-400">Good average duration (8h 15m), but **time in deep sleep** decreased slightly. Recommendation: Adjust evening routine (screen time).</p>
            </li>
            <li class="score-item p-4 rounded-lg border-l-4 border-red-500">
                <p class="font-bold text-white">Stress (${healthScores.stress}/100):</p>
                <p class="text-sm text-gray-400">Heart Rate Variability (HRV) shows elevated stress spikes on Wednesday. Recommendation: Utilize 10-minute meditation sessions in the Wellness Studio.</p>
            </li>
        </ul>
        <button onclick="hideModal(); showView('wellness');" class="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Go to Wellness Studio for Stress Relief
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showEditDataModal() {
    let listHtml = mockActivities.slice().reverse().map(activity => {
        const id = activity.id;
        const display = `${activity.metric} - ${activity.value} (${activity.date})`;
        let color = activity.type === 'Activity' ? 'border-accent-teal' : activity.type === 'Sleep' ? 'border-indigo-400' : (activity.type === 'Mindfulness' ? 'border-pink-400' : 'border-green-500');

        return `
            <li class="flex justify-between items-center bg-gray-800 p-3 rounded-lg border-l-4 ${color}">
                <span class="text-sm" style="color: var(--text-primary);">${display}</span>
                <div class="space-x-2">
                    <button onclick="showActualEditDataModal(${id})" class="text-xs text-yellow-500 hover:text-yellow-400 font-medium">Edit</button>
                    <button onclick="editDataAction(${id}, 'delete')" class="text-xs text-red-500 hover:text-red-400 font-medium">Delete</button>
                </div>
            </li>
        `;
    }).join('');

    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close edit data modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="edit-3" class="w-7 h-7 text-yellow-400 mr-2"></i><span>Edit Health Data</span></h3>
        <p class="text-gray-400 mb-6">Select a recent entry to view, adjust, or delete it. **${mockActivities.length}** entries found.</p>

        <ul class="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">${listHtml || '<p class="text-gray-500">No data entries logged yet.</p>'}</ul>

        <button onclick="hideModal(); showManualDataModal();" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150 mb-3">
            <i data-lucide="plus" class="w-4 h-4 inline-block mr-2"></i> Add New Data Manually
        </button>
        <button onclick="hideModal()" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Done Editing
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.add('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showActualEditDataModal(id) {
    const activity = mockActivities.find(a => a.id === id);
    if (!activity) {
        hideModal();
        showModal('Error', 'Data entry not found.', 'OK');
        return;
    }

    hideModal();

    const content = `
        <button onclick="showEditDataModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close edit modal and go back">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);">Editing Entry ID: ${activity.id}</h3>
        <form onsubmit="saveEditedData(event, ${activity.id})" class="space-y-4">
            <div class="input-group">
                <label for="edit-metric" class="block text-sm font-medium mb-1">Metric</label>
                <i data-lucide="gauge" class="w-5 h-5"></i>
                <input type="text" id="edit-metric" value="${activity.metric}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required readonly>
            </div>
            <div class="input-group">
                <label for="edit-value" class="block text-sm font-medium mb-1">Value</label>
                <i data-lucide="hash" class="w-5 h-5"></i>
                <input type="text" id="edit-value" value="${activity.value}" placeholder="Enter new value" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg transition duration-150">Save Changes</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function saveEditedData(event, id) {
    if (event) event.preventDefault();
    const newValue = document.getElementById('edit-value').value;

    const index = mockActivities.findIndex(a => a.id === id);
    if (index !== -1) {
        mockActivities[index].value = newValue;
    }

    hideModal();
    showModal('Data Updated', `Entry ID ${id} value successfully updated to **${newValue}**. Dashboard recalculated.`, 'View Dashboard');
    calculateAndRenderScores();
}

function editDataAction(id, action) {
    if (action === 'delete') {
        mockActivities = mockActivities.filter(a => a.id !== id);

        hideModal();
        showModal('Data Deleted', `Entry ID **${id}** has been successfully deleted from your history.`, 'OK');

        calculateAndRenderScores();
    }
}

function undoChangeHandler() {
    showModal('Undo Last Action', 'The most recent data change (e.g., adding steps or editing a goal) has been successfully rolled back.', 'Confirmed');
}

function showGoalManagementModal() {
    let listHtml = mockGoals.map(goal => `
        <li class="flex justify-between items-center bg-gray-800 p-3 rounded-lg border-l-4 border-accent-teal">
            <div class="flex-1">
                <p class="font-bold" style="color: var(--text-primary);">${goal.name}</p>
                <p class="text-xs text-gray-400">Target: ${goal.target} | Current: ${goal.current} (${goal.type})</p>
            </div>
            <div class="space-x-2">
                <button onclick="showGoalEditorModal(${goal.id})" class="text-sm text-yellow-500 hover:text-yellow-400 font-medium">Edit</button>
                <button onclick="confirmGoalDelete(${goal.id})" class="text-sm text-red-500 hover:text-red-400 font-medium">Delete</button>
            </div>
        </li>
    `).join('');

    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close goal management modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="target" class="w-7 h-7 color-accent-text mr-2"></i><span>Goal Management</span></h3>
        <p class="text-gray-400 mb-4">View and modify your personalized health and fitness goals.</p>
        <ul class="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">${listHtml}</ul>

        <button onclick="showGoalEditorModal(null)" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150">
            Add New Goal
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.add('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showGoalEditorModal(id) {
    const isNew = id === null;
    const goal = mockGoals.find(g => g.id === id) || { name: '', target: '', current: 0, type: 'Custom' };

    if (!isNew) hideModal();

    const title = isNew ? 'Add New Goal' : `Edit Goal: ${goal.name}`;

    const content = `
        <button onclick="${isNew ? 'hideModal()' : 'showGoalManagementModal()'}" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close goal editor modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);">${title}</h3>
        <form onsubmit="saveGoal(event, ${id})" class="space-y-4">
            <div class="input-group">
                <label for="goal-name" class="block text-sm font-medium mb-1">Goal Name</label>
                <i data-lucide="tag" class="w-5 h-5"></i>
                <input type="text" id="goal-name" placeholder="e.g., Run 5K" value="${goal.name}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="goal-target" class="block text-sm font-medium mb-1">Target Value</label>
                <i data-lucide="check" class="w-5 h-5"></i>
                <input type="number" id="goal-target" placeholder="e.g., 5000 (meters or steps)" value="${goal.target || ''}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="goal-current" class="block text-sm font-medium mb-1">Current Progress</label>
                <i data-lucide="trending-up" class="w-5 h-5"></i>
                <input type="number" id="goal-current" placeholder="e.g., 1000" value="${goal.current}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg transition duration-150">Save Changes</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function saveGoal(event, id) {
    if (event) event.preventDefault();
    const name = document.getElementById('goal-name').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    const current = parseFloat(document.getElementById('goal-current').value);

    const index = mockGoals.findIndex(g => g.id === id);

    if (index !== -1) {
        mockGoals[index].name = name;
        mockGoals[index].target = target;
        mockGoals[index].current = current;
    } else {
        mockGoals.push({
            id: nextGoalId++,
            name: name,
            target: target,
            current: current,
            type: "Custom"
        });
    }

    hideModal();
    showModal('Goal Saved', `Goal **${name}** saved successfully!`, 'OK');

    calculateAndRenderScores();
    setTimeout(showGoalManagementModal, 500);
}

function confirmGoalDelete(id) {
     const goal = mockGoals.find(g => g.id === id);
     if (goal) {
         showModal('Confirm Deletion', `Are you sure you want to delete the goal: **${goal.name}**? This action cannot be undone.`, 'Delete', 'modal-content', `deleteGoalById(${id})`);
     }
}

function deleteGoalById(id) {
    mockGoals = mockGoals.filter(g => g.id !== id);
    showModal('Goal Deleted', 'Goal successfully removed.', 'OK');
    calculateAndRenderScores();
    setTimeout(showGoalManagementModal, 500);
}

function showManualDataModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close manual data modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);">Manual Data Entry</h3>
        <form onsubmit="submitManualData(event)" class="space-y-4">
            <div class="input-group">
                <label for="metric" class="block text-sm font-medium mb-1">Metric</label>
                <i data-lucide="gauge" class="w-5 h-5"></i>
                <select id="metric" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
                    <option value="steps">Steps Count</option>
                    <option value="weight">Weight (kg)</option>
                    <option value="sleep">Sleep Duration (hours)</option>
                    <option value="bp">Blood Pressure (systolic/diastolic)</option>
                    <option value="sugar">Blood Sugar (mg/dL)</option>
                    <option value="mindfulness">Mindfulness/Meditation (minutes)</option>
                </select>
            </div>
            <div class="input-group">
                <label for="value" class="block text-sm font-medium mb-1">Value</label>
                <i data-lucide="hash" class="w-5 h-5"></i>
                <input type="text" id="value" placeholder="Enter value(s) (e.g., 105/70 for BP)" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150">Submit Data</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function submitManualData(event) {
    if (event) event.preventDefault();
    const metricInput = document.getElementById('metric').value;
    const value = document.getElementById('value').value;

    let activityType, metricName;

    if (metricInput === 'steps' || metricInput === 'weight') {
        activityType = 'Activity';
        metricName = metricInput.toUpperCase();
    } else if (metricInput === 'sleep') {
        activityType = 'Sleep';
        metricName = 'SLEEP';
    } else if (metricInput === 'mindfulness') {
        activityType = 'Mindfulness';
        metricName = 'MEDITATION';
    } else {
        activityType = 'Health';
        metricName = metricInput.toUpperCase();
    }

    mockActivities.push({
        id: nextActivityId++,
        metric: metricName,
        value: value,
        date: new Date().toLocaleDateString(),
        type: activityType
    });

    hasNewActivity = true;

    hideModal();
    showModal('Data Added', `Successfully logged **${value}** for **${metricName}**. Your dashboard is updating.`, 'View Dashboard');

    calculateAndRenderScores();
}

function bookAppointment(event) {
    if (event) event.preventDefault();
    const specialty = document.getElementById('specialty').value;
    const date = document.getElementById('date').value;
    const type = document.getElementById('type').value;
    const reason = document.getElementById('reason').value;

    if (specialty && date && reason) {
        hideModal();
        showModal('Appointment Confirmation',
            `Finding available slots for a **${type.toUpperCase()}** consultation with a **${specialty.toUpperCase()}** specialist on **${date}**. Reason: ${reason}. If available, you will receive a confirmation shortly.`,
            'OK, Check Slots');
    } else {
        showModal('Incomplete Form', 'Please fill out all required fields (specialty, date, and reason) to find available slots.', 'Try Again');
    }
}

function portalAction(action) {
    showModal('Portal Access', `You are securely accessing your patient ${action}. Privacy measures are actively protecting your data.`, 'Continue');
}

function makeSubscriptionPayment(planName, price) {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close payment modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);">
            <i data-lucide="credit-card" class="w-7 h-7 text-yellow-500 mr-2"></i>
            <span>Confirm ${planName} Subscription</span>
        </h3>
        <p class="text-gray-400 mb-6">You are subscribing to the **${planName}** plan for one month. Your card will be charged monthly.</p>
        <div class="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg mb-6 border border-gray-600">
            <span class="text-sm text-gray-300">Monthly Price:</span>
            <span class="text-3xl font-extrabold text-yellow-500">₹${price}</span>
        </div>
        <button onclick="simulateSubscriptionProcessing('${planName}', ${price})" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Proceed to Secure Checkout
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function simulateSubscriptionProcessing(planName, price) {
    hideModal();
    showModal('Payment Processing', `<div class="flex items-center justify-center space-x-2"><div class="loader"></div><span>Authorizing subscription for **${planName}** (₹${price}/month). Please wait...</span></div>`, 'Please Wait');
    setTimeout(() => {
        hideModal();
        showModal('Subscription Active!', `Congratulations! Your **${planName}** subscription is now active. Enjoy full access to your plan's features.`, 'Start Monitoring');
    }, 2000);
}

function makePayment() {
     showView('booking');
     showModal('Subscription Required', 'Please select a subscription plan below to access premium features like advanced booking and reports.', 'Choose Plan');
}

function generateHealthReport() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close report options modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="file-check-2" class="w-7 h-7 color-accent-text mr-2"></i><span>Health Report Options</span></h3>
        <p class="text-gray-400 mb-6">Select how you'd like to use your AI-driven health summary:</p>
        <div class="space-y-3">
            <button onclick="reportAction('PDF Export')" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="file-text" class="w-5 h-5"></i><span>Export PDF/Printable</span>
            </button>
            <button onclick="reportAction('Sharing')" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="share-2" class="w-5 h-5"></i><span>Shareable Link (EHR)</span>
            </button>
            <button onclick="reportAction('Trend Analysis')" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="line-chart" class="w-5 h-5"></i><span>View Trend Analysis</span>
            </button>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function reportAction(action) {
    hideModal();
    showModal(`${action} Activated`, `Simulating ${action.toLowerCase()} process. Data security protocols are active. Your report generation/share link is ready.`, 'OK');
}

function showWaterQualityModal() {
    showModal('Water Quality Settings', 'Opening settings to customize water quality monitoring and hydration reminders based on local data.', 'Customize');
}

function showGenomicInsightsModal() {
     if (!isLoggedIn) {
        showAuthModal('login');
        return;
    }
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close genomic insights modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="dna" class="w-7 h-7 text-green-500 mr-2"></i><span>Genomic Health Insights</span></h3>
        <p class="text-gray-400 mb-6">Your DNA suggests you are a **Fast Metabolizer** of common anti-depressants. Consult your doctor before starting new medications.</p>
        <ul class="space-y-3 text-sm mb-6">
            <li class="flex justify-between items-center text-gray-300">
                <span>Personalized Diet Plan</span>
                <button onclick="showModal('Diet Insight', 'Genetics suggest a high protein tolerance and moderate carbohydrate sensitivity.', 'View Plan')" class="color-accent-text hover:text-teal-400 font-medium">View</button>
            </li>
            <li class="flex justify-between items-center text-gray-300">
                <span>Genetic Risk Score (Cardio)</span>
                <span class="font-bold text-yellow-400">Moderate</span>
            </li>
        </ul>
        <button onclick="showModal('Genomic Enrollment', 'This would typically lead to a secure form for submitting DNA data or requesting a kit.', 'Enroll Now')" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Manage Genomic Data
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showMedicationAdherenceModal(filter = 'Active') {
     if (!isLoggedIn) {
        showAuthModal('login');
        return;
    }

    const filteredMeds = mockMedications.filter(m => filter === 'All' || m.status === filter);

    let listHtml = filteredMeds.map(med => `
        <li class="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center border-l-4 ${med.status === 'Active' ? 'border-orange-400' : 'border-gray-500'}">
            <div class="flex-1">
                <p class="font-bold" style="color: var(--text-primary);">${med.name}</p>
                <p class="text-xs text-gray-400">Dose: ${med.dosage} | Freq: ${med.frequency} | Adherence: ${med.adherence}%</p>
            </div>
            ${med.status === 'Active' ?
                `<button onclick="logDose(${med.id})" class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-full text-xs font-semibold">Take Dose</button>` :
                `<button onclick="deleteMedication(${med.id})" class="text-xs text-red-500 hover:text-red-400 font-medium">Archive</button>`
            }
        </li>
    `).join('');

    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close medication modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);"><i data-lucide="pills" class="w-7 h-7 text-orange-400 mr-2"></i><span>Medication Manager</span></h3>

        <div class="flex justify-between space-x-2 mb-4">
            <button onclick="showMedicationAdherenceModal('Active')" class="flex-1 px-3 py-1 text-sm rounded-lg ${filter === 'Active' ? 'bg-orange-500 text-black font-bold' : 'bg-gray-700 hover:bg-gray-600'}">Active (${mockMedications.filter(m => m.status === 'Active').length})</button>
            <button onclick="showMedicationAdherenceModal('All')" class="flex-1 px-3 py-1 text-sm rounded-lg ${filter === 'All' ? 'bg-orange-500 text-black font-bold' : 'bg-gray-700 hover:bg-gray-600'}">All (${mockMedications.length})</button>
        </div>

        <ul class="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">${listHtml || '<p class="text-gray-500">No medications matching this filter.</p>'}</ul>

        <button onclick="showAddMedicationModal()" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150 mb-3">
            <i data-lucide="plus" class="w-5 h-5 inline-block mr-2"></i> Add New Prescription
        </button>
        <button onclick="showModal('Reminder Settings', 'Opening your smart reminder and refill management settings.', 'Configure')" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Edit Global Reminders
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showAddMedicationModal() {
    hideModal();
    const content = `
        <button onclick="showMedicationAdherenceModal('Active')" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close add medication modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white">Add New Prescription</h3>
        <form onsubmit="submitNewMedication(event)" class="space-y-4">
            <div class="input-group">
                <label for="med-name" class="block text-sm font-medium mb-1">Medication Name</label>
                <i data-lucide="pill" class="w-5 h-5"></i>
                <input type="text" id="med-name" placeholder="e.g., Ibuprofen (200mg)" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="med-dosage" class="block text-sm font-medium mb-1">Dosage</label>
                <i data-lucide="hash" class="w-5 h-5"></i>
                <input type="text" id="med-dosage" placeholder="e.g., 200mg" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="med-freq" class="block text-sm font-medium mb-1">Frequency</label>
                <i data-lucide="clock" class="w-5 h-5"></i>
                <input type="text" id="med-freq" placeholder="e.g., Daily" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150">Save Medication</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function submitNewMedication(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('med-name').value;
    const dosage = document.getElementById('med-dosage').value;
    const frequency = document.getElementById('med-freq').value;

    mockMedications.push({
        id: nextMedicationId++,
        name: name,
        schedule: `${frequency} Schedule`,
        status: "Active",
        adherence: 100,
        nextDose: "Now",
        dosage: dosage,
        frequency: frequency
    });

    hideModal();
    showModal('Medication Added', `**${name}** added to your active prescriptions.`, 'OK');
    setTimeout(() => showMedicationAdherenceModal('Active'), 500);
}

function logDose(id) {
    const medIndex = mockMedications.findIndex(m => m.id === id);
    if (medIndex !== -1) {
        mockMedications[medIndex].adherence = Math.min(100, mockMedications[medIndex].adherence + 2);
        showModal('Dose Logged', `Successfully logged dose of **${mockMedications[medIndex].name}**. Adherence rate updated!`, 'OK');
        setTimeout(() => showMedicationAdherenceModal('Active'), 500);
    }
}

function deleteMedication(id) {
    mockMedications = mockMedications.filter(m => m.id !== id);
    showModal('Medication Archived', `Medication ID **${id}** has been archived.`, 'OK');
    setTimeout(() => showMedicationAdherenceModal('All'), 500);
}

function showPlannerLogModal(plannerType) {
    const icon = plannerType === 'Nutrition' ? 'utensils' : 'dumbbell';
    const metric = plannerType === 'Nutrition' ? 'Meal/Food Item' : 'Exercise/Set Count';
    const placeholder = plannerType === 'Nutrition' ? 'e.g., Chicken Salad (450 kcal)' : 'e.g., 3x10 Squats (135 lbs)';

    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close planner log modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white">Log ${plannerType} Entry</h3>
        <form onsubmit="submitPlannerLog(event, '${plannerType}')" class="space-y-4">
            <div class="input-group">
                <label for="log-details" class="block text-sm font-medium mb-1">${metric}</label>
                <i data-lucide="book-open" class="w-5 h-5"></i>
                <input type="text" id="log-details" placeholder="${placeholder}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="log-value" class="block text-sm font-medium mb-1">Value (e.g., 450 kcal, 45 min)</label>
                <i data-lucide="hash" class="w-5 h-5"></i>
                <input type="text" id="log-value" placeholder="Enter quantitative data" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
                <span>Log to Tracker</span>
            </button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function submitPlannerLog(event, plannerType) {
    if (event) event.preventDefault();
    const details = document.getElementById('log-details').value;
    const value = document.getElementById('log-value').value;

    mockActivities.push({
        id: nextActivityId++,
        metric: plannerType.toUpperCase(),
        value: details,
        date: new Date().toLocaleDateString(),
        type: plannerType
    });

    hasNewActivity = true;

    hideModal();
    showModal('Log Successful', `Successfully logged "${details} (${value})" to your ${plannerType} tracker. Progress updated!`, 'Great!');

    calculateAndRenderScores();
    openPlanner(plannerType);
}

function openPlanner(plannerName) {
    if (plannerName === 'Content Library') {
        showModal('Content Library', 'Accessing the curated library of health articles and videos verified by experts. This takes you to our blog and resources section.', 'Browse Content');
        return;
    }

    const titleElement = document.getElementById('planner-title');
    const tasksElement = document.getElementById('planner-tasks');
    const addTaskButton = document.getElementById('add-task-button');
    const plannerCardIcon = plannerName === 'Nutrition' ? 'apple' : 'activity';
    const aiToolsCard = document.getElementById('ai-planner-tools-card');


    titleElement.innerHTML = `<i data-lucide="${plannerCardIcon}" class="w-9 h-9 mr-3"></i> ${plannerName} Planner`;
    addTaskButton.setAttribute('onclick', `showPlannerLogModal('${plannerName}')`);

    let aiToolsHtml = '';
    if (plannerName === 'Nutrition') {
        aiToolsHtml = `
            <h3 class="text-xl font-semibold mb-4 flex items-center space-x-2">
                <i data-lucide="scan" class="w-6 h-6 text-yellow-400"></i>
                <span>AI Meal Generation & Calorie Check</span>
            </h3>
            <p class="text-sm text-gray-400 mb-4">Generate 3 healthy meal ideas based on your calorie target (1800 kcal) and existing restrictions (Vegetarian, Low-Sodium).</p>
            <div class="flex flex-col sm:flex-row gap-3">
                <button onclick="aiPlannerAction('Generate Meal')" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 rounded-lg transition duration-150 transform hover:scale-[1.01]">
                    Generate 3-Day Meal Plan
                </button>
                <button onclick="aiPlannerAction('Calorie Check')" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition duration-150 transform hover:scale-[1.01]">
                    Calorie/Macro Audit
                </button>
            </div>
        `;
    } else if (plannerName === 'Workout') {
         aiToolsHtml = `
            <h3 class="text-xl font-semibold mb-4 flex items-center space-x-2">
                <i data-lucide="activity" class="w-6 h-6 text-yellow-400"></i>
                <span>AI Workout Optimization</span>
            </h3>
            <p class="text-sm text-gray-400 mb-4">Analyze your recent performance data to suggest optimal weight, reps, and rest times for your next session (Target: Strength Gain).</p>
            <div class="flex flex-col sm:flex-row gap-3">
                <button onclick="aiPlannerAction('Optimize Workout')" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 rounded-lg transition duration-150 transform hover:scale-[1.01]">
                    Optimize Today's Routine
                </button>
                <button onclick="aiPlannerAction('Injury Prevention')" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition duration-150 transform hover:scale-[1.01]">
                    Injury Risk Assessment
                </button>
            </div>
        `;
    }
    aiToolsCard.innerHTML = aiToolsHtml;


    const tasks = plannerName === 'Nutrition' ? NUTRITION_TASKS : WORKOUT_TASKS;
    tasksElement.innerHTML = tasks.map((task, index) => `
        <li class="flex items-center space-x-3 text-sm p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition duration-150">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskCompletion('${plannerName}', ${index})" class="h-4 w-4 rounded border-gray-700 bg-gray-700 text-accent-teal focus:ring-[var(--accent-color)]">
            <i data-lucide="${task.icon}" class="w-5 h-5 ${task.completed ? 'text-green-500' : 'text-gray-400'}"></i>
            <span class="flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-white'}">${task.name}</span>
        </li>
    `).join('');


    showView('planner');
    setTimeout(() => renderPlannerChart(plannerName), 100);

    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function toggleTaskCompletion(plannerType, index) {
    const tasks = plannerType === 'Nutrition' ? NUTRITION_TASKS : WORKOUT_TASKS;
    tasks[index].completed = !tasks[index].completed;
    openPlanner(plannerType);
    showModal('Task Update', `Task marked as **${tasks[index].completed ? 'complete' : 'incomplete'}**. Good job!`, 'OK');
}

function aiPlannerAction(action) {
    hideModal();
    showModal('AI Action', `AI is running a **${action}** task based on your preferences and data. Results will appear in the tasks list shortly.`, 'Processing...');
}

function generateCustomSession() {
    hideModal();
    showModal('Custom Session Generated', 'Your personalized 15-minute yoga flow targeting **Hip Flexibility and Stress Reduction** has been generated and added to your tasks list.', 'Start Session');
}

function startSession(sessionName) {
    showModal('Starting Session', `Loading **${sessionName}**. Please ensure audio is turned on. Enjoy your moment of mindfulness.`, 'Begin');
    setTimeout(() => {
        logMeditation(sessionName);
    }, 5000);
}

function logMeditation(sessionName = 'Manual Mindfulness') {
    mockActivities.push({
        id: nextActivityId++,
        metric: 'MEDITATION',
        value: sessionName.includes('Deep Sleep') ? '10 minutes' : '5-15 minutes',
        date: new Date().toLocaleDateString(),
        type: 'Mindfulness'
    });

    hasNewActivity = true;

    showModal('Session Logged', `**${sessionName}** successfully logged to your activity history. Your stress score will be updated!`, 'View Progress');

    calculateAndRenderScores();
}

function crisisAction(action) {
    hideModal();
    showModal('Crisis Action', `Simulating **${action}** activation. Transferring call to nearest emergency responder/helpline.`, 'Hold Line');
}

function showSpecialistFinderModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="user-search" class="w-7 h-7 text-indigo-400"></i><span>Find a Specialist</span></h3>
        <p class="text-gray-400 mb-6">Enter your criteria to find available mental health or medical specialists matching your needs.</p>
        <form onsubmit="searchSpecialists(event)" class="space-y-4">
            <div class="input-group">
                <label for="search-specialty" class="block text-sm font-medium mb-1">Type of Specialist</label>
                <i data-lucide="user-plus" class="w-5 h-5"></i>
                <select id="search-specialty" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
                    <option value="psychologist">Psychologist/Therapist</option>
                    <option value="psychiatrist">Psychiatrist</option>
                    <option value="dermatologist">Dermatologist</option>
                    <option value="nutritionist">Registered Nutritionist</option>
                </select>
            </div>
            <div class="input-group">
                <label for="search-insurance" class="block text-sm font-medium mb-1">Insurance/Payment</label>
                <i data-lucide="shield-check" class="w-5 h-5"></i>
                <select id="search-insurance" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]">
                    <option value="private">Private Insurance</option>
                    <option value="govt">Government Scheme</option>
                    <option value="self">Self-Pay</option>
                </select>
            </div>
            <div class="input-group">
                <label for="search-language" class="block text-sm font-medium mb-1">Language</label>
                <i data-lucide="globe" class="w-5 h-5"></i>
                <input type="text" id="search-language" placeholder="e.g., Hindi, English, Spanish" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]">
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
                Search for Availability
            </button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function searchSpecialists(event) {
    if (event) event.preventDefault();
    const specialty = document.getElementById('search-specialty').value;
    hideModal();
    showModal('Search Initiated', `Searching for **${specialty}** specialists accepting your payment method. Found **3 matches**.`, 'View Matches');
}

function sendSecureMessage() {
    showModal('Secure Message', 'Simulating a secure end-to-end encrypted message form for confidential inquiries to our support team.', 'Compose Message');
}

function showCommunityPortalModal() {
    showModal('Community Portal', 'Redirecting to the private, verified PULSE peer support forums and group chat features.', 'Go to Community');
}

function showCompliance(topic) {
    showModal(`${topic} Compliance`, `Displaying the official compliance statement for **${topic}**. We prioritize your data privacy and security.`, 'Acknowledge');
}

function showDeviceLinkModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close device link hub">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="link-2" class="w-7 h-7 text-green-400"></i><span>Device Link Hub</span></h3>
        <p class="text-gray-400 mb-6">Manage all linked fitness trackers, smartwatches, and health apps.</p>

        <div class="space-y-4">
            <div class="p-3 bg-gray-800 rounded-lg border-l-4 border-green-500">
                <h4 class="font-bold text-white mb-2 flex items-center space-x-2"><i data-lucide="check-circle" class="w-5 h-5 text-green-500"></i><span>Linked Devices (1 Active)</span></h4>
                <div class="flex justify-between items-center text-sm text-gray-400 p-2 bg-gray-700 rounded-md">
                    <span>PULSE-SmartBand X1</span>
                    <span class="text-green-400 font-medium flex items-center"><i data-lucide="wifi" class="w-4 h-4 mr-1"></i> Syncing Now</span>
                </div>
            </div>

            <div class="p-3 bg-gray-800 rounded-lg">
                <h4 class="font-bold text-white mb-2 flex items-center space-x-2"><i data-lucide="watch" class="w-5 h-5 text-gray-400"></i><span>Connect a New Device</span></h4>
                <div class="grid grid-cols-3 gap-3">
                    <button onclick="simulateDeviceLink('Google Fit')" class="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition duration-150">Google Fit</button>
                    <button onclick="simulateDeviceLink('Apple Health')" class="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition duration-150">Apple Health</button>
                    <button onclick="simulateDeviceLink('Garmin')" class="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition duration-150">Garmin</button>
                </div>
            </div>

            <button onclick="hideModal(); showDataPermissionsModal()" class="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="key" class="w-5 h-5"></i>
                <span>Manage Data Permissions</span>
            </button>

            <button onclick="hideModal(); showManualDataImportModal()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="upload-cloud" class="w-5 h-5"></i>
                <span>Import Data File Manually</span>
            </button>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showTypingIndicator() {
    const chatHistory = document.getElementById('chat-history');
    const typingIndicator = `
        <div id="ai-typing-indicator" class="message ai-message">
            <div class="ai-typing">
                <i data-lucide="loader-2" class="w-4 h-4 mr-2"></i>
                <span>PULSE AI is typing...</span>
            </div>
        </div>
    `;
    chatHistory.insertAdjacentHTML('beforeend', typingIndicator);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function removeTypingIndicator() {
    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function addMessage(text, sender) {
    const chatHistory = document.getElementById('chat-history');
    const bubbleClass = sender === 'user' ? 'user-bubble' : 'ai-bubble';
    const messageClass = sender === 'user' ? 'user-message' : '';
    const messageHtml = `
        <div class="message ${messageClass}">
            <div class="${bubbleClass}">${text}</div>
        </div>
    `;
    chatHistory.insertAdjacentHTML('beforeend', messageHtml);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendChat(event, voiceInput = null) {
    if (event) event.preventDefault();

    const chatInput = document.getElementById('chat-input');
    const userText = voiceInput || chatInput.value.trim();
    if (!userText) return;

    addMessage(userText, 'user');
    chatInput.value = '';

    showTypingIndicator();

    try {
        let contents = [{ parts: [{ text: userText }] }];
        if (base64ImageFile) {
            contents = [{
                role: "user",
                parts: [
                    { text: userText },
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: base64ImageFile
                        }
                    }
                ]
            }];
            base64ImageFile = null;
            showModal('Image Used', 'The uploaded image has been sent with your last message and cleared for the next chat.', 'OK');
        }

        const payload = {
            contents: contents,
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: `You are PULSE AI, a friendly, knowledgeable, and privacy-conscious health assistant.
                    Your goal is to provide helpful, non-diagnostic guidance based on general knowledge and the user's mock health data (Wellness Score: ${document.getElementById('overall-score')?.textContent || 88}/100, Activity: ${healthScores.activity}, Stress: ${healthScores.stress}).
                    If the user asks for sensitive data or diagnosis, remind them to consult a medical professional. Keep responses concise and supportive.`
                }]
            },
        };

        const model = "gemini-2.5-flash-preview-09-2025";
        const apiUrl = geminiUrl(model);

        let responseJson = null;
        responseJson = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const candidate = responseJson.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            let aiText = candidate.content.parts[0].text;
            let sources = [];

            const groundingMetadata = candidate.groundingMetadata;
            if (groundingMetadata && groundingMetadata.groundingAttributions) {
                sources = groundingMetadata.groundingAttributions
                    .map(attribution => ({
                        uri: attribution.web?.uri,
                        title: attribution.web?.title,
                    }))
                    .filter(source => source.uri && source.title);

                if (sources.length > 0) {
                    aiText += "\n\n***\n**Sources:**\n";
                    sources.forEach((s, index) => {
                        aiText += `[${index + 1}. ${s.title}](${s.uri})\n`;
                    });
                }
            }

            removeTypingIndicator();
            addMessage(aiText, 'ai');

        } else {
            removeTypingIndicator();
            addMessage("I apologize, but I received an empty response. Please try again or rephrase your question.", 'ai');
        }

    } catch (error) {
        console.error("Gemini API call failed:", error);
        removeTypingIndicator();
        addMessage(`An error occurred while connecting to the AI assistant: ${error.message}. Please check your connection.`, 'ai');
    }
}
