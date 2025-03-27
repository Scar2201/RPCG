/**
 * components.js
 * 
 * Reusable UI components for the Sim Racing Pedal Training application.
 * Provides standardized UI elements like progress bars, graphs, and displays.
 */

const Components = {
    /**
     * Create a progress bar component
     * @param {Object} options - Configuration options for the progress bar
     * @returns {Object} Progress bar component
     */
    createProgressBar(options = {}) {
        // Default options
        const defaults = {
            containerId: null,          // ID of container element
            width: '100%',              // Width of the progress bar
            height: '24px',             // Height of the progress bar
            backgroundColor: '#e1e1e1',  // Background color
            fillColor: '#2b87d8',        // Fill color
            borderRadius: '12px',        // Border radius
            labelText: '',              // Text to display in the bar
            labelColor: '#000',         // Label text color
            value: 0                    // Initial value (0-1)
        };
        
        // Merge defaults with provided options
        const settings = { ...defaults, ...options };
        
        // Create or get the container element
        let container;
        if (settings.containerId) {
            container = document.getElementById(settings.containerId);
            if (!container) {
                console.error(`Container element with ID "${settings.containerId}" not found`);
                return null;
            }
        } else {
            container = document.createElement('div');
            container.className = 'progress-bar-container';
        }
        
        // Create the progress bar elements
        const progressBarElement = document.createElement('div');
        progressBarElement.className = 'progress-bar';
        progressBarElement.style.width = settings.width;
        progressBarElement.style.height = settings.height;
        progressBarElement.style.backgroundColor = settings.backgroundColor;
        progressBarElement.style.borderRadius = settings.borderRadius;
        progressBarElement.style.overflow = 'hidden';
        progressBarElement.style.position = 'relative';
        
        const fillElement = document.createElement('div');
        fillElement.className = 'progress-fill';
        fillElement.style.height = '100%';
        fillElement.style.width = `${settings.value * 100}%`;
        fillElement.style.backgroundColor = settings.fillColor;
        fillElement.style.borderRadius = settings.borderRadius;
        fillElement.style.transition = 'width 0.1s linear';
        
        const labelElement = document.createElement('span');
        labelElement.className = 'progress-label';
        labelElement.textContent = settings.labelText;
        labelElement.style.position = 'absolute';
        labelElement.style.top = '50%';
        labelElement.style.left = '50%';
        labelElement.style.transform = 'translate(-50%, -50%)';
        labelElement.style.color = settings.labelColor;
        labelElement.style.fontWeight = '500';
        labelElement.style.fontSize = '0.9rem';
        
        // Assemble the progress bar
        progressBarElement.appendChild(fillElement);
        progressBarElement.appendChild(labelElement);
        
        // Add to container if not already there
        if (!settings.containerId) {
            container.appendChild(progressBarElement);
        }
        
        // Return component API
        return {
            element: progressBarElement,
            fillElement: fillElement,
            labelElement: labelElement,
            
            /**
             * Set the progress value
             * @param {number} value - Progress value (0-1)
             */
            setValue(value) {
                const clampedValue = Math.max(0, Math.min(1, value));
                fillElement.style.width = `${clampedValue * 100}%`;
            },
            
            /**
             * Set the label text
             * @param {string} text - Text to display
             */
            setLabel(text) {
                labelElement.textContent = text;
            },
            
            /**
             * Set the fill color
             * @param {string} color - CSS color value
             */
            setFillColor(color) {
                fillElement.style.backgroundColor = color;
            },
            
            /**
             * Get the current progress value
             * @returns {number} Current progress value (0-1)
             */
            getValue() {
                return parseFloat(fillElement.style.width) / 100;
            }
        };
    },
    
    /**
     * Create a percentage display component
     * @param {Object} options - Configuration options for the percentage display
     * @returns {Object} Percentage display component
     */
    createPercentageDisplay(options = {}) {
        // Default options
        const defaults = {
            containerId: null,          // ID of container element
            size: 'large',              // 'small', 'medium', or 'large'
            textPrefix: '',             // Text to display before the percentage
            textSuffix: '%',            // Text to display after the percentage
            color: '#2b87d8',           // Text color
            value: 0                    // Initial value (0-100)
        };
        
        // Merge defaults with provided options
        const settings = { ...defaults, ...options };
        
        // Create or get the container element
        let container;
        if (settings.containerId) {
            container = document.getElementById(settings.containerId);
            if (!container) {
                console.error(`Container element with ID "${settings.containerId}" not found`);
                return null;
            }
        } else {
            container = document.createElement('div');
            container.className = 'percentage-display-container';
        }
        
        // Determine font size based on size setting
        let fontSize;
        switch (settings.size) {
            case 'small':
                fontSize = '1.5rem';
                break;
            case 'medium':
                fontSize = '2.5rem';
                break;
            case 'large':
                fontSize = '4rem';
                break;
            default:
                fontSize = '2.5rem';
        }
        
        // Create the percentage display element
        const displayElement = document.createElement('div');
        displayElement.className = 'percentage-display';
        displayElement.style.fontSize = fontSize;
        displayElement.style.fontWeight = 'bold';
        displayElement.style.color = settings.color;
        displayElement.style.textAlign = 'center';
        
        // Update the display text
        const updateDisplayText = (value) => {
            displayElement.textContent = `${settings.textPrefix}${Math.round(value)}${settings.textSuffix}`;
        };
        
        // Set initial text
        updateDisplayText(settings.value);
        
        // Add to container if not already there
        if (!settings.containerId) {
            container.appendChild(displayElement);
        }
        
        // Return component API
        return {
            element: displayElement,
            
            /**
             * Set the percentage value
             * @param {number} value - Percentage value (0-100)
             */
            setValue(value) {
                const clampedValue = Math.max(0, Math.min(100, value));
                updateDisplayText(clampedValue);
            },
            
            /**
             * Set the text color
             * @param {string} color - CSS color value
             */
            setColor(color) {
                displayElement.style.color = color;
            },
            
            /**
             * Set the prefix text
             * @param {string} prefix - Text to display before the percentage
             */
            setPrefix(prefix) {
                settings.textPrefix = prefix;
                updateDisplayText(settings.value);
            },
            
            /**
             * Set the suffix text
             * @param {string} suffix - Text to display after the percentage
             */
            setSuffix(suffix) {
                settings.textSuffix = suffix;
                updateDisplayText(settings.value);
            },
            
            /**
             * Get the current percentage value
             * @returns {number} Current percentage value (0-100)
             */
            getValue() {
                const text = displayElement.textContent;
                const value = parseInt(text.replace(settings.textPrefix, '').replace(settings.textSuffix, ''));
                return isNaN(value) ? 0 : value;
            }
        };
    },
    
    /**
     * Create a telemetry graph component
     * @param {Object} options - Configuration options for the telemetry graph
     * @returns {Object} Telemetry graph component
     */
    createTelemetryGraph(options = {}) {
        // Default options
        const defaults = {
            containerId: null,          // ID of container element
            width: 600,                 // Width of the graph
            height: 200,                // Height of the graph
            timeWindow: 5000,           // Time window to display (ms)
            backgroundColor: '#ffffff', // Background color
            gridColor: 'rgba(200, 200, 200, 0.2)', // Grid line color
            inputLineColor: 'rgba(46, 204, 113, 1)', // Input line color
            targetLineColor: 'rgba(52, 152, 219, 0.7)', // Target line color
            inRangeColor: 'rgba(46, 204, 113, 0.3)', // In-range area color
            transitionColor: 'rgba(241, 196, 15, 0.3)', // Transition area color
            textColor: 'rgba(0, 0, 0, 0.7)' // Text color
        };
        
        // Merge defaults with provided options
        const settings = { ...defaults, ...options };
        
        // Create or get the container element
        let container;
        if (settings.containerId) {
            container = document.getElementById(settings.containerId);
            if (!container) {
                console.error(`Container element with ID "${settings.containerId}" not found`);
                return null;
            }
        } else {
            container = document.createElement('div');
            container.className = 'telemetry-graph-container';
            container.style.width = `${settings.width}px`;
            container.style.height = `${settings.height}px`;
            container.style.border = '1px solid #ddd';
            container.style.borderRadius = '8px';
            container.style.overflow = 'hidden';
        }
        
        // Create the canvas element
        const canvas = document.createElement('canvas');
        canvas.width = settings.width;
        canvas.height = settings.height;
        canvas.style.display = 'block';
        
        // Add canvas to container
        container.appendChild(canvas);
        
        // Get canvas context
        const ctx = canvas.getContext('2d');
        
        // Data for the graph
        let graphData = {
            points: [],
            targets: [],
            timeRange: { start: 0, end: 0 }
        };
        
        /**
         * Draw the graph
         */
        const drawGraph = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw background
            ctx.fillStyle = settings.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Check if we have enough data to draw
            if (graphData.points.length < 2) {
                // Draw "No data" message
                ctx.fillStyle = settings.textColor;
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('No telemetry data available', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            // Draw grid
            drawGrid();
            
            // Draw target zones
            drawTargetZones();
            
            // Draw input line
            drawInputLine();
        };
        
        /**
         * Draw the grid
         */
        const drawGrid = () => {
            ctx.strokeStyle = settings.gridColor;
            ctx.lineWidth = 1;
            
            // Draw horizontal grid lines (0%, 25%, 50%, 75%, 100%)
            for (let i = 0; i <= 100; i += 25) {
                const y = canvas.height - (i / 100) * canvas.height;
                
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
                
                // Add percentage label
                ctx.font = '12px Arial';
                ctx.fillStyle = settings.textColor;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${i}%`, 5, y);
            }
            
            // Draw vertical grid lines (every second)
            const timeWindow = settings.timeWindow;
            const secondWidth = canvas.width / (timeWindow / 1000);
            
            for (let i = 0; i <= timeWindow / 1000; i++) {
                const x = canvas.width - (i * secondWidth);
                
                if (x >= 0) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                    
                    // Add time label
                    if (i % 1 === 0) { // Every second
                        ctx.font = '12px Arial';
                        ctx.fillStyle = settings.textColor;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillText(`-${i}s`, x, canvas.height - 20);
                    }
                }
            }
        };
        
        /**
         * Draw target zones on the graph
         */
        const drawTargetZones = () => {
            const timeRange = graphData.timeRange;
            const timeWindow = timeRange.end - timeRange.start;
            
            // Draw target lines and zones
            if (graphData.targets && graphData.targets.length > 0) {
                graphData.targets.forEach(target => {
                    // Skip transition targets
                    if (target.isTransition || target.value === null) {
                        return;
                    }
                    
                    // Calculate x position
                    const x = canvas.width - ((timeRange.end - target.time) / timeWindow) * canvas.width;
                    
                    // Draw target line
                    ctx.beginPath();
                    ctx.strokeStyle = settings.targetLineColor;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 3]); // Dashed line
                    
                    const y = canvas.height - (target.value / 100) * canvas.height;
                    ctx.moveTo(x, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                    ctx.setLineDash([]); // Reset to solid line
                    
                    // Draw target zone (±precision range)
                    const precisionRange = Config ? Config.precision_range : 5;
                    const upperY = canvas.height - ((target.value + precisionRange) / 100) * canvas.height;
                    const lowerY = canvas.height - ((target.value - precisionRange) / 100) * canvas.height;
                    
                    ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
                    ctx.fillRect(x, upperY, canvas.width - x, lowerY - upperY);
                    
                    // Add target label
                    ctx.font = 'bold 12px Arial';
                    ctx.fillStyle = settings.targetLineColor;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${target.value}%`, x - 5, y);
                });
            }
        };
        
        /**
         * Draw the input line
         */
        const drawInputLine = () => {
            const points = graphData.points;
            const timeRange = graphData.timeRange;
            const timeWindow = timeRange.end - timeRange.start;
            
            if (points.length < 2) {
                return;
            }
            
            // Draw the input line
            ctx.beginPath();
            ctx.strokeStyle = settings.inputLineColor;
            ctx.lineWidth = 3;
            
            let started = false;
            points.forEach((point, index) => {
                // Calculate position
                const x = canvas.width - ((timeRange.end - point.x) / timeWindow) * canvas.width;
                const y = canvas.height - (point.y / 100) * canvas.height;
                
                // Start or continue the line
                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw in-range sections with background color
            let inRangeStart = null;
            
            points.forEach((point, index) => {
                const x = canvas.width - ((timeRange.end - point.x) / timeWindow) * canvas.width;
                const y = canvas.height - (point.y / 100) * canvas.height;
                
                if (point.isInTarget) {
                    // Start a new in-range section if needed
                    if (inRangeStart === null) {
                        inRangeStart = { x, y };
                    }
                } else if (inRangeStart !== null) {
                    // End and draw the current in-range section
                    ctx.fillStyle = settings.inRangeColor;
                    ctx.fillRect(inRangeStart.x, 0, x - inRangeStart.x, canvas.height);
                    inRangeStart = null;
                }
                
                // Draw transition zones
                if (point.isTransition && index > 0) {
                    const prevX = canvas.width - ((timeRange.end - points[index - 1].x) / timeWindow) * canvas.width;
                    ctx.fillStyle = settings.transitionColor;
                    ctx.fillRect(prevX, 0, x - prevX, canvas.height);
                }
            });
            
            // Draw the final in-range section if it extends to the end
            if (inRangeStart !== null) {
                const lastPoint = points[points.length - 1];
                const lastX = canvas.width - ((timeRange.end - lastPoint.x) / timeWindow) * canvas.width;
                
                ctx.fillStyle = settings.inRangeColor;
                ctx.fillRect(inRangeStart.x, 0, lastX - inRangeStart.x, canvas.height);
            }
        };
        
        // Add to document if not using an existing container
        if (!settings.containerId) {
            document.body.appendChild(container);
        }
        
        // Return component API
        return {
            element: container,
            canvas: canvas,
            
            /**
             * Set the graph data
             * @param {Object} data - Graph data (points, targets, timeRange)
             */
            setData(data) {
                graphData = data;
                drawGraph();
            },
            
            /**
             * Resize the graph
             * @param {number} width - New width
             * @param {number} height - New height
             */
            resize(width, height) {
                canvas.width = width;
                canvas.height = height;
                container.style.width = `${width}px`;
                container.style.height = `${height}px`;
                drawGraph();
            },
            
            /**
             * Set the time window
             * @param {number} timeWindow - Time window in milliseconds
             */
            setTimeWindow(timeWindow) {
                settings.timeWindow = timeWindow;
                drawGraph();
            },
            
            /**
             * Clear the graph
             */
            clear() {
                graphData = {
                    points: [],
                    targets: [],
                    timeRange: { start: 0, end: 0 }
                };
                drawGraph();
            }
        };
    },
    
    /**
     * Create a timer display component
     * @param {Object} options - Configuration options for the timer
     * @returns {Object} Timer component
     */
    createTimer(options = {}) {
        // Default options
        const defaults = {
            containerId: null,          // ID of container element
            size: 'medium',             // 'small', 'medium', or 'large'
            color: '#000',              // Text color
            format: 'MM:SS.mmm',        // Format ('MM:SS.mmm', 'MM:SS', 'SS.mmm')
            autoStart: false            // Whether to start immediately
        };
        
        // Merge defaults with provided options
        const settings = { ...defaults, ...options };
        
        // Create or get the container element
        let container;
        if (settings.containerId) {
            container = document.getElementById(settings.containerId);
            if (!container) {
                console.error(`Container element with ID "${settings.containerId}" not found`);
                return null;
            }
        } else {
            container = document.createElement('div');
            container.className = 'timer-container';
        }
        
        // Determine font size based on size setting
        let fontSize;
        switch (settings.size) {
            case 'small':
                fontSize = '1rem';
                break;
            case 'medium':
                fontSize = '1.5rem';
                break;
            case 'large':
                fontSize = '2rem';
                break;
            default:
                fontSize = '1.5rem';
        }
        
        // Create the timer display element
        const displayElement = document.createElement('div');
        displayElement.className = 'timer-display';
        displayElement.style.fontSize = fontSize;
        displayElement.style.fontWeight = 'bold';
        displayElement.style.color = settings.color;
        displayElement.style.fontFamily = 'monospace';
        
        // Timer state
        let startTime = 0;
        let running = false;
        let elapsed = 0;
        let animationFrameId = null;
        
        /**
         * Format time in milliseconds according to the specified format
         * @param {number} timeMs - Time in milliseconds
         * @returns {string} Formatted time string
         */
        const formatTime = (timeMs) => {
            const totalMs = timeMs;
            const ms = Math.floor(totalMs % 1000);
            const totalSeconds = Math.floor(totalMs / 1000);
            const seconds = totalSeconds % 60;
            const minutes = Math.floor(totalSeconds / 60);
            
            switch (settings.format) {
                case 'MM:SS.mmm':
                    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
                case 'MM:SS':
                    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                case 'SS.mmm':
                    return `${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
                default:
                    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
            }
        };
        
        /**
         * Update the timer display
         */
        const updateDisplay = () => {
            const currentTime = running ? Date.now() - startTime + elapsed : elapsed;
            displayElement.textContent = formatTime(currentTime);
            
            if (running) {
                animationFrameId = requestAnimationFrame(updateDisplay);
            }
        };
        
        // Set initial display
        displayElement.textContent = formatTime(0);
        
        // Add to container if not already there
        if (!settings.containerId) {
            container.appendChild(displayElement);
        }
        
        // Start timer if autoStart is true
        if (settings.autoStart) {
            startTime = Date.now();
            running = true;
            updateDisplay();
        }
        
        // Return component API
        return {
            element: displayElement,
            
            /**
             * Start the timer
             * @param {boolean} reset - Whether to reset elapsed time before starting
             */
            start(reset = false) {
                if (reset) {
                    elapsed = 0;
                }
                
                if (!running) {
                    startTime = Date.now();
                    running = true;
                    updateDisplay();
                }
            },
            
            /**
             * Stop the timer
             */
            stop() {
                if (running) {
                    elapsed += Date.now() - startTime;
                    running = false;
                    
                    if (animationFrameId !== null) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                }
            },
            
            /**
             * Reset the timer
             * @param {boolean} restart - Whether to restart the timer after resetting
             */
            reset(restart = false) {
                this.stop();
                elapsed = 0;
                updateDisplay();
                
                if (restart) {
                    this.start();
                }
            },
            
            /**
             * Set the timer to a specific value
             * @param {number} timeMs - Time in milliseconds
             */
            setTime(timeMs) {
                this.stop();
                elapsed = timeMs;
                updateDisplay();
            },
            
            /**
             * Get the current time
             * @returns {number} Current time in milliseconds
             */
            getTime() {
                return running ? Date.now() - startTime + elapsed : elapsed;
            },
            
            /**
             * Check if timer is running
             * @returns {boolean} Whether the timer is running
             */
            isRunning() {
                return running;
            },
            
            /**
             * Set the text color
             * @param {string} color - CSS color value
             */
            setColor(color) {
                displayElement.style.color = color;
            },
            
            /**
             * Set the time format
             * @param {string} format - Format string ('MM:SS.mmm', 'MM:SS', 'SS.mmm')
             */
            setFormat(format) {
                settings.format = format;
                updateDisplay();
            }
        };
    }
};

// Make Components available globally
window.Components = Components;