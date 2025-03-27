/**
 * config.js
 * 
 * Manages configuration settings for the Sim Racing Pedal Training application.
 * Defines default parameters and provides methods to get and set these values.
 * Also handles storage and retrieval of configuration from localStorage.
 */

// Configuration object with default values and methods
const Config = {
    // Default game parameters as specified in the documentation
    number_of_targets: 10,   // How many targets the player must complete in a session
    precision_range: 5,      // Acceptable deviation from target percentage (±%)
    valid_duration: 2.0,     // Time to maintain target within range (seconds)
    transition_delay: 1.0,   // Time to hold initial position before new target appears (seconds)
    
    // Game mode settings
    default_game_mode: 'fromZero',  // Default game mode ('fromZero', 'fromHundred', 'continuous')
    reflex_mode_enabled: false,     // Whether reflex mode is enabled by default
    
    // Target generation settings
    min_target_percentage: 10,      // Minimum target percentage (to avoid targets too close to 0%)
    max_target_percentage: 90,      // Maximum target percentage (to avoid targets too close to 100%)
    
    // Reflex mode settings
    min_reflex_delay: 0.1,          // Minimum random delay in seconds
    max_reflex_delay: 3.0,          // Maximum random delay in seconds
    
    // Input settings
    input_smoothing: 0.2,           // Amount of input smoothing (0 = none, 1 = maximum)
    telemetry_sample_rate: 100,     // How many samples per second for telemetry (100Hz for very smooth graph)
    telemetry_buffer_size: 500,     // Maximum number of samples to keep (5 seconds at 100Hz)
    
    // Debug settings
    debug_mode: false,              // Whether debug mode is enabled
    
    /**
     * Initialize the configuration system
     * Loads saved values from localStorage if available
     */
    initialize: function() {
        console.log("Initializing configuration system");
        
        // Try to load saved configuration from localStorage
        this.loadFromStorage();
        
        // Update UI elements with current values
        this.updateUIElements();
    },
    
    /**
     * Update all UI elements with current configuration values
     */
    updateUIElements: function() {
        // Update number of targets slider and display
        const numberOfTargetsInput = document.getElementById('number-of-targets');
        const numberOfTargetsValue = document.getElementById('number-of-targets-value');
        if (numberOfTargetsInput && numberOfTargetsValue) {
            numberOfTargetsInput.value = this.number_of_targets;
            numberOfTargetsValue.textContent = this.number_of_targets;
        }
        
        // Update precision range slider and display
        const precisionRangeInput = document.getElementById('precision-range');
        const precisionRangeValue = document.getElementById('precision-range-value');
        if (precisionRangeInput && precisionRangeValue) {
            precisionRangeInput.value = this.precision_range;
            precisionRangeValue.textContent = this.precision_range;
        }
        
        // Update valid duration slider and display
        const validDurationInput = document.getElementById('valid-duration');
        const validDurationValue = document.getElementById('valid-duration-value');
        if (validDurationInput && validDurationValue) {
            validDurationInput.value = this.valid_duration;
            validDurationValue.textContent = this.valid_duration.toFixed(1);
        }
        
        // Update transition delay slider and display
        const transitionDelayInput = document.getElementById('transition-delay');
        const transitionDelayValue = document.getElementById('transition-delay-value');
        if (transitionDelayInput && transitionDelayValue) {
            transitionDelayInput.value = this.transition_delay;
            transitionDelayValue.textContent = this.transition_delay.toFixed(1);
        }
        
        // Update reflex mode checkbox
        const reflexModeCheckbox = document.getElementById('reflex-mode');
        if (reflexModeCheckbox) {
            reflexModeCheckbox.checked = this.reflex_mode_enabled;
        }
        
        // Update game mode buttons
        this.updateGameModeSelection();
    },
    
    /**
     * Update the game mode selection buttons based on the current game mode
     */
    updateGameModeSelection: function() {
        const fromZeroButton = document.getElementById('mode-from-zero');
        const fromHundredButton = document.getElementById('mode-from-hundred');
        const continuousButton = document.getElementById('mode-continuous');
        
        if (fromZeroButton && fromHundredButton && continuousButton) {
            // Remove 'selected' class from all buttons
            fromZeroButton.classList.remove('selected');
            fromHundredButton.classList.remove('selected');
            continuousButton.classList.remove('selected');
            
            // Add 'selected' class to the appropriate button
            switch (this.default_game_mode) {
                case 'fromZero':
                    fromZeroButton.classList.add('selected');
                    break;
                case 'fromHundred':
                    fromHundredButton.classList.add('selected');
                    break;
                case 'continuous':
                    continuousButton.classList.add('selected');
                    break;
            }
        }
    },
    
    /**
     * Set up event listeners for configuration UI elements
     */
    setupEventListeners: function() {
        // Number of targets slider
        const numberOfTargetsInput = document.getElementById('number-of-targets');
        const numberOfTargetsValue = document.getElementById('number-of-targets-value');
        if (numberOfTargetsInput && numberOfTargetsValue) {
            numberOfTargetsInput.addEventListener('input', () => {
                const value = parseInt(numberOfTargetsInput.value);
                this.number_of_targets = value;
                numberOfTargetsValue.textContent = value;
                this.saveToStorage();
            });
        }
        
        // Precision range slider
        const precisionRangeInput = document.getElementById('precision-range');
        const precisionRangeValue = document.getElementById('precision-range-value');
        if (precisionRangeInput && precisionRangeValue) {
            precisionRangeInput.addEventListener('input', () => {
                const value = parseInt(precisionRangeInput.value);
                this.precision_range = value;
                precisionRangeValue.textContent = value;
                this.saveToStorage();
            });
        }
        
        // Valid duration slider
        const validDurationInput = document.getElementById('valid-duration');
        const validDurationValue = document.getElementById('valid-duration-value');
        if (validDurationInput && validDurationValue) {
            validDurationInput.addEventListener('input', () => {
                const value = parseFloat(validDurationInput.value);
                this.valid_duration = value;
                validDurationValue.textContent = value.toFixed(1);
                this.saveToStorage();
            });
        }
        
        // Transition delay slider
        const transitionDelayInput = document.getElementById('transition-delay');
        const transitionDelayValue = document.getElementById('transition-delay-value');
        if (transitionDelayInput && transitionDelayValue) {
            transitionDelayInput.addEventListener('input', () => {
                const value = parseFloat(transitionDelayInput.value);
                this.transition_delay = value;
                transitionDelayValue.textContent = value.toFixed(1);
                this.saveToStorage();
            });
        }
        
        // Reflex mode checkbox
        const reflexModeCheckbox = document.getElementById('reflex-mode');
        if (reflexModeCheckbox) {
            reflexModeCheckbox.addEventListener('change', () => {
                this.reflex_mode_enabled = reflexModeCheckbox.checked;
                this.saveToStorage();
            });
        }
        
        // Game mode buttons
        const modeButtons = document.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                // Remove 'selected' class from all buttons
                modeButtons.forEach(btn => btn.classList.remove('selected'));
                
                // Add 'selected' class to the clicked button
                event.target.classList.add('selected');
                
                // Update the default game mode
                if (event.target.id === 'mode-from-zero') {
                    this.default_game_mode = 'fromZero';
                } else if (event.target.id === 'mode-from-hundred') {
                    this.default_game_mode = 'fromHundred';
                } else if (event.target.id === 'mode-continuous') {
                    this.default_game_mode = 'continuous';
                }
                
                this.saveToStorage();
            });
        });
    },
    
    /**
     * Generate a random target percentage within the allowed range
     * @returns {number} A random target percentage
     */
    generateRandomTarget: function() {
        return Math.floor(Math.random() * (this.max_target_percentage - this.min_target_percentage + 1)) + this.min_target_percentage;
    },
    
    /**
     * Generate a random delay for reflex mode
     * @returns {number} A random delay in milliseconds
     */
    generateRandomReflexDelay: function() {
        const randomDelay = Math.random() * (this.max_reflex_delay - this.min_reflex_delay) + this.min_reflex_delay;
        return randomDelay * 1000; // Convert to milliseconds
    },
    
    /**
     * Save the current configuration to localStorage
     */
    saveToStorage: function() {
        try {
            const configData = {
                number_of_targets: this.number_of_targets,
                precision_range: this.precision_range,
                valid_duration: this.valid_duration,
                transition_delay: this.transition_delay,
                default_game_mode: this.default_game_mode,
                reflex_mode_enabled: this.reflex_mode_enabled
            };
            
            localStorage.setItem('pedal_training_config', JSON.stringify(configData));
            console.log("Configuration saved to localStorage");
        } catch (error) {
            console.error("Failed to save configuration to localStorage:", error);
        }
    },
    
    /**
     * Load configuration from localStorage
     */
    loadFromStorage: function() {
        try {
            const savedConfig = localStorage.getItem('pedal_training_config');
            
            if (savedConfig) {
                const configData = JSON.parse(savedConfig);
                
                // Apply saved values
                this.number_of_targets = configData.number_of_targets || this.number_of_targets;
                this.precision_range = configData.precision_range || this.precision_range;
                this.valid_duration = configData.valid_duration || this.valid_duration;
                this.transition_delay = configData.transition_delay || this.transition_delay;
                this.default_game_mode = configData.default_game_mode || this.default_game_mode;
                this.reflex_mode_enabled = configData.reflex_mode_enabled !== undefined ? 
                    configData.reflex_mode_enabled : this.reflex_mode_enabled;
                
                console.log("Configuration loaded from localStorage");
            } else {
                console.log("No saved configuration found, using defaults");
            }
        } catch (error) {
            console.error("Failed to load configuration from localStorage:", error);
            // Continue with default values if loading fails
        }
    },
    
    /**
     * Reset configuration to default values
     */
    resetToDefaults: function() {
        this.number_of_targets = 10;
        this.precision_range = 5;
        this.valid_duration = 2.0;
        this.transition_delay = 1.0;
        this.default_game_mode = 'fromZero';
        this.reflex_mode_enabled = false;
        
        // Update UI elements with default values
        this.updateUIElements();
        
        // Save default values to localStorage
        this.saveToStorage();
        
        console.log("Configuration reset to defaults");
    }
};

// Make Config available globally
window.Config = Config;

// Initialize Config when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Config.initialize();
    Config.setupEventListeners();
});