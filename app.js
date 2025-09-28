// The Secret Garden Journal - JavaScript

// Journal prompts for guided mode
const journalPrompts = [
    "How are you feeling today?",
    "What made you smile recently?",
    "Describe a moment of peace from your day.",
    "What are you grateful for right now?",
    "What challenge are you facing, and how might you approach it?",
    "Write about a person who means a lot to you.",
    "What would you like to let go of?",
    "Describe your ideal peaceful place.",
    "What small victory did you have today?",
    "What are you looking forward to?",
    "Write about a lesson you learned recently.",
    "How do you want to grow as a person?"
];

// Penny for thoughts prompts
const pennyPrompts = {
    heads: [
        "Write about something that brings you joy.",
        "Describe a happy memory from your childhood.",
        "What adventure would you like to go on?",
        "Write about someone you admire and why.",
        "What makes you feel most alive?",
        "Describe your perfect day.",
        "What are you excited about right now?"
    ],
    tails: [
        "What fear would you like to overcome?",
        "Write about a time you felt proud of yourself.",
        "What change would you like to make in your life?",
        "Describe a challenge that made you stronger.",
        "What would you tell your younger self?",
        "Write about a difficult decision you made.",
        "What lesson have you learned from a mistake?"
    ]
};

// Current state
let currentPromptIndex = 0;
let currentJournalMode = '';
let journalEntries = JSON.parse(localStorage.getItem('gardenJournalEntries')) || [];
let flowerCount = JSON.parse(localStorage.getItem('gardenFlowerCount')) || 0;

// DOM Elements
const vaultScreen = document.getElementById('vault-screen');
const gardenScreen = document.getElementById('garden-screen');
const journalScreen = document.getElementById('journal-screen');
const passwordInput = document.getElementById('password-input');
const unlockBtn = document.getElementById('unlock-btn');
const errorMsg = document.getElementById('error-msg');
const backToGardenBtn = document.getElementById('back-to-garden');
const saveEntryBtn = document.getElementById('save-entry');
const journalModeTitle = document.getElementById('journal-mode-title');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set up event listeners
    unlockBtn.addEventListener('click', handleUnlock);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUnlock();
        }
    });
    
    backToGardenBtn.addEventListener('click', showGardenScreen);
    saveEntryBtn.addEventListener('click', saveCurrentEntry);
    
    // Set up path selection
    document.querySelectorAll('.path').forEach(path => {
        path.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            startJournalingMode(mode);
        });
    });
    
    // Set up guided mode
    document.getElementById('next-prompt').addEventListener('click', nextPrompt);
    
    // Set up penny mode
    document.getElementById('flip-penny').addEventListener('click', flipPenny);
    
    // Update progress display
    updateProgressFlowers();
    
    // Focus password input
    passwordInput.focus();
}

function handleUnlock() {
    const password = passwordInput.value.toLowerCase().trim();
    
    // Simple password check - you can modify this
    if (password === 'garden' || password === 'secret' || password === 'bloom') {
        unlockGarden();
    } else {
        showError("Hmm, that doesn't seem to be the right key to the garden...");
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function unlockGarden() {
    errorMsg.textContent = '';
    
    // Add opening animation to vault door
    const vaultDoor = document.querySelector('.vault-door');
    vaultDoor.classList.add('opening');
    
    // Transition to garden screen after animation
    setTimeout(() => {
        showGardenScreen();
    }, 1500);
}

function showError(message) {
    errorMsg.textContent = message;
    passwordInput.classList.add('error');
    setTimeout(() => {
        passwordInput.classList.remove('error');
        errorMsg.textContent = '';
    }, 3000);
}

function showScreen(screenToShow) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the target screen
    screenToShow.classList.add('active');
}

function showGardenScreen() {
    showScreen(gardenScreen);
    updateProgressFlowers();
}

function showJournalScreen() {
    showScreen(journalScreen);
}

function startJournalingMode(mode) {
    currentJournalMode = mode;
    
    // Hide all journal modes
    document.querySelectorAll('.journal-mode').forEach(modeDiv => {
        modeDiv.classList.remove('active');
    });
    
    // Show selected mode
    const modeDiv = document.getElementById(`${mode}-mode`);
    modeDiv.classList.add('active');
    
    // Update title
    const titles = {
        guided: 'Guided Journey',
        free: 'Free Writing',
        penny: 'Penny for Thoughts'
    };
    journalModeTitle.textContent = titles[mode];
    
    // Initialize mode-specific features
    if (mode === 'guided') {
        loadCurrentPrompt();
    } else if (mode === 'penny') {
        resetPenny();
    }
    
    showJournalScreen();
    
    // Focus on textarea
    setTimeout(() => {
        const textarea = document.querySelector(`#${mode}-textarea`);
        if (textarea) {
            textarea.focus();
        }
    }, 100);
}

function loadCurrentPrompt() {
    const promptElement = document.getElementById('current-prompt');
    promptElement.textContent = journalPrompts[currentPromptIndex];
}

function nextPrompt() {
    currentPromptIndex = (currentPromptIndex + 1) % journalPrompts.length;
    loadCurrentPrompt();
    
    // Add a little animation
    const promptElement = document.getElementById('current-prompt');
    promptElement.style.opacity = '0';
    setTimeout(() => {
        promptElement.style.opacity = '1';
    }, 150);
}

function flipPenny() {
    const penny = document.getElementById('penny-coin');
    const promptElement = document.getElementById('penny-prompt-text');
    const flipBtn = document.getElementById('flip-penny');
    
    // Disable button during animation
    flipBtn.disabled = true;
    
    // Add flipping animation
    penny.classList.add('flipping');
    
    // Determine result after animation
    setTimeout(() => {
        const isHeads = Math.random() > 0.5;
        const prompts = isHeads ? pennyPrompts.heads : pennyPrompts.tails;
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        
        // Update penny display
        const pennyFront = penny.querySelector('.penny-front');
        pennyFront.textContent = isHeads ? '🪙' : '🌙';
        
        // Show prompt
        promptElement.textContent = randomPrompt;
        
        // Re-enable button
        flipBtn.disabled = false;
        penny.classList.remove('flipping');
    }, 1000);
}

function resetPenny() {
    const penny = document.getElementById('penny-coin');
    const promptElement = document.getElementById('penny-prompt-text');
    
    penny.querySelector('.penny-front').textContent = '🪙';
    promptElement.textContent = 'Click "Flip for Inspiration" to get a writing prompt!';
}

function saveCurrentEntry() {
    let content = '';
    let mode = currentJournalMode;
    
    // Get content based on current mode
    switch (mode) {
        case 'guided':
            content = document.getElementById('guided-textarea').value;
            break;
        case 'free':
            content = document.getElementById('free-textarea').value;
            break;
        case 'penny':
            content = document.getElementById('penny-textarea').value;
            break;
    }
    
    if (content.trim()) {
        // Create entry object
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            mode: mode,
            content: content.trim(),
            prompt: mode === 'guided' ? journalPrompts[currentPromptIndex] : null
        };
        
        // Save entry
        journalEntries.push(entry);
        localStorage.setItem('gardenJournalEntries', JSON.stringify(journalEntries));
        
        // Increment flower count
        flowerCount++;
        localStorage.setItem('gardenFlowerCount', JSON.stringify(flowerCount));
        
        // Show success message
        showSaveSuccess();
        
        // Clear the textarea
        document.querySelector(`#${mode}-textarea`).value = '';
        
        // Update progress
        updateProgressFlowers();
        
    } else {
        showSaveError();
    }
}

function showSaveSuccess() {
    const originalText = saveEntryBtn.textContent;
    saveEntryBtn.textContent = 'Saved! 🌸';
    saveEntryBtn.style.background = '#90EE90';
    
    setTimeout(() => {
        saveEntryBtn.textContent = originalText;
        saveEntryBtn.style.background = '';
    }, 2000);
}

function showSaveError() {
    const originalText = saveEntryBtn.textContent;
    saveEntryBtn.textContent = 'Nothing to save';
    saveEntryBtn.style.background = '#ffcccc';
    
    setTimeout(() => {
        saveEntryBtn.textContent = originalText;
        saveEntryBtn.style.background = '';
    }, 2000);
}

function updateProgressFlowers() {
    const progressElement = document.getElementById('progress-flowers');
    if (progressElement) {
        let flowersDisplay = '';
        for (let i = 0; i < Math.min(flowerCount, 20); i++) {
            const flowers = ['🌸', '🌺', '🌻', '🌷', '🌹'];
            flowersDisplay += flowers[i % flowers.length];
        }
        if (flowerCount > 20) {
            flowersDisplay += ` (+${flowerCount - 20} more!)`;
        }
        progressElement.textContent = flowersDisplay || 'Plant your first thought to grow a flower!';
    }
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Auto-save functionality (optional)
function setupAutoSave() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', debounce(() => {
            const content = textarea.value;
            if (content) {
                localStorage.setItem(`draft-${textarea.id}`, content);
            }
        }, 1000));
    });
}

// Load drafts (optional)
function loadDrafts() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        const draft = localStorage.getItem(`draft-${textarea.id}`);
        if (draft && !textarea.value) {
            textarea.value = draft;
        }
    });
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize auto-save and load drafts when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupAutoSave();
    loadDrafts();
});

// Add some error handling
window.addEventListener('error', function(e) {
    console.error('An error occurred:', e.error);
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', function(e) {
    const textareas = document.querySelectorAll('textarea');
    for (let textarea of textareas) {
        if (textarea.value.trim()) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    }
});