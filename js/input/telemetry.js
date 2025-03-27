/**
 * telemetry.js
 * 
 * Records pedal input data over time for analysis and visualization.
 * Maintains a rolling buffer of recent pedal positions with timestamps.
 * Provides methods to access and analyze the telemetry data.
 */

class Telemetry {
    /**
     * Initialize the telemetry system
     */
    constructor() {
        // Configuration
        this.sampleRate = Config.telemetry_sample_rate || 30;   // Samples per second
        this.bufferSize = Config.telemetry_buffer_size || 600;  // Maximum number of samples to keep
        this.sampleInterval = 1000 / this.sampleRate;           // Interval between samples in ms
        
        // Data storage
        this.buffer = [];              // Array of telemetry data points
        this.sessionStartTime = null;  // When the current recording session started
        this.isRecording = false;      // Whether recording is active
        this.lastSampleTime = 0;       // Time of the last sample
        
        // Statistics
        this.stats = {
            min: 100,            // Minimum pedal position
            max: 0,              // Maximum pedal position
            avg: 0,              // Average pedal position
            totalSamples: 0      // Total number of samples taken
        };
        
        // Reference to the input handler
        this.inputHandler = null;
        
        // Bind methods
        this.recordSample = this.recordSample.bind(this);
    }
    
    /**
     * Set the input handler reference
     * @param {InputHandler} inputHandler - The input handler instance
     */
    setInputHandler(inputHandler) {
        this.inputHandler = inputHandler;
    }
    
    /**
     * Start recording telemetry data
     */
    startRecording() {
        if (this.isRecording) {
            console.warn("Telemetry recording is already active");
            return;
        }
        
        console.log("Starting telemetry recording");
        
        // Reset buffer and statistics
        this.buffer = [];
        this.resetStatistics();
        
        // Set start time and recording flag
        this.sessionStartTime = Date.now();
        this.lastSampleTime = this.sessionStartTime;
        this.isRecording = true;
        
        // Start the recording loop
        this.recordingInterval = setInterval(this.recordSample, this.sampleInterval);
    }
    
    /**
     * Stop recording telemetry data
     */
    stopRecording() {
        if (!this.isRecording) {
            console.warn("Telemetry recording is not active");
            return;
        }
        
        console.log("Stopping telemetry recording");
        
        // Clear the recording interval
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
        
        // Update recording flag
        this.isRecording = false;
    }
    
    /**
     * Reset statistics
     */
    resetStatistics() {
        this.stats = {
            min: 100,
            max: 0,
            avg: 0,
            totalSamples: 0
        };
    }
    
    /**
     * Record a telemetry sample
     */
    recordSample() {
        // Skip if not recording
        if (!this.isRecording) {
            return;
        }
        
        // Get current time and pedal position
        const currentTime = Date.now();
        
        // Get pedal position from input handler if available, otherwise use last known position
        let pedalPosition = 0;
        if (this.inputHandler) {
            pedalPosition = this.inputHandler.getPedalPosition();
        } else if (App.input) {
            // Fallback to global input handler
            pedalPosition = App.input.getPedalPosition();
            // Store reference to input handler for future use
            this.inputHandler = App.input;
        }
        
        // Calculate time since start of session in milliseconds
        const timeSinceStart = currentTime - this.sessionStartTime;
        
        // Create sample data point
        const sample = {
            time: timeSinceStart,          // Time since start (ms)
            timestamp: currentTime,        // Absolute timestamp (ms)
            position: pedalPosition,       // Pedal position (0-100%)
            isInTarget: false,             // Whether this position was within a target range
            isTransition: false,           // Whether this was during a transition period
            targetValue: null              // Current target value (if any)
        };
        
        // Add game state info if available
        if (window.App && App.gameLoop) {
            sample.isInTarget = App.gameLoop.isInTargetRange || false;
            sample.isTransition = App.gameLoop.isInTransition || false;
            sample.targetValue = App.gameLoop.currentTarget || null;
        }
        
        // Add to buffer
        this.buffer.push(sample);
        
        // Trim buffer if it exceeds maximum size
        if (this.buffer.length > this.bufferSize) {
            this.buffer.shift();
        }
        
        // Update statistics
        this.updateStatistics(pedalPosition);
        
        // Update last sample time
        this.lastSampleTime = currentTime;
    }
    
    /**
     * Update statistics with new sample
     * @param {number} position - The pedal position
     */
    updateStatistics(position) {
        // Update min/max
        this.stats.min = Math.min(this.stats.min, position);
        this.stats.max = Math.max(this.stats.max, position);
        
        // Update average
        this.stats.totalSamples++;
        const prevTotal = this.stats.avg * (this.stats.totalSamples - 1);
        this.stats.avg = (prevTotal + position) / this.stats.totalSamples;
    }
    
    /**
     * Mark the current target in the telemetry data
     * @param {number} targetValue - The target percentage
     * @param {boolean} isTransition - Whether this is a transition period
     */
    markTarget(targetValue, isTransition = false) {
        // Skip if not recording
        if (!this.isRecording) {
            return;
        }
        
        // Update the most recent samples with the target info
        const numSamplesToMark = Math.min(5, this.buffer.length);
        for (let i = 1; i <= numSamplesToMark; i++) {
            const index = this.buffer.length - i;
            if (index >= 0) {
                this.buffer[index].targetValue = targetValue;
                this.buffer[index].isTransition = isTransition;
            }
        }
    }
    
    /**
     * Mark samples as being within target range
     * @param {boolean} inRange - Whether the pedal is in the target range
     */
    markInRange(inRange) {
        // Skip if not recording
        if (!this.isRecording) {
            return;
        }
        
        // Update the most recent sample
        if (this.buffer.length > 0) {
            this.buffer[this.buffer.length - 1].isInTarget = inRange;
        }
    }
    
    /**
     * Get all telemetry data
     * @returns {Array} The telemetry buffer
     */
    getAllData() {
        return this.buffer.slice();
    }
    
    /**
     * Get the most recent N telemetry samples
     * @param {number} count - Number of samples to retrieve
     * @returns {Array} The most recent samples
     */
    getRecentData(count = 100) {
        const startIndex = Math.max(0, this.buffer.length - count);
        return this.buffer.slice(startIndex);
    }
    
    /**
     * Get data for a specific time range
     * @param {number} startTime - Start time in milliseconds since session start
     * @param {number} endTime - End time in milliseconds since session start
     * @returns {Array} Telemetry data within the specified time range
     */
    getDataInTimeRange(startTime, endTime) {
        return this.buffer.filter(sample => 
            sample.time >= startTime && sample.time <= endTime
        );
    }
    
    /**
     * Get telemetry statistics
     * @returns {Object} Statistics about the telemetry data
     */
    getStatistics() {
        return { ...this.stats };
    }
    
    /**
     * Calculate reaction time for a target
     * @param {number} targetTime - Time when the target was shown (ms since session start)
     * @param {number} targetValue - The target percentage
     * @param {number} range - Acceptable range around the target (±%)
     * @returns {number|null} Reaction time in milliseconds, or null if not found
     */
    calculateReactionTime(targetTime, targetValue, range) {
        // Find the first sample where the pedal position is within range of the target
        // after the target was shown
        const targetSamples = this.buffer.filter(sample => 
            sample.time >= targetTime && 
            Math.abs(sample.position - targetValue) <= range
        );
        
        // If we found matching samples, calculate reaction time
        if (targetSamples.length > 0) {
            return targetSamples[0].time - targetTime;
        }
        
        // No reaction found
        return null;
    }
    
    /**
     * Calculate accuracy statistics for a target
     * @param {number} targetValue - The target percentage
     * @param {number} startTime - Start time in milliseconds since session start
     * @param {number} endTime - End time in milliseconds since session start
     * @returns {Object} Accuracy statistics
     */
    calculateAccuracy(targetValue, startTime, endTime) {
        // Get samples in the specified time range
        const samples = this.getDataInTimeRange(startTime, endTime);
        
        if (samples.length === 0) {
            return {
                averageDeviation: null,
                maxDeviation: null,
                percentInRange: 0
            };
        }
        
        // Calculate deviations
        let totalDeviation = 0;
        let maxDeviation = 0;
        let samplesInRange = 0;
        
        samples.forEach(sample => {
            const deviation = Math.abs(sample.position - targetValue);
            totalDeviation += deviation;
            maxDeviation = Math.max(maxDeviation, deviation);
            
            if (sample.isInTarget) {
                samplesInRange++;
            }
        });
        
        return {
            averageDeviation: totalDeviation / samples.length,
            maxDeviation: maxDeviation,
            percentInRange: (samplesInRange / samples.length) * 100
        };
    }
    
    /**
     * Prepare data for a telemetry graph
     * @param {number} width - Graph width in pixels
     * @param {number} timeWindow - Time window to display in milliseconds
     * @returns {Object} Processed data for graphing
     */
    prepareGraphData(width = 600, timeWindow = 10000) {
        // Get recent data within the time window
        const currentTime = this.isRecording ? (Date.now() - this.sessionStartTime) : 
                           (this.buffer.length > 0 ? this.buffer[this.buffer.length - 1].time : 0);
        
        const startTime = Math.max(0, currentTime - timeWindow);
        let data = this.getDataInTimeRange(startTime, currentTime);
        
        // If we don't have enough data, just return what we have
        if (data.length < 2) {
            return {
                points: data.map(sample => ({
                    x: sample.time,
                    y: sample.position,
                    isInTarget: sample.isInTarget,
                    isTransition: sample.isTransition
                })),
                targets: [],
                timeRange: { start: startTime, end: currentTime }
            };
        }
        
        // Find target changes
        const targets = [];
        let prevTarget = null;
        
        data.forEach(sample => {
            if (sample.targetValue !== null && sample.targetValue !== prevTarget) {
                targets.push({
                    time: sample.time,
                    value: sample.targetValue,
                    isTransition: sample.isTransition
                });
                prevTarget = sample.targetValue;
            }
        });
        
        // Convert to points format for graphing
        const points = data.map(sample => ({
            x: sample.time,
            y: sample.position,
            isInTarget: sample.isInTarget,
            isTransition: sample.isTransition
        }));
        
        return {
            points,
            targets,
            timeRange: { start: startTime, end: currentTime }
        };
    }
    
    /**
     * Clear all telemetry data
     */
    clearData() {
        this.buffer = [];
        this.resetStatistics();
    }
}

// Make Telemetry available globally
window.Telemetry = Telemetry;