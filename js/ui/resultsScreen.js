/**
 * resultsScreen.js
 * 
 * Manages the results screen interface for the Sim Racing Pedal Training application.
 * Displays performance statistics and historical data.
 */

const ResultsScreen = {
    // Canvas context for history chart
    historyChartCtx: null,
    
    // Reference elements
    finalTimeElement: null,
    avgReactionTimeElement: null,
    avgPrecisionElement: null,
    
    // Chart settings
    chartSettings: {
        width: 0,
        height: 0,
        barColor: 'rgba(52, 152, 219, 0.7)',
        barBorderColor: 'rgba(41, 128, 185, 1)',
        lineColor: 'rgba(46, 204, 113, 1)',
        gridColor: 'rgba(200, 200, 200, 0.2)',
        textColor: 'rgba(0, 0, 0, 0.7)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: 12,
        padding: 40,
        maxBars: 10  // Maximum number of historical results to show
    },
    
    /**
     * Initialize the results screen
     */
    initialize() {
        console.log("Initializing results screen");
        
        // Cache references to DOM elements
        this.finalTimeElement = document.getElementById('final-time');
        this.avgReactionTimeElement = document.getElementById('avg-reaction-time');
        this.avgPrecisionElement = document.getElementById('avg-precision');
        
        // Initialize history chart
        this.initializeHistoryChart();
        
        // Set up event listeners
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for the results screen
     */
    setupEventListeners() {
        // Restart game button
        const restartButton = document.getElementById('restart-game');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                // This is handled by gameState.js
                console.log("Restart game button clicked");
            });
        }
        
        // Return to menu button
        const returnButton = document.getElementById('return-to-menu');
        if (returnButton) {
            returnButton.addEventListener('click', () => {
                // This is handled by gameState.js
                console.log("Return to menu button clicked");
            });
        }
    },
    
    /**
     * Initialize the history chart canvas
     */
    initializeHistoryChart() {
        const canvas = document.getElementById('history-chart');
        if (!canvas) {
            console.error("History chart canvas not found");
            return;
        }
        
        // Get canvas context
        this.historyChartCtx = canvas.getContext('2d');
        
        // Set initial canvas size
        this.resizeHistoryChart();
    },
    
    /**
     * Resize the history chart canvas
     */
    resizeHistoryChart() {
        const canvas = document.getElementById('history-chart');
        if (!canvas || !this.historyChartCtx) {
            return;
        }
        
        // Get container dimensions
        const container = document.getElementById('history-chart-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set canvas size to match container
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // Update settings
        this.chartSettings.width = containerWidth;
        this.chartSettings.height = containerHeight;
        
        // Redraw chart if we have data
        if (App.state && App.state.sessionData.scores) {
            this.updateHistoryChart(App.state.sessionData);
        }
    },
    
    /**
     * Update the UI with session data
     * @param {Object} sessionData - The game session data
     */
    updateUI(sessionData) {
        console.log("Updating results screen UI with session data:", sessionData);
        
        // Skip if no scores available
        if (!sessionData || !sessionData.scores) {
            console.warn("No score data available for results screen");
            return;
        }
        
        const scores = sessionData.scores;
        
        // Update final time
        if (this.finalTimeElement) {
            this.finalTimeElement.textContent = Scoring.formatTime(scores.gameTime);
        }
        
        // Update average reaction time
        if (this.avgReactionTimeElement) {
            this.avgReactionTimeElement.textContent = Scoring.formatReactionTime(scores.avgReactionTime);
        }
        
        // Update average precision
        if (this.avgPrecisionElement) {
            this.avgPrecisionElement.textContent = Scoring.formatPrecision(scores.avgPrecision);
        }
        
        // Update history chart
        this.updateHistoryChart(sessionData);
    },
    
    /**
     * Update the history chart with current and historical data
     * @param {Object} sessionData - The current game session data
     */
    updateHistoryChart(sessionData) {
        // Skip if chart context not available
        if (!this.historyChartCtx) {
            return;
        }
        
        const ctx = this.historyChartCtx;
        const settings = this.chartSettings;
        const width = settings.width;
        const height = settings.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Get historical data
        let historicalData = [];
        if (typeof LocalData !== 'undefined' && LocalData.getHistoricalResults) {
            try {
                historicalData = LocalData.getHistoricalResults(sessionData.gameMode) || [];
            } catch (error) {
                console.warn("Error getting historical data:", error);
                historicalData = [];
            }
        }
        
        // Add current session to historical data, checking for undefined values
        const currentResult = {
            date: new Date(),
            gameTime: sessionData.scores && typeof sessionData.scores.gameTime === 'number' ? sessionData.scores.gameTime : 0,
            avgReactionTime: sessionData.scores && typeof sessionData.scores.avgReactionTime === 'number' ? sessionData.scores.avgReactionTime : 0,
            avgPrecision: sessionData.scores && typeof sessionData.scores.avgPrecision === 'number' ? sessionData.scores.avgPrecision : 0,
            isCurrent: true
        };
        
        // Combine and limit data to most recent N results
        const allData = [currentResult].concat(historicalData);
        const limitedData = allData.slice(0, settings.maxBars);
        
        // Skip drawing if no data
        if (limitedData.length === 0) {
            this.drawNoDataMessage();
            return;
        }
        
        // Draw chart based on what data we have
        this.drawHistoryChart(limitedData);
    },
    
    /**
     * Draw a message when no data is available
     */
    drawNoDataMessage() {
        const ctx = this.historyChartCtx;
        const settings = this.chartSettings;
        const width = settings.width;
        const height = settings.height;
        
        ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
        ctx.fillStyle = settings.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No historical data available', width / 2, height / 2);
    },
    
    /**
     * Draw the history chart
     * @param {Array} data - Array of historical session data
     */
    drawHistoryChart(data) {
        const ctx = this.historyChartCtx;
        const settings = this.chartSettings;
        const width = settings.width;
        const height = settings.height;
        const padding = settings.padding;
        
        // Calculate available drawing area
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Find min/max values for scaling
        const maxTime = Math.max(...data.map(d => d.gameTime), 10); // At least 10 seconds
        
        // Draw grid and axes
        this.drawChartGrid(chartWidth, chartHeight, padding, maxTime);
        
        // Draw bars
        this.drawChartBars(data, chartWidth, chartHeight, padding, maxTime);
        
        // Draw reaction time line
        this.drawReactionTimeLine(data, chartWidth, chartHeight, padding);
        
        // Draw title
        ctx.font = `bold ${settings.fontSize + 4}px ${settings.fontFamily}`;
        ctx.fillStyle = settings.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Performance History', width / 2, 10);
    },
    
    /**
     * Draw the chart grid and axes
     * @param {number} chartWidth - Width of the chart area
     * @param {number} chartHeight - Height of the chart area
     * @param {number} padding - Padding around the chart
     * @param {number} maxTime - Maximum time value for scaling
     */
    drawChartGrid(chartWidth, chartHeight, padding, maxTime) {
        const ctx = this.historyChartCtx;
        const settings = this.chartSettings;
        
        // Draw horizontal grid lines
        ctx.strokeStyle = settings.gridColor;
        ctx.lineWidth = 1;
        
        // Calculate time intervals for grid (seconds)
        const timeInterval = this.calculateTimeInterval(maxTime);
        
        for (let t = 0; t <= maxTime; t += timeInterval) {
            const y = padding + chartHeight - (t / maxTime) * chartHeight;
            
            // Draw grid line
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
            
            // Draw time label
            ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
            ctx.fillStyle = settings.textColor;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${t.toFixed(1)}s`, padding - 5, y);
        }
        
        // Draw axes
        ctx.beginPath();
        ctx.strokeStyle = settings.textColor;
        ctx.lineWidth = 2;
        
        // X-axis
        ctx.moveTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        
        // Y-axis
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        
        ctx.stroke();
        
        // Label for Y-axis
        ctx.save();
        ctx.translate(padding - 25, padding + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
        ctx.fillStyle = settings.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Time (seconds)', 0, 0);
        ctx.restore();
    },
    
    /**
     * Calculate appropriate time interval for grid lines
     * @param {number} maxTime - Maximum time value
     * @returns {number} Time interval in seconds
     */
    calculateTimeInterval(maxTime) {
        if (maxTime <= 5) return 1;
        if (maxTime <= 10) return 2;
        if (maxTime <= 30) return 5;
        if (maxTime <= 60) return 10;
        if (maxTime <= 120) return 20;
        return 30;
    },
    
    /**
     * Draw bars for each historical session
     * @param {Array} data - Array of historical session data
     * @param {number} chartWidth - Width of the chart area
     * @param {number} chartHeight - Height of the chart area
     * @param {number} padding - Padding around the chart
     * @param {number} maxTime - Maximum time value for scaling
     */
    drawChartBars(data, chartWidth, chartHeight, padding, maxTime) {
        const ctx = this.historyChartCtx;
        const settings = this.chartSettings;
        
        // Calculate bar width based on number of data points
        const barCount = data.length;
        const barWidth = Math.min(50, (chartWidth / barCount) * 0.8);
        const barSpacing = (chartWidth - barWidth * barCount) / (barCount + 1);
        
        // Draw each bar
        data.forEach((item, index) => {
            // Make sure gameTime has a value and use a default if it doesn't
            const gameTime = typeof item.gameTime === 'number' ? item.gameTime : 0;
            const barHeight = (gameTime / maxTime) * chartHeight;
            const x = padding + barSpacing + index * (barWidth + barSpacing);
            const y = padding + chartHeight - barHeight;
            
            // Draw bar
            ctx.fillStyle = item.isCurrent ? 'rgba(46, 204, 113, 0.7)' : settings.barColor;
            ctx.strokeStyle = item.isCurrent ? 'rgba(39, 174, 96, 1)' : settings.barBorderColor;
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.rect(x, y, barWidth, barHeight);
            ctx.fill();
            ctx.stroke();
            
            // Draw time value on top of bar
            ctx.font = `bold ${settings.fontSize}px ${settings.fontFamily}`;
            ctx.fillStyle = settings.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(gameTime.toFixed(1) + 's', x + barWidth / 2, y - 5);
            
            // Draw date label below x-axis
            const dateLabel = this.formatDateLabel(item.date);
            ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(dateLabel, x + barWidth / 2, padding + chartHeight + 5);
            
            // Mark current session
            if (item.isCurrent) {
                ctx.font = `italic ${settings.fontSize}px ${settings.fontFamily}`;
                ctx.fillText('Current', x + barWidth / 2, padding + chartHeight + 25);
            }
        });
    },
    
    /**
     * Draw the reaction time line
     * @param {Array} data - Array of historical session data
     * @param {number} chartWidth - Width of the chart area
     * @param {number} chartHeight - Height of the chart area
     * @param {number} padding - Padding around the chart
     */
    drawReactionTimeLine(data, chartWidth, chartHeight, padding) {
        const ctx = this.historyChartCtx;
        const settings = this.chartSettings;
        
        // Calculate bar width based on number of data points
        const barCount = data.length;
        const barWidth = Math.min(50, (chartWidth / barCount) * 0.8);
        const barSpacing = (chartWidth - barWidth * barCount) / (barCount + 1);
        
        // Find max reaction time for scaling, ensuring we filter out undefined values
        const reactionTimes = data.map(d => typeof d.avgReactionTime === 'number' ? d.avgReactionTime : 0);
        const maxReactionTime = Math.max(...reactionTimes, 1000) * 1.2;
        
        // Draw the line
        ctx.beginPath();
        ctx.strokeStyle = settings.lineColor;
        ctx.lineWidth = 2;
        
        data.forEach((item, index) => {
            // Make sure avgReactionTime has a value and use a default if it doesn't
            const reactionTime = typeof item.avgReactionTime === 'number' ? item.avgReactionTime : 0;
            const x = padding + barSpacing + index * (barWidth + barSpacing) + barWidth / 2;
            const y = padding + chartHeight - 
                      (chartHeight * 0.3) * (reactionTime / maxReactionTime);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw point
            ctx.fillStyle = settings.lineColor;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw reaction time value
            ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
            ctx.fillStyle = settings.lineColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${(reactionTime / 1000).toFixed(2)}s`, x, y - 10);
        });
        
        ctx.stroke();
        
        // Draw label for the line
        const lastPoint = data[data.length - 1];
        const lastX = padding + barSpacing + (data.length - 1) * (barWidth + barSpacing) + barWidth / 2;
        const lastY = padding + chartHeight - 
                    (chartHeight * 0.3) * (lastPoint.avgReactionTime / maxReactionTime);
        
        ctx.font = `italic ${settings.fontSize}px ${settings.fontFamily}`;
        ctx.fillStyle = settings.lineColor;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('Reaction Time', lastX + 50, lastY);
    },
    
    /**
     * Format a date for display in the chart
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDateLabel(date) {
        if (!date) return 'Unknown';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        // Check if date is today
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
        
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    },
    
    /**
     * Handle window resize event
     */
    handleResize() {
        // Resize the history chart
        this.resizeHistoryChart();
    }
};

// Make ResultsScreen available globally
window.ResultsScreen = ResultsScreen;