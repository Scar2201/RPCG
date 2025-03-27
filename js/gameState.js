/**
 * gameState.js
 * 
 * Manages the application state and transitions between different screens.
 * Implements a simple state machine for handling the flow between:
 * - Main Menu
 * - Game Screen
 * - Results Screen
 */

class GameState {
    /**
     * Initialize the GameState object
     */
    constructor() {
        // Available states
        this.states = {
            mainMenu: {
                element: document.getElementById('main-menu-screen'),
                onEnter: this.enterMainMenu.bind(this),
                onExit: this.exitMainMenu.bind(this)
            },
            gameScreen: {
                element: document.getElementById('game-screen'),
                onEnter: this.enterGameScreen.bind(this),
                onExit: this.exitGameScreen.bind(this)
            },
            resultsScreen: {
                element: document.getElementById('results-screen'),
                onEnter: this.enterResultsScreen.bind(this),
                onExit: this.exitResultsScreen.bind(this)
            }
        };
        
        // Current state
        this.currentState = null;
        
        // Game session data
        this.sessionData = {
            gameMode: null,        // 'fromZero', 'fromHundred', or 'continuous'
            reflexMode: false,     // Whether reflex mode is enabled
            startTime: null,       // When the game session started
            endTime: null,         // When the game session ended
            targets: [],           // Array of target data
            targetIndex: 0,        // Current target index
            totalTargets: 0,       // Total number of targets in this session
            telemetryData: [],     // Recorded input data
            scores: {              // Score data
                totalTime: 0,
                averageReactionTime: 0,
                averagePrecision: 0
            }
        };
    }
    
    /**
     * Initialize the state management
     */
    initialize() {
        console.log("Initializing game state management");
        
        // Set up transition event listeners
        document.getElementById('start-game').addEventListener('click', () => {
            this.changeState('gameScreen');
        });
        
        document.getElementById('restart-game').addEventListener('click', () => {
            this.changeState('gameScreen');
        });
        
        document.getElementById('return-to-menu').addEventListener('click', () => {
            this.changeState('mainMenu');
        });
        
        // Set default state to main menu
        this.currentState = null;
    }
    
    /**
     * Change to a new state
     * @param {string} newState - The name of the state to change to
     */
    changeState(newState) {
        // Make sure the requested state exists
        if (!this.states[newState]) {
            console.error(`State '${newState}' does not exist`);
            return;
        }
        
        console.log(`Changing state from '${this.currentState}' to '${newState}'`);
        
        // Exit the current state if there is one
        if (this.currentState && this.states[this.currentState].onExit) {
            this.states[this.currentState].onExit();
        }
        
        // Hide all screens
        Object.values(this.states).forEach(state => {
            if (state.element) {
                state.element.classList.add('hidden');
            }
        });
        
        // Show the new state's screen
        this.states[newState].element.classList.remove('hidden');
        
        // Update the current state
        this.currentState = newState;
        
        // Enter the new state
        if (this.states[newState].onEnter) {
            this.states[newState].onEnter();
        }
    }
    
    /**
     * Actions to perform when entering the main menu
     */
    enterMainMenu() {
        console.log("Entering main menu");
        
        // Reset session data
        this.resetSessionData();
        
        // Update UI elements
        if (typeof MainMenu !== 'undefined') {
            MainMenu.updateUI();
        }
        
        // Check for gamepad connections
        if (typeof App.input !== 'undefined' && App.input) {
            App.input.checkForGamepads();
        }
    }
    
    /**
     * Actions to perform when exiting the main menu
     */
    exitMainMenu() {
        console.log("Exiting main menu");
        
        // Collect configuration from UI
        if (typeof MainMenu !== 'undefined') {
            // Get selected game mode
            if (document.getElementById('mode-from-zero').classList.contains('selected')) {
                this.sessionData.gameMode = 'fromZero';
            } else if (document.getElementById('mode-from-hundred').classList.contains('selected')) {
                this.sessionData.gameMode = 'fromHundred';
            } else {
                this.sessionData.gameMode = 'continuous';
            }
            
            // Get reflex mode setting
            this.sessionData.reflexMode = document.getElementById('reflex-mode').checked;
            
            // Get number of targets
            this.sessionData.totalTargets = parseInt(document.getElementById('number-of-targets').value);
        }
    }
    
    /**
     * Actions to perform when entering the game screen
     */
    enterGameScreen() {
        console.log("Entering game screen");
        
        // Reset session if needed
        if (this.sessionData.endTime !== null) {
            this.resetSessionData();
        }
        
        // Set session start time
        this.sessionData.startTime = Date.now();
        
        // Initialize the game
        if (typeof App.gameLoop !== 'undefined' && App.gameLoop) {
            App.gameLoop.startGame(this.sessionData);
        }
        
        // No updateUI function in GameScreen, so we don't call it
    }
    
    /**
     * Actions to perform when exiting the game screen
     */
    exitGameScreen() {
        console.log("Exiting game screen");
        
        // Stop the game loop
        if (typeof App.gameLoop !== 'undefined' && App.gameLoop) {
            App.gameLoop.stopGame();
        }
    }
    
    /**
     * Actions to perform when entering the results screen
     */
    enterResultsScreen() {
        console.log("Entering results screen");
        
        // Set session end time if not already set
        if (this.sessionData.endTime === null) {
            this.sessionData.endTime = Date.now();
        }
        
        // Calculate final scores
        if (typeof Scoring !== 'undefined') {
            Scoring.calculateFinalScores(this.sessionData);
        }
        
        // Save results to local storage
        if (typeof LocalData !== 'undefined') {
            LocalData.saveGameResult(this.sessionData);
        }
        
        // Update UI elements
        if (typeof ResultsScreen !== 'undefined') {
            ResultsScreen.updateUI(this.sessionData);
        }
    }
    
    /**
     * Actions to perform when exiting the results screen
     */
    exitResultsScreen() {
        console.log("Exiting results screen");
        // Nothing specific needed here yet
    }
    
    /**
     * Reset the session data to default values
     */
    resetSessionData() {
        this.sessionData = {
            gameMode: this.sessionData.gameMode,   // Preserve the last game mode
            reflexMode: this.sessionData.reflexMode, // Preserve reflex mode setting
            startTime: null,
            endTime: null,
            targets: [],
            targetIndex: 0,
            totalTargets: this.sessionData.totalTargets || Config.number_of_targets,
            telemetryData: [],
            scores: {
                totalTime: 0,
                averageReactionTime: 0,
                averagePrecision: 0
            }
        };
    }
    
    /**
     * End the current game session and transition to the results screen
     */
    endGameSession() {
        console.log("Ending game session");
        this.sessionData.endTime = Date.now();
        this.changeState('resultsScreen');
    }
    
    /**
     * Get the current session data
     * @returns {Object} The current session data
     */
    getSessionData() {
        return this.sessionData;
    }
}

// Make GameState available globally
window.GameState = GameState;