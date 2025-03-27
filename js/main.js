/**
 * main.js
 * 
 * The entry point for the Sim Racing Pedal Training application.
 * Initializes all components and starts the application.
 */

// Make sure this file is loaded last in the HTML to ensure all other modules are available

// Application state and global objects
let App = {
    // References to important components
    state: null,       // GameState instance
    input: null,       // InputHandler instance
    telemetry: null,   // Telemetry instance
    gameLoop: null,    // GameLoop instance
    
    // Application status
    initialized: false,
    running: false,
    
    // Debug flag
    debug: false
};

/**
 * Initialize the application
 * Sets up all components and event listeners
 */
function initializeApp() {
    console.log("Initializing application...");
    
    // Prevent double initialization
    if (App.initialized) {
        console.warn("Application already initialized");
        return;
    }
    
    try {
        // Load saved configuration from storage if available
        if (typeof LocalData !== 'undefined') {
            LocalData.loadConfiguration();
        }
        
        // Initialize components in the correct order
        
        // 1. Input handling
        if (typeof InputHandler !== 'undefined') {
            App.input = new InputHandler();
            App.input.initialize();
        } else {
            console.error("InputHandler module not loaded");
        }
        
        // 2. Telemetry system
        if (typeof Telemetry !== 'undefined') {
            App.telemetry = new Telemetry();
            // Connect the telemetry to the input handler
            if (App.input) {
                App.telemetry.setInputHandler(App.input);
            }
        } else {
            console.error("Telemetry module not loaded");
        }
        
        // 3. Game state management
        if (typeof GameState !== 'undefined') {
            App.state = new GameState();
            App.state.initialize();
        } else {
            console.error("GameState module not loaded");
        }
        
        // 4. Game loop
        if (typeof GameLoop !== 'undefined') {
            App.gameLoop = new GameLoop();
        } else {
            console.error("GameLoop module not loaded");
        }
        
        // 5. Initialize UI components
        initializeUI();
        
        // Set the application as initialized
        App.initialized = true;
        console.log("Application initialized successfully");
        
        // Start with the main menu
        App.state.changeState('mainMenu');
        
    } catch (error) {
        console.error("Error initializing application:", error);
        // Display error to user
        showErrorMessage("Failed to initialize application. Please refresh the page.");
    }
}

/**
 * Initialize all UI components and screens
 */
function initializeUI() {
    // Initialize the main menu UI
    if (typeof MainMenu !== 'undefined') {
        MainMenu.initialize();
    } else {
        console.error("MainMenu module not loaded");
    }
    
    // Initialize the game screen UI
    if (typeof GameScreen !== 'undefined') {
        GameScreen.initialize();
    } else {
        console.error("GameScreen module not loaded");
    }
    
    // Initialize the results screen UI
    if (typeof ResultsScreen !== 'undefined') {
        ResultsScreen.initialize();
    } else {
        console.error("ResultsScreen module not loaded");
    }
    
    // Set up global UI event listeners
    window.addEventListener('resize', handleWindowResize);
}

/**
 * Handle window resize events
 */
function handleWindowResize() {
    // Update UI elements that need to be responsive
    if (App.state && App.state.currentState) {
        switch (App.state.currentState) {
            case 'mainMenu':
                if (typeof MainMenu !== 'undefined') MainMenu.handleResize();
                break;
            case 'gameScreen':
                if (typeof GameScreen !== 'undefined') GameScreen.handleResize();
                break;
            case 'resultsScreen':
                if (typeof ResultsScreen !== 'undefined') ResultsScreen.handleResize();
                break;
        }
    }
}

/**
 * Display an error message to the user
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
    // Create error element if it doesn't exist
    let errorEl = document.getElementById('error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'error-message';
        errorEl.style.position = 'fixed';
        errorEl.style.top = '20px';
        errorEl.style.left = '50%';
        errorEl.style.transform = 'translateX(-50%)';
        errorEl.style.backgroundColor = '#ff3b30';
        errorEl.style.color = 'white';
        errorEl.style.padding = '16px';
        errorEl.style.borderRadius = '8px';
        errorEl.style.zIndex = '1000';
        errorEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        document.body.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    
    // Hide the message after 5 seconds
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

/**
 * Start the application
 * This is called when the DOM is fully loaded
 */
function startApp() {
    initializeApp();
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startApp);

// Make functions available globally
window.App = App;