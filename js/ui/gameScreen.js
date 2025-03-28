/**
 * gameScreen.js
 * 
 * Manages the game screen interface for the Sim Racing Pedal Training application.
 * Displays target percentages, current input, visual feedback, and telemetry.
 */

const GameScreen = {
    // Canvas context for telemetry graph
    telemetryGraphCtx: null,
    
    // Reference elements
    targetElement: null,
    currentElement: null,
    transitionProgressElement: null,
    validProgressElement: null,
    timerElement: null,
    targetCounterElement: null,
    
    // Telemetry graph settings
    telemetryGraphSettings: {
        width: 0,
        height: 0,
        timeWindow: 4000,    // 4 seconds of data
        lineWidth: 3,
        lineColor: 'rgba(46, 204, 113, 1)',
        gridColor: 'rgba(200, 200, 200, 0.4)',
        backgroundColor: '#f8f8f8',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: 12
    },
    
    // Status colors
    statusColors: {
        red: 'var(--danger-color)',
        blue: 'var(--info-color)',
        green: 'var(--secondary-color)'
    },
    
    /**
     * Initialize the game screen
     */
    initialize() {
        console.log("Initializing game screen");
        
        // Cache references to DOM elements
        this.targetElement = document.getElementById('target-percentage');
        this.currentElement = document.getElementById('current-percentage');
        this.transitionProgressElement = document.getElementById('transition-progress').querySelector('.progress-fill');
        this.validProgressElement = document.getElementById('valid-progress').querySelector('.progress-fill');
        this.timerElement = document.getElementById('timer');
        this.targetCounterElement = document.getElementById('target-counter');
        
        // Initialize telemetry graph
        this.initializeTelemetryGraph();
        
        // Set up event listeners
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for the game screen
     */
    setupEventListeners() {
        // Currently no specific event listeners needed for the game screen
        // Game logic is driven by the game loop
    },
    
    /**
     * Initialize the telemetry graph canvas
     */
    initializeTelemetryGraph() {
        const canvas = document.getElementById('telemetry-graph');
        if (!canvas) {
            console.error("Telemetry graph canvas not found");
            return;
        }
        
        // Get canvas context
        this.telemetryGraphCtx = canvas.getContext('2d');
        
        // Set initial canvas size
        this.resizeTelemetryGraph();
        
        // Update the telemetry graph settings to show last 4 seconds
        this.telemetryGraphSettings.timeWindow = 4000; // 4 seconds
    },
    
    /**
     * Resize the telemetry graph canvas
     */
    resizeTelemetryGraph() {
        const canvas = document.getElementById('telemetry-graph');
        if (!canvas || !this.telemetryGraphCtx) {
            return;
        }
        
        // Get container dimensions
        const container = document.getElementById('telemetry-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set canvas size to match container
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // Update settings
        this.telemetryGraphSettings.width = containerWidth;
        this.telemetryGraphSettings.height = containerHeight;
        
        // Redraw graph
        this.updateTelemetryGraph();
    },
    
    /**
     * Update the telemetry graph with current data
     */
    updateTelemetryGraph() {
        // Skip if context not available
        if (!this.telemetryGraphCtx) {
            return;
        }
        
        const ctx = this.telemetryGraphCtx;
        const settings = this.telemetryGraphSettings;
        const width = settings.width;
        const height = settings.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw simple grid
        this.drawSimpleGrid();
        
        // Skip drawing if no telemetry data available
        if (!App.telemetry) {
            return;
        }
        
        // Make sure telemetry is recording if game is running
        if (App.gameLoop && App.gameLoop.isRunning && !App.telemetry.isRecording) {
            App.telemetry.startRecording();
        }
        
        // Get telemetry data prepared for graphing
        const graphData = App.telemetry.prepareGraphData(width, settings.timeWindow);
        
        // Skip if not enough data points
        if (!graphData.points || graphData.points.length < 2) {
            return;
        }
        
        // Draw the pedal input line
        this.drawInputLine(graphData);
    },
    
    /**
     * Draw a simple grid
     */
    drawSimpleGrid() {
        const ctx = this.telemetryGraphCtx;
        const settings = this.telemetryGraphSettings;
        const width = settings.width;
        const height = settings.height;
        
        // Draw background
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Leave space for axis labels
        const leftMargin = 10;     // Small space at the left
        const rightMargin = 40;    // Space for y-axis labels on the right
        const bottomMargin = 25;   // Space for x-axis labels
        const topMargin = 10;      // Space at the top
        
        const graphWidth = width - leftMargin - rightMargin;
        const graphHeight = height - bottomMargin - topMargin;
        
        // Draw axis lines
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        
        // Y-axis (right side)
        ctx.beginPath();
        ctx.moveTo(width - rightMargin, topMargin);
        ctx.lineTo(width - rightMargin, height - bottomMargin);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(leftMargin, height - bottomMargin);
        ctx.lineTo(width - rightMargin, height - bottomMargin);
        ctx.stroke();
        
        // Draw grid and y-axis labels (0%, 25%, 50%, 75%, 100%)
        ctx.strokeStyle = settings.gridColor;
        ctx.lineWidth = 1;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
        
        for (let i = 0; i <= 100; i += 25) {
            const y = height - bottomMargin - (i / 100) * graphHeight;
            
            // Draw horizontal grid line
            ctx.beginPath();
            ctx.moveTo(leftMargin, y);
            ctx.lineTo(width - rightMargin, y);
            ctx.stroke();
            
            // Draw y-axis label on right side
            ctx.fillStyle = '#000';
            ctx.fillText(`${i}%`, width - rightMargin + 5, y);
        }
        
        // Draw grid and x-axis labels (0, -1, -2, -3, -4 seconds)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const timeWindow = settings.timeWindow;
        const secondWidth = graphWidth / (timeWindow / 1000);
        
        for (let i = 0; i <= timeWindow / 1000; i++) {
            const x = width - rightMargin - (i * secondWidth);
            
            // Only draw at second intervals
            if (x >= leftMargin) {
                // Draw vertical grid line
                ctx.beginPath();
                ctx.moveTo(x, topMargin);
                ctx.lineTo(x, height - bottomMargin);
                ctx.stroke();
                
                // Draw x-axis label
                ctx.fillStyle = '#000';
                ctx.fillText(`-${i}`, x, height - bottomMargin + 5);
            }
        }
    },
    
    /**
     * Draw the pedal input line
     * @param {Object} graphData - The prepared graph data
     */
    drawInputLine(graphData) {
        const ctx = this.telemetryGraphCtx;
        const settings = this.telemetryGraphSettings;
        const width = settings.width;
        const height = settings.height;
        const timeRange = graphData.timeRange;
        const timeWindow = timeRange.end - timeRange.start;
        const points = graphData.points;
        
        if (points.length < 2) {
            return;
        }
        
        // Leave space for axis labels (same as in drawSimpleGrid)
        const leftMargin = 10;     // Small space at the left
        const rightMargin = 40;    // Space for y-axis labels on the right
        const bottomMargin = 25;   // Space for x-axis labels
        const topMargin = 10;      // Space at the top
        
        const graphWidth = width - leftMargin - rightMargin;
        const graphHeight = height - bottomMargin - topMargin;
        
        // Draw the main input line
        ctx.beginPath();
        ctx.strokeStyle = settings.lineColor;
        ctx.lineWidth = settings.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        let started = false;
        
        points.forEach(point => {
            // Calculate position - adjusted for margins
            const x = width - rightMargin - ((timeRange.end - point.x) / timeWindow) * graphWidth;
            const y = height - bottomMargin - (point.y / 100) * graphHeight;
            
            // Skip if out of visible graph area
            if (x < leftMargin) return;
            
            // Start or continue the line
            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    },
    
    /**
     * Set the target percentage text
     * @param {string} text - The text to display
     */
    setTargetText(text) {
        if (this.targetElement) {
            this.targetElement.textContent = text;
        }
    },
    
    /**
     * Set the current percentage display
     * @param {number} percentage - The current pedal position percentage
     */
    setCurrentPercentage(percentage) {
        if (this.currentElement) {
            this.currentElement.textContent = `Current: ${Math.round(percentage)}%`;
        }
    },
    
    /**
     * Set the transition progress bar fill
     * @param {number} progress - Progress value between 0 and 1
     */
    setTransitionProgress(progress) {
        if (this.transitionProgressElement) {
            this.transitionProgressElement.style.width = `${progress * 100}%`;
        }
    },
    
    /**
     * Set the valid duration progress bar fill
     * @param {number} progress - Progress value between 0 and 1
     */
    setValidProgress(progress) {
        if (this.validProgressElement) {
            this.validProgressElement.style.width = `${progress * 100}%`;
        }
    },
    
    /**
     * Set the status color for visual feedback
     * @param {string} colorName - Color name ('red', 'blue', or 'green')
     */
    setStatusColor(colorName) {
        const color = this.statusColors[colorName] || this.statusColors.red;
        
        // Apply color to current percentage display
        if (this.currentElement) {
            this.currentElement.style.color = color;
        }
    },
    
    /**
     * Set the timer display
     * @param {number} timeInSeconds - The time to display in seconds
     */
    setTimer(timeInSeconds) {
        if (this.timerElement) {
            this.timerElement.textContent = Scoring.formatTime(timeInSeconds);
        }
    },
    
    /**
     * Set the target counter display
     * @param {number} current - Current target number
     * @param {number} total - Total number of targets
     */
    setTargetCounter(current, total) {
        if (this.targetCounterElement) {
            this.targetCounterElement.textContent = `Target: ${current + 1}/${total}`;
        }
    },
    
    /**
     * Handle window resize event
     */
    handleResize() {
        // Resize the telemetry graph
        this.resizeTelemetryGraph();
    }
};

// Make GameScreen available globally
window.GameScreen = GameScreen;