/**
 * mainMenu.js
 * 
 * Manages the main menu interface for the Sim Racing Pedal Training application.
 * Provides controls for selecting game mode and adjusting game parameters.
 */

const MainMenu = {
    /**
     * Initialize the main menu
     */
    initialize() {
        console.log("Initializing main menu");
        
        // Set up event listeners for UI elements
        this.setupEventListeners();
        
        // Update UI with current configuration
        this.updateUI();
    },
    
    /**
     * Set up event listeners for menu UI elements
     */
    setupEventListeners() {
        // Game mode selection buttons
        const modeButtons = document.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                // Remove 'selected' class from all mode buttons
                modeButtons.forEach(btn => btn.classList.remove('selected'));
                
                // Add 'selected' class to clicked button
                event.target.classList.add('selected');
            });
        });
        
        // Start game button
        const startButton = document.getElementById('start-game');
        if (startButton) {
            startButton.addEventListener('click', () => {
                // This is handled by gameState.js
                console.log("Start game button clicked");
            });
        }
        
        // Settings sliders - update display values in real-time
        
        // Number of targets slider
        const numberOfTargetsSlider = document.getElementById('number-of-targets');
        const numberOfTargetsValue = document.getElementById('number-of-targets-value');
        if (numberOfTargetsSlider && numberOfTargetsValue) {
            numberOfTargetsSlider.addEventListener('input', () => {
                numberOfTargetsValue.textContent = numberOfTargetsSlider.value;
            });
        }
        
        // Precision range slider
        const precisionRangeSlider = document.getElementById('precision-range');
        const precisionRangeValue = document.getElementById('precision-range-value');
        if (precisionRangeSlider && precisionRangeValue) {
            precisionRangeSlider.addEventListener('input', () => {
                precisionRangeValue.textContent = precisionRangeSlider.value;
            });
        }
        
        // Valid duration slider
        const validDurationSlider = document.getElementById('valid-duration');
        const validDurationValue = document.getElementById('valid-duration-value');
        if (validDurationSlider && validDurationValue) {
            validDurationSlider.addEventListener('input', () => {
                validDurationValue.textContent = parseFloat(validDurationSlider.value).toFixed(1);
            });
        }
        
        // Transition delay slider
        const transitionDelaySlider = document.getElementById('transition-delay');
        const transitionDelayValue = document.getElementById('transition-delay-value');
        if (transitionDelaySlider && transitionDelayValue) {
            transitionDelaySlider.addEventListener('input', () => {
                transitionDelayValue.textContent = parseFloat(transitionDelaySlider.value).toFixed(1);
            });
        }
    },
    
    /**
     * Update UI elements with current configuration values
     */
    updateUI() {
        // Update mode selection based on saved/default mode
        this.updateModeSelection();
        
        // Update number of targets slider
        const numberOfTargetsSlider = document.getElementById('number-of-targets');
        const numberOfTargetsValue = document.getElementById('number-of-targets-value');
        if (numberOfTargetsSlider && numberOfTargetsValue) {
            numberOfTargetsSlider.value = Config.number_of_targets;
            numberOfTargetsValue.textContent = Config.number_of_targets;
        }
        
        // Update precision range slider
        const precisionRangeSlider = document.getElementById('precision-range');
        const precisionRangeValue = document.getElementById('precision-range-value');
        if (precisionRangeSlider && precisionRangeValue) {
            precisionRangeSlider.value = Config.precision_range;
            precisionRangeValue.textContent = Config.precision_range;
        }
        
        // Update valid duration slider
        const validDurationSlider = document.getElementById('valid-duration');
        const validDurationValue = document.getElementById('valid-duration-value');
        if (validDurationSlider && validDurationValue) {
            validDurationSlider.value = Config.valid_duration;
            validDurationValue.textContent = Config.valid_duration.toFixed(1);
        }
        
        // Update transition delay slider
        const transitionDelaySlider = document.getElementById('transition-delay');
        const transitionDelayValue = document.getElementById('transition-delay-value');
        if (transitionDelaySlider && transitionDelayValue) {
            transitionDelaySlider.value = Config.transition_delay;
            transitionDelayValue.textContent = Config.transition_delay.toFixed(1);
        }
        
        // Update reflex mode checkbox
        const reflexModeCheckbox = document.getElementById('reflex-mode');
        if (reflexModeCheckbox) {
            reflexModeCheckbox.checked = Config.reflex_mode_enabled;
        }
    },
    
    /**
     * Update the mode selection UI based on the current/default mode
     */
    updateModeSelection() {
        const currentMode = Config.default_game_mode;
        
        // Get mode button elements
        const fromZeroButton = document.getElementById('mode-from-zero');
        const fromHundredButton = document.getElementById('mode-from-hundred');
        const continuousButton = document.getElementById('mode-continuous');
        
        // Remove 'selected' class from all buttons
        if (fromZeroButton) fromZeroButton.classList.remove('selected');
        if (fromHundredButton) fromHundredButton.classList.remove('selected');
        if (continuousButton) continuousButton.classList.remove('selected');
        
        // Add 'selected' class to the appropriate button
        switch (currentMode) {
            case 'fromZero':
                if (fromZeroButton) fromZeroButton.classList.add('selected');
                break;
            case 'fromHundred':
                if (fromHundredButton) fromHundredButton.classList.add('selected');
                break;
            case 'continuous':
                if (continuousButton) continuousButton.classList.add('selected');
                break;
        }
    },
    
    /**
     * Get the currently selected game mode
     * @returns {string} The selected game mode key ('fromZero', 'fromHundred', 'continuous')
     */
    getSelectedMode() {
        // Check which mode button is selected
        const fromZeroButton = document.getElementById('mode-from-zero');
        const fromHundredButton = document.getElementById('mode-from-hundred');
        const continuousButton = document.getElementById('mode-continuous');
        
        if (fromZeroButton && fromZeroButton.classList.contains('selected')) {
            return 'fromZero';
        } else if (fromHundredButton && fromHundredButton.classList.contains('selected')) {
            return 'fromHundred';
        } else if (continuousButton && continuousButton.classList.contains('selected')) {
            return 'continuous';
        }
        
        // Default to 'fromZero' if nothing is selected
        return 'fromZero';
    },
    
    /**
     * Get the current settings from the UI
     * @returns {Object} The current settings values
     */
    getCurrentSettings() {
        return {
            number_of_targets: parseInt(document.getElementById('number-of-targets').value),
            precision_range: parseInt(document.getElementById('precision-range').value),
            valid_duration: parseFloat(document.getElementById('valid-duration').value),
            transition_delay: parseFloat(document.getElementById('transition-delay').value),
            reflex_mode_enabled: document.getElementById('reflex-mode').checked,
            game_mode: this.getSelectedMode()
        };
    },
    
    /**
     * Handle window resize event
     */
    handleResize() {
        // Currently no resize-specific handling needed for the main menu
    },
    
    /**
     * Show a specific section of the main menu
     * @param {string} sectionId - The ID of the section to show
     */
    showSection(sectionId) {
        // Get all sections
        const sections = document.querySelectorAll('.section');
        
        // Hide all sections
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show the requested section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    }
};

// Make MainMenu available globally
window.MainMenu = MainMenu;