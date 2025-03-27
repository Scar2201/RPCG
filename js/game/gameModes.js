/**
 * gameModes.js
 * 
 * Implements different game modes for the pedal training application.
 * Each mode has specific starting conditions and behavior.
 */

// The GameModes object contains implementations for each game mode
const GameModes = {
    /**
     * From 0% Mode
     * 
     * Player must release pedal to 0% before each new target.
     */
    fromZero: {
        /**
         * Get the name of this mode
         * @returns {string} The mode name
         */
        getName() {
            return 'From 0%';
        },
        
        /**
         * Get the transition target position
         * @returns {number} The target position for transition (0-100%)
         */
        getTransitionTarget() {
            return 0;
        },
        
        /**
         * Get the text to display during transition
         * @returns {string} The transition instruction text
         */
        getTransitionText() {
            return 'Release pedal to 0%';
        },
        
        /**
         * Check if the transition condition is met
         * @param {number} pedalPosition - Current pedal position (0-100%)
         * @returns {boolean} Whether the condition is met
         */
        checkTransitionCondition(pedalPosition) {
            // Condition: pedal is at (or very close to) 0%
            return pedalPosition <= 2; // Allow a small tolerance
        }
    },
    
    /**
     * From 100% Mode
     * 
     * Player must fully press pedal to 100% before each new target.
     */
    fromHundred: {
        /**
         * Get the name of this mode
         * @returns {string} The mode name
         */
        getName() {
            return 'From 100%';
        },
        
        /**
         * Get the transition target position
         * @returns {number} The target position for transition (0-100%)
         */
        getTransitionTarget() {
            return 100;
        },
        
        /**
         * Get the text to display during transition
         * @returns {string} The transition instruction text
         */
        getTransitionText() {
            return 'Press pedal to 100%';
        },
        
        /**
         * Check if the transition condition is met
         * @param {number} pedalPosition - Current pedal position (0-100%)
         * @returns {boolean} Whether the condition is met
         */
        checkTransitionCondition(pedalPosition) {
            // Condition: pedal is at (or very close to) 100%
            return pedalPosition >= 98; // Allow a small tolerance
        }
    },
    
    /**
     * Continuous Mode
     * 
     * Player can start from any position, still observing transition delay.
     */
    continuous: {
        /**
         * Get the name of this mode
         * @returns {string} The mode name
         */
        getName() {
            return 'Continuous';
        },
        
        /**
         * Get the transition target position
         * @returns {number} The target position for transition (0-100%)
         */
        getTransitionTarget() {
            return null; // No specific target in continuous mode
        },
        
        /**
         * Get the text to display during transition
         * @returns {string} The transition instruction text
         */
        getTransitionText() {
            return 'Preparing next target...';
        },
        
        /**
         * Check if the transition condition is met
         * @param {number} pedalPosition - Current pedal position (0-100%)
         * @returns {boolean} Whether the condition is met
         */
        checkTransitionCondition(pedalPosition) {
            // In continuous mode, the transition condition is always met immediately
            return true;
        }
    }
};

/**
 * Helper function to get a game mode by name
 * @param {string} modeName - The name of the game mode
 * @returns {Object|null} The game mode object or null if not found
 */
GameModes.getMode = function(modeName) {
    // Convert the mode name to match the object properties
    let normalizedName = modeName;
    
    // Handle different formats of mode names
    if (modeName === 'From 0%' || modeName === 'from0' || modeName === 'fromZero') {
        normalizedName = 'fromZero';
    } else if (modeName === 'From 100%' || modeName === 'from100' || modeName === 'fromHundred') {
        normalizedName = 'fromHundred';
    } else if (modeName === 'Continuous' || modeName === 'continuous') {
        normalizedName = 'continuous';
    }
    
    // Return the mode object or null if not found
    return this[normalizedName] || null;
};

/**
 * Get all available game modes
 * @returns {Array} Array of game mode objects
 */
GameModes.getAllModes = function() {
    return [
        this.fromZero,
        this.fromHundred,
        this.continuous
    ];
};

/**
 * Get the default game mode
 * @returns {Object} The default game mode object
 */
GameModes.getDefaultMode = function() {
    const defaultModeName = Config.default_game_mode || 'fromZero';
    return this.getMode(defaultModeName) || this.fromZero;
};

// Make GameModes available globally
window.GameModes = GameModes;