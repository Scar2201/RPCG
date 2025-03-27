/**
 * gameLoop.js
 * 
 * Implements the main game loop that drives the gameplay experience.
 * Handles target generation, validation, transitions, and timing.
 */

class GameLoop {
    /**
     * Initialize the game loop
     */
    constructor() {
        // Game state
        this.isRunning = false;        // Whether the game is currently running
        this.gameMode = null;          // Current game mode object
        this.reflexMode = false;       // Whether reflex mode is enabled
        
        // Target data
        this.currentTarget = null;     // Current target percentage
        this.targetStartTime = 0;      // When the current target was displayed
        this.targetsCompleted = 0;     // Number of completed targets
        this.totalTargets = 0;         // Total number of targets for this session
        this.targets = [];             // Array of target data
        
        // Progress tracking
        this.isInTransition = false;   // Whether we're in a transition phase
        this.transitionStartTime = 0;  // When the current transition started
        this.transitionComplete = false; // Whether the transition condition is met
        this.transitionConditionMetTime = null; // When the transition condition was first met
        this.isInTargetRange = false;  // Whether the pedal is currently in the target range
        this.inRangeStartTime = 0;     // When the pedal first entered the target range
        this.validDurationMet = false; // Whether the valid duration has been met
        
        // Timing
        this.gameStartTime = 0;        // When the game started
        this.gameTime = 0;             // Current game time (excluding transitions)
        this.lastFrameTime = 0;        // Time of the last frame
        this.deltaTime = 0;            // Time elapsed since last frame
        
        // Feedback timers (for visual feedback)
        this.successFeedbackTime = 0;  // Time remaining for success feedback
        
        // Animation frame request ID
        this.animationFrameId = null;
        
        // Bind game loop method to maintain context
        this.update = this.update.bind(this);
    }
    
    /**
     * Start a new game
     * @param {Object} sessionData - Data for this game session
     */
    startGame(sessionData) {
        console.log("Starting game:", sessionData);
        
        // Stop any existing game
        this.stopGame();
        
        // Set up game parameters
        this.reflexMode = sessionData.reflexMode || false;
        this.totalTargets = sessionData.totalTargets || Config.number_of_targets;
        
        // Reset tracking variables
        this.targetsCompleted = 0;
        this.targets = [];
        this.gameTime = 0;
        
        // Set the game mode
        this.setGameMode(sessionData.gameMode || Config.default_game_mode);
        
        // Initialize first transition
        this.startTransition();
        
        // Record the game start time
        this.gameStartTime = performance.now();
        this.lastFrameTime = this.gameStartTime;
        
        // Start telemetry recording if available
        if (App.telemetry) {
            App.telemetry.startRecording();
        }
        
        // Start the game loop
        this.isRunning = true;
        this.animationFrameId = requestAnimationFrame(this.update);
        
        console.log("Game started");
    }
    
    /**
     * Stop the current game
     */
    stopGame() {
        // Skip if not running
        if (!this.isRunning) {
            return;
        }
        
        // Stop the animation frame loop
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Stop telemetry recording
        if (App.telemetry) {
            App.telemetry.stopRecording();
        }
        
        // Reset state
        this.isRunning = false;
        
        console.log("Game stopped");
    }
    
    /**
     * Set the current game mode
     * @param {string} modeName - Name of the game mode
     */
    setGameMode(modeName) {
        // Get the game mode implementation
        if (typeof GameModes !== 'undefined' && GameModes[modeName]) {
            this.gameMode = GameModes[modeName];
            console.log(`Game mode set to: ${modeName}`);
        } else {
            console.error(`Game mode not found: ${modeName}`);
            // Default to fromZero mode
            this.gameMode = GameModes.fromZero;
        }
    }
    
    /**
     * Generate a new target percentage
     * @returns {number} A target percentage between min and max range
     */
    generateTarget() {
        return Config.generateRandomTarget();
    }
    
    /**
     * Start a transition phase
     * This is when the player must meet the initial condition before a new target appears
     */
    startTransition() {
        console.log("Starting transition phase");
        
        this.isInTransition = true;
        this.transitionStartTime = performance.now();
        this.transitionComplete = false;
        this.transitionConditionMetTime = null;
        this.currentTarget = null;
        
        // Update UI to show transition requirements
        this.updateGameUI();
        
        // Mark in telemetry
        if (App.telemetry) {
            App.telemetry.markTarget(this.gameMode.getTransitionTarget(), true);
        }
    }
    
    /**
     * Complete a transition phase and start a new target
     */
    completeTransition() {
        if (!this.isInTransition || this.transitionComplete) {
            return;
        }
        
        console.log("Transition complete");
        
        this.transitionComplete = true;
        
        // If reflex mode is enabled, use a random delay
        if (this.reflexMode) {
            const reflexDelay = Config.generateRandomReflexDelay();
            console.log(`Reflex mode: waiting ${reflexDelay}ms before showing target`);
            
            setTimeout(() => {
                this.showNewTarget();
            }, reflexDelay);
        } else {
            // Regular mode: wait for the configured transition delay
            // No need to wait more here since the delay is now handled in updateTransitionPhase
            this.showNewTarget();
        }
    }
    
    /**
     * Show a new target to the player
     */
    showNewTarget() {
        // Skip if game is not running
        if (!this.isRunning) {
            return;
        }
        
        // End transition phase
        this.isInTransition = false;
        
        // Reset transition tracking
        this.transitionConditionMetTime = null;
        this.transitionComplete = false;
        
        // Generate a new target
        this.currentTarget = this.generateTarget();
        this.targetStartTime = performance.now();
        
        // Reset target tracking
        this.isInTargetRange = false;
        this.inRangeStartTime = 0;
        this.validDurationMet = false;
        
        console.log(`New target: ${this.currentTarget}%`);
        
        // Update UI
        this.updateGameUI();
        
        // Mark in telemetry
        if (App.telemetry) {
            App.telemetry.markTarget(this.currentTarget, false);
        }
    }
    
    /**
     * Complete a target and move to the next
     */
    completeTarget() {
        // Increment completed targets
        this.targetsCompleted++;
        
        // Store target data
        const targetData = {
            targetValue: this.currentTarget,
            reactionTime: this.inRangeStartTime - this.targetStartTime,
            completionTime: performance.now() - this.targetStartTime,
            accuracy: 0  // Will be calculated by the scoring module
        };
        
        this.targets.push(targetData);
        
        // Trigger success feedback
        this.successFeedbackTime = 0.5; // 0.5 seconds of feedback
        
        console.log(`Target completed: ${this.currentTarget}%. ${this.targetsCompleted}/${this.totalTargets}`);
        
        // Check if this was the last target
        if (this.targetsCompleted >= this.totalTargets) {
            this.endGame();
            return;
        }
        
        // Reset transition tracking before starting new transition
        this.transitionConditionMetTime = null;
        this.transitionComplete = false;
        
        // Start new transition
        this.startTransition();
    }
    
    /**
     * End the game and show results
     */
    endGame() {
        console.log("Game completed");
        
        // Stop the game loop
        this.stopGame();
        
        // Calculate final results (happens in gameState)
        if (App.state) {
            // Update session data with target data
            const sessionData = App.state.getSessionData();
            sessionData.targets = this.targets;
            
            // End the game session
            App.state.endGameSession();
        }
    }
    
    /**
     * The main game loop update function
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    update(timestamp) {
        // Skip if not running
        if (!this.isRunning) {
            return;
        }
        
        // Calculate delta time (time since last frame)
        this.deltaTime = (timestamp - this.lastFrameTime) / 1000; // in seconds
        this.lastFrameTime = timestamp;
        
        // Get current pedal position
        const pedalPosition = App.input ? App.input.getPedalPosition() : 0;
        
        // Update timers
        this.updateTimers(timestamp);
        
        // Update game state based on current phase
        if (this.isInTransition) {
            this.updateTransitionPhase(pedalPosition);
        } else {
            this.updateTargetPhase(pedalPosition);
        }
        
        // Update visual feedback timers
        if (this.successFeedbackTime > 0) {
            this.successFeedbackTime -= this.deltaTime;
        }
        
        // Update UI
        this.updateGameUI();
        
        // Continue the game loop
        this.animationFrameId = requestAnimationFrame(this.update);
    }
    
    /**
     * Update game timers
     * @param {number} timestamp - Current timestamp
     */
    updateTimers(timestamp) {
        // Only accumulate game time during target phases (not transitions)
        if (!this.isInTransition) {
            this.gameTime += this.deltaTime;
        }
    }
    
    /**
     * Update logic for the transition phase
     * @param {number} pedalPosition - Current pedal position
     */
    updateTransitionPhase(pedalPosition) {
        // Skip if transition is already complete
        if (this.transitionComplete) {
            return;
        }
        
        // Check if the transition condition is met
        const isConditionMet = this.gameMode.checkTransitionCondition(pedalPosition);
        
        if (isConditionMet) {
            // Calculate how long the condition has been met
            const currentTime = performance.now();
            
            if (!this.transitionConditionMetTime) {
                // First time condition is met
                this.transitionConditionMetTime = currentTime;
                console.log("Transition condition met, starting timer");
            } else {
                // Check if condition has been met for long enough
                const timeInCondition = currentTime - this.transitionConditionMetTime;
                const transitionDelay = Config.transition_delay * 1000;
                
                // Update progress
                let transitionProgress = Math.min(1, timeInCondition / transitionDelay);
                this.updateGameUI();
                
                if (timeInCondition >= transitionDelay) {
                    console.log("Transition delay reached, completing transition");
                    this.completeTransition();
                }
            }
        } else {
            // Reset timer if condition is no longer met
            if (this.transitionConditionMetTime !== null) {
                console.log("Transition condition no longer met, resetting timer");
                this.transitionConditionMetTime = null;
            }
        }
    }
    
    /**
     * Update logic for the target phase
     * @param {number} pedalPosition - Current pedal position
     */
    updateTargetPhase(pedalPosition) {
        // Skip if target is already completed
        if (this.validDurationMet) {
            return;
        }
        
        // Check if pedal is within range of the target
        const precisionRange = Config.precision_range;
        const isInRange = Math.abs(pedalPosition - this.currentTarget) <= precisionRange;
        
        // Update telemetry
        if (App.telemetry) {
            App.telemetry.markInRange(isInRange);
        }
        
        // Handle entering/leaving the target range
        if (isInRange) {
            if (!this.isInTargetRange) {
                // Just entered target range
                this.isInTargetRange = true;
                this.inRangeStartTime = performance.now();
            } else {
                // Still in target range, check if valid duration is met
                const timeInRange = performance.now() - this.inRangeStartTime;
                const validDurationMs = Config.valid_duration * 1000;
                
                if (timeInRange >= validDurationMs) {
                    // Valid duration met, target complete
                    this.validDurationMet = true;
                    this.completeTarget();
                }
            }
        } else {
            // Not in range, reset the in-range timer
            this.isInTargetRange = false;
            this.inRangeStartTime = 0;
        }
    }
    
    /**
     * Update the game UI
     */
    updateGameUI() {
        // Skip if GameScreen is not available
        if (typeof GameScreen === 'undefined') {
            return;
        }
        
        // Always update current percentage display regardless of game phase
        GameScreen.setCurrentPercentage(App.input ? App.input.getPedalPosition() : 0);
        
        // Update target display
        if (this.isInTransition) {
            // Show transition requirements
            const transitionTarget = this.gameMode.getTransitionTarget();
            const transitionText = this.gameMode.getTransitionText();
            GameScreen.setTargetText(transitionText);
            
            // Calculate transition progress
            let transitionProgress = 0;
            if (this.transitionComplete) {
                transitionProgress = 1;
            } else if (this.transitionConditionMetTime) {
                // Show progress only if condition is being met
                const currentTime = performance.now();
                const transitionDelay = Config.transition_delay * 1000;
                transitionProgress = Math.min(1, (currentTime - this.transitionConditionMetTime) / transitionDelay);
            }
            
            GameScreen.setTransitionProgress(transitionProgress);
            GameScreen.setValidProgress(0);
            
        } else {
            // Show current target
            GameScreen.setTargetText(`Target: ${this.currentTarget}%`);
            
            // Calculate valid duration progress
            let validProgress = 0;
            if (this.validDurationMet) {
                validProgress = 1;
            } else if (this.isInTargetRange) {
                const currentTime = performance.now();
                const validDuration = Config.valid_duration * 1000;
                validProgress = Math.min(1, (currentTime - this.inRangeStartTime) / validDuration);
            }
            
            GameScreen.setTransitionProgress(0);
            GameScreen.setValidProgress(validProgress);
        }
        
        // Update status color based on game state
        let statusColor = 'red';  // Default: out of range
        
        if (this.isInTransition) {
            statusColor = this.transitionComplete ? 'green' : 'red';
        } else if (this.validDurationMet || this.successFeedbackTime > 0) {
            statusColor = 'green';  // Success
        } else if (this.isInTargetRange) {
            statusColor = 'blue';   // In range but duration not met
        }
        
        GameScreen.setStatusColor(statusColor);
        
        // Update target counter
        GameScreen.setTargetCounter(this.targetsCompleted, this.totalTargets);
        
        // Update timer
        GameScreen.setTimer(this.gameTime);
        
        // Update telemetry graph
        GameScreen.updateTelemetryGraph();
    }
    
    /**
     * Get the current game state
     * @returns {Object} The game state data
     */
    getGameState() {
        return {
            isRunning: this.isRunning,
            currentTarget: this.currentTarget,
            isInTransition: this.isInTransition,
            isInTargetRange: this.isInTargetRange,
            targetsCompleted: this.targetsCompleted,
            totalTargets: this.totalTargets,
            gameTime: this.gameTime
        };
    }
    
    /**
     * Pause the game
     */
    pauseGame() {
        if (!this.isRunning) {
            return;
        }
        
        console.log("Game paused");
        this.isRunning = false;
        
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Resume a paused game
     */
    resumeGame() {
        if (this.isRunning) {
            return;
        }
        
        console.log("Game resumed");
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.update);
    }
}

// Make GameLoop available globally
window.GameLoop = GameLoop;