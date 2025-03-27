/**
 * scoring.js
 * 
 * Handles scoring and performance metrics for the pedal training game.
 * Calculates time, precision, and reaction time statistics.
 */

const Scoring = {
    /**
     * Calculate final scores for a completed game session
     * @param {Object} sessionData - The game session data
     * @returns {Object} Updated sessionData with calculated scores
     */
    calculateFinalScores(sessionData) {
        console.log("Calculating final scores");
        
        // Skip if there are no targets
        if (!sessionData.targets || sessionData.targets.length === 0) {
            console.warn("No target data available for scoring");
            return sessionData;
        }
        
        // Calculate total time (already set in gameTime)
        const totalTime = (sessionData.endTime - sessionData.startTime) / 1000; // Convert to seconds
        
        // Calculate reaction time metrics
        const reactionTimes = sessionData.targets.map(target => target.reactionTime);
        const avgReactionTime = this.calculateAverage(reactionTimes);
        const minReactionTime = Math.min(...reactionTimes);
        const maxReactionTime = Math.max(...reactionTimes);
        
        // Calculate precision metrics
        const accuracyValues = sessionData.targets.map(target => {
            // If accuracy hasn't been calculated, use telemetry data
            if (target.accuracy === 0 && App.telemetry) {
                // Find the time window for this target
                const startTime = target.targetStartTime || 0;
                const endTime = startTime + target.completionTime || 0;
                
                // Calculate accuracy from telemetry data
                const accuracy = App.telemetry.calculateAccuracy(
                    target.targetValue,
                    startTime,
                    endTime
                );
                
                // Return the average deviation (lower is better)
                return accuracy.averageDeviation || 0;
            }
            
            return target.accuracy || 0;
        });
        
        const avgPrecision = this.calculateAverage(accuracyValues);
        
        // Calculate consistency metrics
        const consistencyScore = this.calculateConsistency(reactionTimes, accuracyValues);
        
        // Calculate overall score (formula can be adjusted based on priorities)
        const overallScore = this.calculateOverallScore(
            totalTime,
            avgReactionTime,
            avgPrecision,
            consistencyScore,
            sessionData.targets.length
        );
        
        // Update the session data with calculated scores
        sessionData.scores = {
            totalTime: totalTime,
            gameTime: totalTime - this.calculateTotalTransitionTime(sessionData),
            avgReactionTime: avgReactionTime,
            minReactionTime: minReactionTime,
            maxReactionTime: maxReactionTime,
            avgPrecision: avgPrecision,
            consistencyScore: consistencyScore,
            overallScore: overallScore
        };
        
        console.log("Final scores calculated:", sessionData.scores);
        
        return sessionData;
    },
    
    /**
     * Calculate the average of an array of numbers
     * @param {Array<number>} values - Array of numeric values
     * @returns {number} The average value
     */
    calculateAverage(values) {
        if (!values || values.length === 0) {
            return 0;
        }
        
        const sum = values.reduce((total, val) => total + val, 0);
        return sum / values.length;
    },
    
    /**
     * Calculate the standard deviation of an array of numbers
     * @param {Array<number>} values - Array of numeric values
     * @param {number} mean - The mean value (optional, will be calculated if not provided)
     * @returns {number} The standard deviation
     */
    calculateStandardDeviation(values, mean = null) {
        if (!values || values.length === 0) {
            return 0;
        }
        
        // Calculate mean if not provided
        if (mean === null) {
            mean = this.calculateAverage(values);
        }
        
        // Calculate sum of squared differences
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const sumSquaredDiffs = squaredDiffs.reduce((total, val) => total + val, 0);
        
        // Calculate variance and standard deviation
        const variance = sumSquaredDiffs / values.length;
        return Math.sqrt(variance);
    },
    
    /**
     * Calculate a consistency score based on reaction time and precision
     * Lower values indicate more consistent performance
     * @param {Array<number>} reactionTimes - Array of reaction times
     * @param {Array<number>} precisionValues - Array of precision values
     * @returns {number} Consistency score (0-100, higher is better)
     */
    calculateConsistency(reactionTimes, precisionValues) {
        // Calculate coefficient of variation for reaction times
        const rtMean = this.calculateAverage(reactionTimes);
        const rtStdDev = this.calculateStandardDeviation(reactionTimes, rtMean);
        const rtCV = rtMean !== 0 ? (rtStdDev / rtMean) : 0;
        
        // Calculate coefficient of variation for precision
        const precMean = this.calculateAverage(precisionValues);
        const precStdDev = this.calculateStandardDeviation(precisionValues, precMean);
        const precCV = precMean !== 0 ? (precStdDev / precMean) : 0;
        
        // Combine the two metrics (lower CV means higher consistency)
        const combinedCV = (rtCV + precCV) / 2;
        
        // Convert to a 0-100 scale where 100 is perfect consistency
        // Using an exponential function to make the scale more intuitive
        const consistencyScore = Math.max(0, Math.min(100, 100 * Math.exp(-5 * combinedCV)));
        
        return Math.round(consistencyScore);
    },
    
    /**
     * Calculate the overall score based on various metrics
     * @param {number} totalTime - Total time taken
     * @param {number} avgReactionTime - Average reaction time
     * @param {number} avgPrecision - Average precision (lower is better)
     * @param {number} consistencyScore - Consistency score (higher is better)
     * @param {number} numTargets - Number of targets completed
     * @returns {number} Overall score
     */
    calculateOverallScore(totalTime, avgReactionTime, avgPrecision, consistencyScore, numTargets) {
        // Normalize time per target (lower is better)
        const timePerTarget = totalTime / numTargets;
        const timeScore = Math.max(0, 100 - (timePerTarget * 10)); // 10 seconds per target = 0 points
        
        // Normalize reaction time (lower is better)
        const reactionScore = Math.max(0, 100 - (avgReactionTime * 100)); // 1 second reaction = 0 points
        
        // Normalize precision (lower deviation is better)
        const precisionScore = Math.max(0, 100 - (avgPrecision * 2)); // 50% average deviation = 0 points
        
        // Calculate weighted overall score
        const weightTime = 0.4;
        const weightReaction = 0.3;
        const weightPrecision = 0.2;
        const weightConsistency = 0.1;
        
        const overallScore = 
            timeScore * weightTime +
            reactionScore * weightReaction +
            precisionScore * weightPrecision +
            consistencyScore * weightConsistency;
        
        return Math.round(overallScore);
    },
    
    /**
     * Calculate the total time spent in transitions
     * @param {Object} sessionData - The game session data
     * @returns {number} Total transition time in seconds
     */
    calculateTotalTransitionTime(sessionData) {
        // In a real implementation, we would track transition times precisely
        // For this simplified version, we'll estimate based on the number of targets
        const transitionDelay = Config.transition_delay || 1.0;
        const numTransitions = sessionData.targets.length;
        
        return numTransitions * transitionDelay;
    },
    
    /**
     * Format a time value in seconds to a string (MM:SS.mmm)
     * @param {number} timeInSeconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(timeInSeconds) {
        if (isNaN(timeInSeconds)) {
            return "00:00.000";
        }
        
        const totalMs = timeInSeconds * 1000;
        const ms = Math.floor(totalMs % 1000);
        const totalSeconds = Math.floor(totalMs / 1000);
        const seconds = totalSeconds % 60;
        const minutes = Math.floor(totalSeconds / 60);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    },
    
    /**
     * Format a reaction time value in milliseconds to a string
     * @param {number} reactionTimeMs - Reaction time in milliseconds
     * @returns {string} Formatted reaction time string
     */
    formatReactionTime(reactionTimeMs) {
        if (isNaN(reactionTimeMs)) {
            return "0.000s";
        }
        
        const reactionTimeSec = reactionTimeMs / 1000;
        return `${reactionTimeSec.toFixed(3)}s`;
    },
    
    /**
     * Format a precision value to a string
     * @param {number} precision - Precision value
     * @returns {string} Formatted precision string
     */
    formatPrecision(precision) {
        if (isNaN(precision)) {
            return "0.0%";
        }
        
        return `${precision.toFixed(1)}%`;
    },
    
    /**
     * Generate a performance summary text
     * @param {Object} scores - The calculated scores
     * @returns {string} A summary of the performance
     */
    generatePerformanceSummary(scores) {
        if (!scores) {
            return "No performance data available.";
        }
        
        let summary = "";
        
        // Evaluate time performance
        if (scores.gameTime < 5) {
            summary += "Excellent speed! ";
        } else if (scores.gameTime < 10) {
            summary += "Good speed. ";
        } else {
            summary += "Focus on improving your speed. ";
        }
        
        // Evaluate reaction time
        if (scores.avgReactionTime < 300) {
            summary += "Your reactions are extremely fast. ";
        } else if (scores.avgReactionTime < 500) {
            summary += "Good reaction times. ";
        } else {
            summary += "Work on improving reaction time. ";
        }
        
        // Evaluate precision
        if (scores.avgPrecision < 2) {
            summary += "Your precision is excellent. ";
        } else if (scores.avgPrecision < 5) {
            summary += "Good precision control. ";
        } else {
            summary += "Focus on improving precision. ";
        }
        
        // Evaluate consistency
        if (scores.consistencyScore > 80) {
            summary += "Very consistent performance.";
        } else if (scores.consistencyScore > 60) {
            summary += "Reasonably consistent performance.";
        } else {
            summary += "Work on maintaining consistent inputs.";
        }
        
        return summary;
    },
    
    /**
     * Compare scores with previous best performances
     * @param {Object} currentScores - The current session scores
     * @param {Array} historicalScores - Array of previous session scores
     * @returns {Object} Comparison results
     */
    compareWithHistory(currentScores, historicalScores) {
        if (!historicalScores || historicalScores.length === 0) {
            return {
                isPersonalBest: true,
                improvements: {
                    time: 0,
                    reactionTime: 0,
                    precision: 0,
                    consistency: 0
                },
                percentiles: {
                    time: 100,
                    reactionTime: 100,
                    precision: 100,
                    consistency: 100
                }
            };
        }
        
        // Find personal bests for each metric
        const bestTime = Math.min(...historicalScores.map(s => s.gameTime || Infinity));
        const bestReactionTime = Math.min(...historicalScores.map(s => s.avgReactionTime || Infinity));
        const bestPrecision = Math.min(...historicalScores.map(s => s.avgPrecision || Infinity));
        const bestConsistency = Math.max(...historicalScores.map(s => s.consistencyScore || 0));
        
        // Calculate improvements (negative values mean worse performance)
        const improvements = {
            time: bestTime - currentScores.gameTime,
            reactionTime: bestReactionTime - currentScores.avgReactionTime,
            precision: bestPrecision - currentScores.avgPrecision,
            consistency: currentScores.consistencyScore - bestConsistency
        };
        
        // Check if this is a personal best overall
        const previousBestOverall = Math.max(...historicalScores.map(s => s.overallScore || 0));
        const isPersonalBest = currentScores.overallScore > previousBestOverall;
        
        // Calculate percentiles
        const percentiles = {
            time: this.calculatePercentile(currentScores.gameTime, historicalScores.map(s => s.gameTime), true),
            reactionTime: this.calculatePercentile(currentScores.avgReactionTime, historicalScores.map(s => s.avgReactionTime), true),
            precision: this.calculatePercentile(currentScores.avgPrecision, historicalScores.map(s => s.avgPrecision), true),
            consistency: this.calculatePercentile(currentScores.consistencyScore, historicalScores.map(s => s.consistencyScore), false)
        };
        
        return {
            isPersonalBest,
            improvements,
            percentiles
        };
    },
    
    /**
     * Calculate the percentile of a value within a set
     * @param {number} value - The value to calculate percentile for
     * @param {Array<number>} values - Array of values to compare against
     * @param {boolean} lowerIsBetter - Whether lower values are better
     * @returns {number} The percentile (0-100)
     */
    calculatePercentile(value, values, lowerIsBetter = true) {
        // Filter out undefined/null values
        const filteredValues = values.filter(v => v !== undefined && v !== null);
        
        if (filteredValues.length === 0) {
            return 100; // No comparison data
        }
        
        // Count how many values are worse than the current value
        let count = 0;
        for (const v of filteredValues) {
            if ((lowerIsBetter && v >= value) || (!lowerIsBetter && v <= value)) {
                count++;
            }
        }
        
        // Calculate percentile
        return Math.round((count / filteredValues.length) * 100);
    }
};

// Make Scoring available globally
window.Scoring = Scoring;