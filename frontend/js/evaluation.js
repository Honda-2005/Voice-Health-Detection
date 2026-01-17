// Evaluation Analytics Module
document.addEventListener('DOMContentLoaded', function() {
    const evaluationManager = new EvaluationManager();
    evaluationManager.init();
});

class EvaluationManager {
    constructor() {
        this.charts = {};
        this.currentTimeRange = '30d';
        this.userData = null;
    }

    async init() {
        // Load user data
        await this.loadUserData();
        
        // Initialize charts
        this.initCharts();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadEvaluationData();
    }

    async loadUserData() {
        // Simulate loading user data
        try {
            // In real implementation, fetch from API
            this.userData = {
                name: localStorage.getItem('userName') || 'John Doe',
                email: localStorage.getItem('userEmail') || 'john.doe@example.com',
                stats: {
                    totalRecordings: 24,
                    healthScore: 85,
                    consistency: 85,
                    accuracy: 92
                }
            };
            
            // Update UI
            document.getElementById('userName').textContent = this.userData.name;
            document.getElementById('userEmail').textContent = this.userData.email;
            
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    initCharts() {
        // Initialize all charts
        this.initTrendChart();
        this.initMiniCharts();
        this.initComparisonChart();
        this.initHealthScore();
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Jan 29', 'Feb 5', 'Feb 12'],
                datasets: [
                    {
                        label: 'Health Score',
                        data: [78, 80, 82, 83, 84, 85, 85],
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Voice Quality',
                        data: [75, 78, 82, 85, 86, 88, 88],
                        borderColor: '#4cc9f0',
                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Consistency',
                        data: [80, 82, 83, 84, 85, 85, 85],
                        borderColor: '#f8961e',
                        backgroundColor: 'rgba(248, 150, 30, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initMiniCharts() {
        // Pitch Variation Chart
        const pitchCtx = document.getElementById('pitchChart').getContext('2d');
        this.charts.pitch = this.createMiniChart(pitchCtx, [120, 125, 130, 135, 140, 142, 145], '#4361ee');
        
        // Energy Level Chart
        const energyCtx = document.getElementById('energyChart').getContext('2d');
        this.charts.energy = this.createMiniChart(energyCtx, [0.72, 0.74, 0.76, 0.77, 0.78, 0.78, 0.79], '#4cc9f0');
        
        // Zero Crossing Rate Chart
        const zcrCtx = document.getElementById('zcrChart').getContext('2d');
        this.charts.zcr = this.createMiniChart(zcrCtx, [0.10, 0.11, 0.12, 0.12, 0.12, 0.12, 0.12], '#f8961e');
        
        // Spectral Centroid Chart
        const spectralCtx = document.getElementById('spectralChart').getContext('2d');
        this.charts.spectral = this.createMiniChart(spectralCtx, [2.2, 2.3, 2.4, 2.4, 2.4, 2.4, 2.4], '#f72585');
    }

    createMiniChart(ctx, data, color) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['', '', '', '', '', '', ''],
                datasets: [{
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        });
    }

    initComparisonChart() {
        const ctx = document.getElementById('comparisonChart').getContext('2d');
        
        this.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Voice Quality', 'Consistency', 'Stability', 'Pitch Control', 'Energy Level'],
                datasets: [
                    {
                        label: 'Current',
                        data: [88, 85, 82, 90, 78],
                        backgroundColor: '#4361ee',
                        borderRadius: 6
                    },
                    {
                        label: 'Previous',
                        data: [85, 83, 80, 87, 76],
                        backgroundColor: '#4cc9f0',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initHealthScore() {
        const circle = document.querySelector('.circle-fill');
        const score = 85; // Health score from data
        
        // Calculate dash offset for circle progress
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        
        if (circle) {
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
            circle.style.transition = 'stroke-dashoffset 1s ease';
        }
    }

    setupEventListeners() {
        // Time range selector
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.currentTimeRange = e.target.value;
            this.loadEvaluationData();
        });
        
        // Comparison period selector
        document.getElementById('comparisonPeriod').addEventListener('change', (e) => {
            this.updateComparisonChart(e.target.value);
        });
        
        // Export report button
        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportReport();
        });
        
        // Generate insights button
        document.getElementById('generateInsightsBtn').addEventListener('click', () => {
            this.generateInsights();
        });
        
        // Refresh recommendations
        document.getElementById('refreshRecommendations').addEventListener('click', () => {
            this.refreshRecommendations();
        });
        
        // Toggle metrics view
        document.getElementById('toggleMetrics').addEventListener('click', (e) => {
            this.toggleMetricsView(e.target);
        });
    }

    async loadEvaluationData() {
        this.showLoading(true);
        
        try {
            // Simulate API call for evaluation data
            const evaluationData = await this.fetchEvaluationData(this.currentTimeRange);
            
            // Update charts with new data
            this.updateCharts(evaluationData);
            
            // Update UI elements
            this.updateEvaluationUI(evaluationData);
            
        } catch (error) {
            console.error('Failed to load evaluation data:', error);
            this.showToast('Failed to load evaluation data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async fetchEvaluationData(timeRange) {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                const data = {
                    healthScore: 85,
                    trendData: {
                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                        scores: [78, 80, 82, 85],
                        quality: [75, 78, 82, 88],
                        consistency: [80, 82, 83, 85]
                    },
                    metrics: {
                        pitch: 142,
                        energy: 0.78,
                        zcr: 0.12,
                        spectral: 2.4
                    },
                    comparison: {
                        current: [88, 85, 82, 90, 78],
                        previous: [85, 83, 80, 87, 76]
                    },
                    recommendations: [
                        {
                            title: 'Morning Vocal Warm-ups',
                            description: 'Based on detected morning variability',
                            impact: 8
                        },
                        {
                            title: 'Increase Hydration',
                            description: 'Voice quality improves with hydration',
                            impact: 5
                        },
                        {
                            title: 'Improve Sleep Quality',
                            description: 'Voice stability correlates with sleep',
                            impact: 12
                        }
                    ]
                };
                resolve(data);
            }, 1000);
        });
    }

    updateCharts(data) {
        // Update trend chart
        if (this.charts.trend && data.trendData) {
            this.charts.trend.data.labels = data.trendData.labels;
            this.charts.trend.data.datasets[0].data = data.trendData.scores;
            this.charts.trend.data.datasets[1].data = data.trendData.quality;
            this.charts.trend.data.datasets[2].data = data.trendData.consistency;
            this.charts.trend.update();
        }
        
        // Update mini charts
        if (data.metrics) {
            // These would update with new data points
            // For now, we'll simulate by adding new data points
            this.addDataPointToMiniCharts(data.metrics);
        }
        
        // Update comparison chart
        if (this.charts.comparison && data.comparison) {
            this.charts.comparison.data.datasets[0].data = data.comparison.current;
            this.charts.comparison.data.datasets[1].data = data.comparison.previous;
            this.charts.comparison.update();
        }
        
        // Update health score
        this.updateHealthScore(data.healthScore);
    }

    addDataPointToMiniCharts(metrics) {
        // Add new data point to each mini chart
        Object.keys(this.charts).forEach(chartName => {
            if (chartName !== 'trend' && chartName !== 'comparison' && this.charts[chartName]) {
                const chart = this.charts[chartName];
                if (chart.data.datasets[0].data.length > 10) {
                    chart.data.datasets[0].data.shift();
                }
                
                // Add new data point (simulate variation)
                const lastValue = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];
                const variation = (Math.random() - 0.5) * 2; // Random variation ±1
                const newValue = Math.max(0, lastValue + variation);
                
                chart.data.datasets[0].data.push(newValue);
                chart.update('none');
            }
        });
    }

    updateHealthScore(score) {
        const circle = document.querySelector('.circle-fill');
        const scoreValue = document.querySelector('.score-value');
        
        if (circle && scoreValue) {
            // Animate score update
            scoreValue.textContent = score;
            
            // Update circle progress
            const radius = 90;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        
        // Update breakdown values
        const breakdownValues = document.querySelectorAll('.breakdown-value');
        if (breakdownValues.length >= 4) {
            breakdownValues[0].textContent = `${score + 3}%`;
            breakdownValues[1].textContent = `${score}%`;
            breakdownValues[2].textContent = `${score - 3}%`;
            breakdownValues[3].textContent = `+${score - 73}%`;
            
            // Update breakdown bars
            const breakdownFills = document.querySelectorAll('.breakdown-fill');
            breakdownFills[0].style.width = `${score + 3}%`;
            breakdownFills[1].style.width = `${score}%`;
            breakdownFills[2].style.width = `${score - 3}%`;
            breakdownFills[3].style.width = `${score - 73}%`;
        }
    }

    updateEvaluationUI(data) {
        // Update stats cards
        const stats = document.querySelectorAll('.stat-card .stat-info h3');
        if (stats.length >= 4) {
            stats[0].textContent = this.userData.stats.totalRecordings;
            stats[1].textContent = `${this.userData.stats.accuracy}%`;
            stats[2].textContent = '18'; // Days tracked
            stats[3].textContent = `${this.userData.stats.consistency}%`;
        }
        
        // Update metric values
        document.getElementById('pitchChart').parentElement.previousElementSibling.previousElementSibling.textContent = `${data.metrics.pitch} Hz`;
        document.getElementById('energyChart').parentElement.previousElementSibling.previousElementSibling.textContent = `${data.metrics.energy} dB`;
        document.getElementById('zcrChart').parentElement.previousElementSibling.previousElementSibling.textContent = data.metrics.zcr;
        document.getElementById('spectralChart').parentElement.previousElementSibling.previousElementSibling.textContent = `${data.metrics.spectral} kHz`;
    }

    updateComparisonChart(period) {
        // Simulate different comparison data based on period
        const data = {
            week: {
                current: [90, 88, 85, 92, 80],
                previous: [88, 85, 83, 90, 78]
            },
            month: {
                current: [88, 85, 82, 90, 78],
                previous: [85, 83, 80, 87, 76]
            },
            quarter: {
                current: [85, 82, 80, 88, 76],
                previous: [80, 78, 75, 85, 72]
            }
        };
        
        if (this.charts.comparison && data[period]) {
            this.charts.comparison.data.datasets[0].data = data[period].current;
            this.charts.comparison.data.datasets[1].data = data[period].previous;
            this.charts.comparison.update();
            
            // Update comparison stats
            const avgCurrent = data[period].current.reduce((a, b) => a + b) / data[period].current.length;
            const avgPrevious = data[period].previous.reduce((a, b) => a + b) / data[period].previous.length;
            const improvement = ((avgCurrent - avgPrevious) / avgPrevious * 100).toFixed(1);
            
            const statValues = document.querySelectorAll('.comparison-stat .stat-value');
            if (statValues.length >= 3) {
                statValues[0].textContent = Math.round(avgCurrent);
                statValues[1].textContent = Math.round(avgPrevious);
                statValues[2].textContent = `+${improvement}%`;
                statValues[2].className = `stat-value ${improvement >= 0 ? 'positive' : 'negative'}`;
            }
        }
    }

    async exportReport() {
        this.showLoading(true);
        
        try {
            // Simulate report generation
            await this.generateReport();
            
            this.showToast('Report generated successfully!', 'success');
            
            // In real implementation, this would trigger a download
            setTimeout(() => {
                this.showToast('Download started automatically', 'info');
            }, 1000);
            
        } catch (error) {
            console.error('Failed to generate report:', error);
            this.showToast('Failed to generate report', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async generateReport() {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('PDF report generated');
                resolve();
            }, 2000);
        });
    }

    async generateInsights() {
        this.showLoading(true);
        
        try {
            // Simulate AI insight generation
            const insights = await this.fetchAIInsights();
            
            this.updateInsightsUI(insights);
            this.showToast('New insights generated!', 'success');
            
        } catch (error) {
            console.error('Failed to generate insights:', error);
            this.showToast('Failed to generate insights', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async fetchAIInsights() {
        return new Promise(resolve => {
            setTimeout(() => {
                const insights = {
                    assessment: "Your vocal patterns show excellent consistency this week. The AI detects improved stability during morning recordings compared to last week.",
                    areas: [
                        "Continue morning vocal exercises",
                        "Monitor weekend recording consistency",
                        "Consider evening recording sessions"
                    ],
                    confidence: 96
                };
                resolve(insights);
            }, 1500);
        });
    }

    updateInsightsUI(insights) {
        const insightContent = document.querySelector('.insight-content p');
        if (insightContent) {
            insightContent.textContent = insights.assessment;
        }
        
        const attentionList = document.querySelector('.attention-list');
        if (attentionList) {
            attentionList.innerHTML = insights.areas.map(area => 
                `<li><i class="fas fa-bullseye"></i> ${area}</li>`
            ).join('');
        }
        
        const confidenceBadge = document.querySelector('.confidence-badge');
        if (confidenceBadge) {
            confidenceBadge.innerHTML = `<i class="fas fa-shield-alt"></i> ${insights.confidence}% Confidence`;
        }
    }

    refreshRecommendations() {
        const recommendations = [
            {
                icon: 'primary',
                iconClass: 'fas fa-vocal-warmup',
                title: 'Breathing Exercises',
                description: 'Practice diaphragmatic breathing for 10 minutes daily',
                meta: '<span><i class="fas fa-clock"></i> 10 min daily</span><span><i class="fas fa-chart-line"></i> Expected: +6%</span>'
            },
            {
                icon: 'success',
                iconClass: 'fas fa-apple-alt',
                title: 'Diet Adjustment',
                description: 'Reduce dairy before recordings to decrease mucus',
                meta: '<span><i class="fas fa-check-circle"></i> Easy change</span><span><i class="fas fa-chart-line"></i> Expected: +4%</span>'
            },
            {
                icon: 'warning',
                iconClass: 'fas fa-headphones',
                title: 'Reduce Background Noise',
                description: 'Record in quieter environments for better analysis',
                meta: '<span><i class="fas fa-star"></i> High impact</span><span><i class="fas fa-chart-line"></i> Expected: +15%</span>'
            }
        ];
        
        const recommendationsList = document.querySelector('.recommendations-list');
        if (recommendationsList) {
            recommendationsList.innerHTML = recommendations.map(rec => `
                <div class="recommendation">
                    <div class="recommendation-icon ${rec.icon}">
                        <i class="${rec.iconClass}"></i>
                    </div>
                    <div class="recommendation-content">
                        <h4>${rec.title}</h4>
                        <p>${rec.description}</p>
                        <div class="recommendation-meta">
                            ${rec.meta}
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        this.showToast('Recommendations refreshed', 'success');
    }

    toggleMetricsView(button) {
        const metricsGrid = document.querySelector('.metrics-grid');
        const icon = button.querySelector('i');
        
        if (metricsGrid.classList.contains('expanded')) {
            metricsGrid.classList.remove('expanded');
            icon.className = 'fas fa-expand';
            button.innerHTML = '<i class="fas fa-expand"></i> Expand';
        } else {
            metricsGrid.classList.add('expanded');
            icon.className = 'fas fa-compress';
            button.innerHTML = '<i class="fas fa-compress"></i> Collapse';
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('global-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('active', show);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        const container = document.querySelector('.toast-container') || this.createToastContainer();
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
}