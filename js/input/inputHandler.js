/**
 * inputHandler.js
 * 
 * Handles input from gamepads (pedals) and keyboard fallback.
 * Detects gamepad connections, reads pedal values, and normalizes them to 0-100%.
 * Provides a clean API for the game to check current pedal position.
 */

class InputHandler {
    /**
     * Initialize the InputHandler
     */
    constructor() {
        // Input state
        this.currentPedalPosition = 0;  // Current normalized pedal position (0-100%)
        this.rawPedalValue = 0;         // Raw value from gamepad
        
        // Gamepad tracking
        this.gamepads = {};             // Connected gamepads
        this.activeGamepad = null;      // Currently active gamepad
        this.pedalAxis = 1;             // Default axis for the pedal (usually right Y axis)
        this.pedalReversed = true;      // Whether the pedal axis is reversed (1 = released, -1 = fully pressed)
        this.axisValues = [];           // Current values of all axes
        
        // Keyboard fallback
        this.keyboardEnabled = false;   // Whether keyboard input is enabled
        this.keyboardIncrement = 3;     // How much to change the value per keypress
        this.keysPressedState = {       // Tracks which keys are pressed
            ArrowUp: false,
            ArrowDown: false
        };
        this.keyRepeatRate = 16;        // Milliseconds between key repeat updates
        this.keyRepeatTimer = null;     // Timer for key repeat
        
        // Input smoothing
        this.prevPedalPosition = 0;     // Previous pedal position for smoothing
        this.smoothingFactor = Config.input_smoothing || 0.2;  // Amount of smoothing (0-1)
        
        // Status
        this.inputType = 'none';        // Current input type ('gamepad', 'keyboard', 'none')
        this.isConnected = false;       // Whether an input device is connected
        
        // Binding event handlers
        this.onGamepadConnected = this.onGamepadConnected.bind(this);
        this.onGamepadDisconnected = this.onGamepadDisconnected.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
    }
    
    /**
     * Initialize the input handling system
     */
    initialize() {
        console.log("Initializing input handler");
        
        // Set up event listeners for gamepad connection/disconnection
        window.addEventListener('gamepadconnected', this.onGamepadConnected);
        window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
        
        // Set up keyboard event listeners
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        
        // Check if any gamepads are already connected
        this.checkForGamepads();
        
        // Set up UI event listeners
        this.setupUIEventListeners();
        
        // Start the update loop
        this.startUpdateLoop();
        
        console.log("Input handler initialized");
    }
    
    /**
     * Set up event listeners for UI elements
     */
    setupUIEventListeners() {
        // Listen for clicks on "Use Gamepad" button
        const useGamepadButton = document.getElementById('use-gamepad');
        if (useGamepadButton) {
            useGamepadButton.addEventListener('click', () => {
                this.checkForGamepads();
                this.enableGamepadInput();
                this.showGamepadSelectionUI();
            });
        }
        
        // Listen for clicks on "Use Keyboard" button
        const useKeyboardButton = document.getElementById('use-keyboard');
        if (useKeyboardButton) {
            useKeyboardButton.addEventListener('click', () => {
                this.enableKeyboardInput();
            });
        }
    }
    
    /**
     * Show the gamepad and axis selection UI
     */
    showGamepadSelectionUI() {
        // Create or get the device selection container
        let deviceContainer = document.getElementById('device-selection-container');
        if (!deviceContainer) {
            const deviceSection = document.querySelector('.device-selection').parentElement;
            
            deviceContainer = document.createElement('div');
            deviceContainer.id = 'device-selection-container';
            deviceContainer.classList.add('settings-container');
            deviceSection.insertBefore(deviceContainer, document.querySelector('.device-selection'));
        }
        
        // Clear previous content
        deviceContainer.innerHTML = '';
        
        // Add gamepad selection dropdown if we have gamepads
        const gamepadIds = Object.keys(this.gamepads);
        if (gamepadIds.length > 0) {
            const gamepadSelectionDiv = document.createElement('div');
            gamepadSelectionDiv.classList.add('setting');
            
            const gamepadLabel = document.createElement('label');
            gamepadLabel.textContent = 'Select Gamepad:';
            gamepadLabel.htmlFor = 'gamepad-select';
            
            const gamepadSelect = document.createElement('select');
            gamepadSelect.id = 'gamepad-select';
            
            // Add options for each gamepad
            gamepadIds.forEach(id => {
                const gamepad = this.gamepads[id];
                const option = document.createElement('option');
                option.value = id;
                option.textContent = gamepad.id;
                option.selected = (this.activeGamepad === parseInt(id));
                gamepadSelect.appendChild(option);
            });
            
            // Event listener for changing gamepad
            gamepadSelect.addEventListener('change', () => {
                this.activeGamepad = parseInt(gamepadSelect.value);
                this.inputType = 'gamepad';
                this.isConnected = true;
                this.updateDeviceStatus();
                
                // Refresh the axis selection UI for the new gamepad
                this.createAxisSelectionUI(deviceContainer);
            });
            
            gamepadSelectionDiv.appendChild(gamepadLabel);
            gamepadSelectionDiv.appendChild(gamepadSelect);
            deviceContainer.appendChild(gamepadSelectionDiv);
            
            // Create the axis selection UI
            this.createAxisSelectionUI(deviceContainer);
        } else {
            const noGamepadsMsg = document.createElement('div');
            noGamepadsMsg.textContent = 'No gamepads detected. Press a button on your controller to connect it.';
            noGamepadsMsg.style.padding = '10px';
            noGamepadsMsg.style.color = 'var(--danger-color)';
            deviceContainer.appendChild(noGamepadsMsg);
        }
    }
    
    /**
     * Create the axis selection UI with live testing
     * @param {HTMLElement} container - The container element
     */
    createAxisSelectionUI(container) {
        // Get the active gamepad
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let gamepad = null;
        if (this.activeGamepad !== null && gamepads[this.activeGamepad] !== null) {
            gamepad = gamepads[this.activeGamepad];
        }
        
        if (!gamepad) return;
        
        // Create axis selection section
        const axisSection = document.createElement('div');
        axisSection.classList.add('setting');
        axisSection.style.marginTop = '15px';
        
        const axisHeading = document.createElement('h3');
        axisHeading.textContent = 'Pedal Axis Configuration';
        axisHeading.style.marginBottom = '10px';
        axisSection.appendChild(axisHeading);
        
        // Instructions
        const instructions = document.createElement('p');
        instructions.textContent = 'Press your pedal and observe which axis responds. Select that axis as your pedal input.';
        instructions.style.marginBottom = '15px';
        instructions.style.fontSize = '0.9em';
        instructions.style.fontStyle = 'italic';
        axisSection.appendChild(instructions);
        
        // Create axis display table
        const axisTable = document.createElement('div');
        axisTable.classList.add('axis-table');
        axisTable.style.display = 'grid';
        axisTable.style.gridTemplateColumns = 'auto 1fr auto';
        axisTable.style.gap = '10px';
        axisTable.style.alignItems = 'center';
        axisTable.style.marginBottom = '20px';
        
        // Add header row
        const headerAxis = document.createElement('div');
        headerAxis.textContent = 'Axis';
        headerAxis.style.fontWeight = 'bold';
        
        const headerValue = document.createElement('div');
        headerValue.textContent = 'Value';
        headerValue.style.fontWeight = 'bold';
        
        const headerSelect = document.createElement('div');
        headerSelect.textContent = 'Select';
        headerSelect.style.fontWeight = 'bold';
        
        axisTable.appendChild(headerAxis);
        axisTable.appendChild(headerValue);
        axisTable.appendChild(headerSelect);
        
        // Add rows for each axis
        for (let i = 0; i < gamepad.axes.length; i++) {
            // Axis label
            const axisLabel = document.createElement('div');
            axisLabel.textContent = `Axis ${i}`;
            
            // Value bar container
            const valueBarContainer = document.createElement('div');
            valueBarContainer.style.width = '100%';
            valueBarContainer.style.height = '20px';
            valueBarContainer.style.backgroundColor = '#e1e1e1';
            valueBarContainer.style.borderRadius = '10px';
            valueBarContainer.style.overflow = 'hidden';
            valueBarContainer.style.position = 'relative';
            
            // Value bar
            const valueBar = document.createElement('div');
            valueBar.id = `axis-value-${i}`;
            valueBar.style.height = '100%';
            valueBar.style.width = '50%'; // Start at center
            valueBar.style.backgroundColor = i === this.pedalAxis ? 'var(--primary-color)' : '#aaa';
            valueBar.style.transition = 'width 0.1s ease-out';
            valueBarContainer.appendChild(valueBar);
            
            // Value text
            const valueText = document.createElement('div');
            valueText.id = `axis-text-${i}`;
            valueText.textContent = '0.00';
            valueText.style.position = 'absolute';
            valueText.style.top = '0';
            valueText.style.left = '0';
            valueText.style.right = '0';
            valueText.style.bottom = '0';
            valueText.style.textAlign = 'center';
            valueText.style.lineHeight = '20px';
            valueText.style.fontSize = '12px';
            valueText.style.fontFamily = 'monospace';
            valueText.style.color = '#000';
            valueBarContainer.appendChild(valueText);
            
            // Select button
            const selectButton = document.createElement('button');
            selectButton.textContent = i === this.pedalAxis ? 'Selected' : 'Select';
            selectButton.classList.add(i === this.pedalAxis ? 'primary-button' : 'secondary-button');
            selectButton.style.padding = '5px 10px';
            selectButton.style.fontSize = '0.8rem';
            
            selectButton.addEventListener('click', () => {
                this.pedalAxis = i;
                
                // Update all select buttons
                const allButtons = axisTable.querySelectorAll('button');
                allButtons.forEach((btn, idx) => {
                    btn.textContent = idx === i ? 'Selected' : 'Select';
                    btn.classList.remove('primary-button', 'secondary-button');
                    btn.classList.add(idx === i ? 'primary-button' : 'secondary-button');
                });
                
                // Update all value bars
                const allBars = axisTable.querySelectorAll('[id^="axis-value-"]');
                allBars.forEach((bar, idx) => {
                    bar.style.backgroundColor = idx === i ? 'var(--primary-color)' : '#aaa';
                });
            });
            
            // Add to table
            axisTable.appendChild(axisLabel);
            axisTable.appendChild(valueBarContainer);
            axisTable.appendChild(selectButton);
        }
        
        axisSection.appendChild(axisTable);
        
        // Add axis reversal option
        const reversalDiv = document.createElement('div');
        reversalDiv.classList.add('setting', 'checkbox');
        
        const reversalCheckbox = document.createElement('input');
        reversalCheckbox.type = 'checkbox';
        reversalCheckbox.id = 'axis-reversed';
        reversalCheckbox.checked = this.pedalReversed;
        
        const reversalLabel = document.createElement('label');
        reversalLabel.textContent = 'Reverse Axis (if pedal is inverted)';
        reversalLabel.htmlFor = 'axis-reversed';
        
        // Event listener for changing axis reversal
        reversalCheckbox.addEventListener('change', () => {
            this.pedalReversed = reversalCheckbox.checked;
        });
        
        reversalDiv.appendChild(reversalCheckbox);
        reversalDiv.appendChild(reversalLabel);
        axisSection.appendChild(reversalDiv);
        
        // Add to main container
        container.appendChild(axisSection);
        
        // Set up live updates of axis values
        this.axisUpdateInterval = setInterval(() => {
            if (!this.activeGamepad) return;
            
            const gamepad = navigator.getGamepads()[this.activeGamepad];
            if (!gamepad) return;
            
            for (let i = 0; i < gamepad.axes.length; i++) {
                const value = gamepad.axes[i];
                const valueBar = document.getElementById(`axis-value-${i}`);
                const valueText = document.getElementById(`axis-text-${i}`);
                
                if (valueBar && valueText) {
                    // Convert -1 to 1 range to 0% to 100% for display
                    const barWidth = ((value + 1) / 2) * 100;
                    valueBar.style.width = `${barWidth}%`;
                    valueText.textContent = value.toFixed(2);
                    
                    // Highlight when value changes significantly
                    if (Math.abs(value) > 0.5) {
                        valueBar.style.backgroundColor = i === this.pedalAxis ? 
                            'var(--secondary-color)' : 'var(--warning-color)';
                    } else {
                        valueBar.style.backgroundColor = i === this.pedalAxis ? 
                            'var(--primary-color)' : '#aaa';
                    }
                }
            }
        }, 50); // Update 20 times per second
    }
    
    /**
     * Enable gamepad input and disable keyboard input
     */
    enableGamepadInput() {
        this.keyboardEnabled = false;
        this.updateDeviceStatus();
    }
    
    /**
     * Enable keyboard input as a fallback
     */
    enableKeyboardInput() {
        this.keyboardEnabled = true;
        this.inputType = 'keyboard';
        this.isConnected = true;
        this.updateDeviceStatus();
        
        // Reset the current position to 0 when switching to keyboard
        this.currentPedalPosition = 0;
        this.prevPedalPosition = 0;
        
        // Start telemetry if it's not already running
        if (App.telemetry && !App.telemetry.isRecording && App.state && App.state.currentState === 'gameScreen') {
            App.telemetry.startRecording();
        }
    }
    
    /**
     * Start the input update loop
     */
    startUpdateLoop() {
        // Define the update function
        const updateInputs = () => {
            this.update();
            requestAnimationFrame(updateInputs);
        };
        
        // Start the loop
        requestAnimationFrame(updateInputs);
    }
    
    /**
     * Update input states (called on each animation frame)
     */
    update() {
        // Update gamepad state if using gamepad
        if (this.inputType === 'gamepad' && this.activeGamepad) {
            this.updateGamepadState();
        }
        
        // Update keyboard input if enabled
        if (this.inputType === 'keyboard' && this.keyboardEnabled) {
            this.updateKeyboardInput();
        }
        
        // Apply smoothing to pedal position
        this.smoothPedalPosition();
    }
    
    /**
     * Update the gamepad state
     */
    updateGamepadState() {
        // Get fresh gamepad data
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        // Find our active gamepad
        let gamepad = null;
        if (this.activeGamepad !== null && gamepads[this.activeGamepad] !== null) {
            gamepad = gamepads[this.activeGamepad];
        }
        
        // If we have a gamepad, read its values
        if (gamepad) {
            // Store all axis values for display in the UI
            this.axisValues = [];
            for (let i = 0; i < gamepad.axes.length; i++) {
                this.axisValues.push(gamepad.axes[i]);
            }
            
            // Read the pedal axis
            this.rawPedalValue = gamepad.axes[this.pedalAxis];
            
            // Convert to 0-100% range
            let normalizedValue;
            if (this.pedalReversed) {
                // Reversed axis (1 = released, -1 = pressed)
                normalizedValue = (1 - this.rawPedalValue) * 50;
            } else {
                // Normal axis (-1 = released, 1 = pressed)
                normalizedValue = (this.rawPedalValue + 1) * 50;
            }
            
            // Clamp to 0-100 range
            this.currentPedalPosition = Math.max(0, Math.min(100, normalizedValue));
        }
    }
    
    /**
     * Update keyboard input state
     */
    updateKeyboardInput() {
        // Adjust pedal position based on which keys are pressed
        if (this.keysPressedState.ArrowUp) {
            this.currentPedalPosition += this.keyboardIncrement;
        }
        
        if (this.keysPressedState.ArrowDown) {
            this.currentPedalPosition -= this.keyboardIncrement;
        }
        
        // Clamp to 0-100 range
        this.currentPedalPosition = Math.max(0, Math.min(100, this.currentPedalPosition));
        
        // Make sure telemetry is recording when keyboard is active
        if (this.keyboardEnabled && App.telemetry && App.state && 
            App.state.currentState === 'gameScreen' && !App.telemetry.isRecording) {
            App.telemetry.startRecording();
        }
    }
    
    /**
     * Apply smoothing to the pedal position
     */
    smoothPedalPosition() {
        // Apply smoothing if enabled
        if (this.smoothingFactor > 0) {
            this.currentPedalPosition = this.prevPedalPosition * this.smoothingFactor + 
                                        this.currentPedalPosition * (1 - this.smoothingFactor);
        }
        
        // Store current position for next frame
        this.prevPedalPosition = this.currentPedalPosition;
    }
    
    /**
     * Handle gamepad connected event
     * @param {GamepadEvent} event - The gamepad connection event
     */
    onGamepadConnected(event) {
        console.log(`Gamepad connected: ${event.gamepad.id}`);
        
        // Store reference to the connected gamepad
        this.gamepads[event.gamepad.index] = event.gamepad;
        
        // If we don't have an active gamepad, use this one
        if (this.activeGamepad === null) {
            this.activeGamepad = event.gamepad.index;
            this.inputType = 'gamepad';
            this.isConnected = true;
        }
        
        // Update device status display
        this.updateDeviceStatus();
        
        // Update gamepad selection UI if visible
        if (document.getElementById('device-selection-container')) {
            this.showGamepadSelectionUI();
        }
    }
    
    /**
     * Handle gamepad disconnected event
     * @param {GamepadEvent} event - The gamepad disconnection event
     */
    onGamepadDisconnected(event) {
        console.log(`Gamepad disconnected: ${event.gamepad.id}`);
        
        // Remove reference to the disconnected gamepad
        delete this.gamepads[event.gamepad.index];
        
        // If this was the active gamepad, find another one
        if (this.activeGamepad === event.gamepad.index) {
            // Look for another connected gamepad
            const gamepadIndices = Object.keys(this.gamepads);
            if (gamepadIndices.length > 0) {
                this.activeGamepad = parseInt(gamepadIndices[0]);
            } else {
                this.activeGamepad = null;
                this.inputType = this.keyboardEnabled ? 'keyboard' : 'none';
                this.isConnected = this.keyboardEnabled;
            }
        }
        
        // Update device status display
        this.updateDeviceStatus();
        
        // Update gamepad selection UI if visible
        if (document.getElementById('device-selection-container')) {
            this.showGamepadSelectionUI();
        }
    }
    
    /**
     * Handle key down event
     * @param {KeyboardEvent} event - The key down event
     */
    onKeyDown(event) {
        // Only handle arrow keys
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            // Prevent default action (scrolling)
            event.preventDefault();
            
            // If the key is already pressed, do nothing (avoid repeated keydown events)
            if (this.keysPressedState[event.key]) {
                return;
            }
            
            // Update key state
            this.keysPressedState[event.key] = true;
            
            // Enable keyboard input if it's not already enabled
            if (!this.keyboardEnabled && this.inputType !== 'gamepad') {
                this.enableKeyboardInput();
            }
            
            // Immediately apply the key press
            this.updateKeyboardInput();
            
            // Start key repeat timer if not already running
            if (!this.keyRepeatTimer) {
                this.keyRepeatTimer = setInterval(() => {
                    if (this.keysPressedState.ArrowUp || this.keysPressedState.ArrowDown) {
                        this.updateKeyboardInput();
                    } else {
                        // No keys pressed, clear the interval
                        clearInterval(this.keyRepeatTimer);
                        this.keyRepeatTimer = null;
                    }
                }, this.keyRepeatRate);
            }
        }
    }
    
    /**
     * Handle key up event
     * @param {KeyboardEvent} event - The key up event
     */
    onKeyUp(event) {
        // Only handle arrow keys
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            // Prevent default action
            event.preventDefault();
            
            // Update key state
            this.keysPressedState[event.key] = false;
        }
    }
    
    /**
     * Check for already connected gamepads
     */
    checkForGamepads() {
        console.log("Checking for connected gamepads");
        
        // Get all connected gamepads
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        // Store connected gamepads
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad) {
                console.log(`Found gamepad: ${gamepad.id}`);
                this.gamepads[gamepad.index] = gamepad;
                
                // If we don't have an active gamepad, use this one
                if (this.activeGamepad === null) {
                    this.activeGamepad = gamepad.index;
                    this.inputType = 'gamepad';
                    this.isConnected = true;
                }
            }
        }
        
        // Update device status display
        this.updateDeviceStatus();
    }
    
    /**
     * Update the device status display
     */
    updateDeviceStatus() {
        const deviceStatusEl = document.getElementById('device-status');
        if (deviceStatusEl) {
            if (this.inputType === 'gamepad' && this.activeGamepad !== null) {
                const gamepad = this.gamepads[this.activeGamepad];
                deviceStatusEl.textContent = `Gamepad connected: ${gamepad.id}`;
                deviceStatusEl.style.color = 'var(--secondary-color)';
            } else if (this.inputType === 'keyboard') {
                deviceStatusEl.textContent = 'Using keyboard (arrow keys)';
                deviceStatusEl.style.color = 'var(--primary-color)';
            } else {
                deviceStatusEl.textContent = 'No input device detected';
                deviceStatusEl.style.color = 'var(--danger-color)';
            }
        }
    }
    
    /**
     * Get the current pedal position
     * @returns {number} The current pedal position (0-100%)
     */
    getPedalPosition() {
        return this.currentPedalPosition;
    }
    
    /**
     * Check if the input is at a specific position
     * @param {number} position - The position to check against (0-100%)
     * @param {number} tolerance - The acceptable tolerance (±%)
     * @returns {boolean} Whether the pedal is at the specified position
     */
    isPedalAtPosition(position, tolerance = 2) {
        const lowerBound = position - tolerance;
        const upperBound = position + tolerance;
        return this.currentPedalPosition >= lowerBound && this.currentPedalPosition <= upperBound;
    }
    
    /**
     * Check if the input is within a range
     * @param {number} target - The target position
     * @param {number} range - The acceptable range (±%)
     * @returns {boolean} Whether the pedal is within the specified range
     */
    isPedalWithinRange(target, range) {
        const lowerBound = target - range;
        const upperBound = target + range;
        return this.currentPedalPosition >= lowerBound && this.currentPedalPosition <= upperBound;
    }
    
    /**
     * Force the pedal to a specific position (for testing or debug)
     * @param {number} position - The position to set (0-100%)
     */
    forcePedalPosition(position) {
        this.currentPedalPosition = Math.max(0, Math.min(100, position));
        this.prevPedalPosition = this.currentPedalPosition;
    }
    
    /**
     * Clean up event listeners
     */
    cleanup() {
        window.removeEventListener('gamepadconnected', this.onGamepadConnected);
        window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        
        // Clear any running intervals
        if (this.axisUpdateInterval) {
            clearInterval(this.axisUpdateInterval);
        }
        
        if (this.keyRepeatTimer) {
            clearInterval(this.keyRepeatTimer);
            this.keyRepeatTimer = null;
        }
    }
}

// Make InputHandler available globally
window.InputHandler = InputHandler;