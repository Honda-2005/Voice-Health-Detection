// results.js - Results display and visualization for Voice Health System

/**
 * ============================================================================
 * RESULTS MODULE
 * ============================================================================
 */

// Configuration
const RESULTS_CONFIG = {
    apiBaseUrl: 'http://localhost:8000/api',
    demoMode: true,
    chartColors: {
        primary: '#4361ee',
        success: '#4cc9f0',
        warning: '#f8961e',
        danger: '#f72585',
        info: '#7209b7',
        normal: '#4cc9f0',
        attention: '#f8961e',
        alert: '#f72585'
    }
};

// Global state
const resultsState = {
    currentResults: null,
    patternChart: null,
    trendChart: null,
    healthScore: 85,
    audioElement: null,
    isPlaying: false
};

/**
 * ============================================================================
 * INITIALIZATION
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Results Page Initialized');
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load results data
    loadResultsData();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load user data
    loadUserData();
    
    // Initialize charts
    initializeCharts();
});

/**
 * ============================================================================
 * INITIALIZATION FUNCTIONS
 * ============================================================================
 */

function initializeEventListeners() {
    // Navigation
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Share button
    document.getElementById('shareResultsBtn')?.addEventListener('click', showShareModal);
    
    // Toggle details
    document.getElementById('toggleDetails')?.addEventListener('click', toggleDetailedAnalysis);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });
    
    // Audio preview
    document.getElementById('previewPlayBtn')?.addEventListener('click', toggleAudioPreview);
    
    // Export buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', handleExport);
    });
    
    // Modal close
    document.querySelector('.modal-close')?.addEventListener('click', closeShareModal);
    document.querySelector('.modal-overlay')?.addEventListener('click', closeShareModal);
    
    // Share modal buttons
    document.querySelectorAll('.share-option .btn').forEach(btn => {
        btn.addEventListener('click', handleShareOption);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function loadUserData() {
    const user = window.Auth.getUser();
    if (user) {
        document.getElementById('userName').textContent = user.name || 'User';
        document.getElementById('userEmail').textContent = user.email || 'user@example.com';
        
        // Update avatar
        const avatar = document.getElementById('userAvatar');
        if (avatar && user.name) {
            const initials = getInitials(user.name);
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4361ee&color=fff&size=100`;
        }
    }
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

async function loadResultsData() {
    try {
        // Get results ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('id') || 'demo_result';
        
        let results;
        
        if (RESULTS_CONFIG.demoMode) {
            results = await getDemoResults(resultId);
        } else {
            results = await getRealResults(resultId);
        }
        
        resultsState.currentResults = results;
        displayResults(results);
        
        // Update analysis timestamp
        updateAnalysisTimestamp(results.timestamp);
        
        // Update health score in sidebar
        updateHealthScore(results.healthScore || 85);
        
    } catch (error) {
        console.error('Error loading results:', error);
        showToast('Failed to load analysis results', 'error');
        
        // Load demo data as fallback
        const results = await getDemoResults('demo_fallback');
        resultsState.currentResults = results;
        displayResults(results);
    }
}

function updateAnalysisTimestamp(timestamp) {
    const element = document.getElementById('analysisTimestamp');
    if (!element) return;
    
    if (!timestamp) {
        element.textContent = 'Analyzed just now';
        return;
    }
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        element.textContent = 'Analyzed just now';
    } else if (diffMins < 60) {
        element.textContent = `Analyzed ${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
        element.textContent = `Analyzed ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
        element.textContent = `Analyzed ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
}

function updateHealthScore(score) {
    resultsState.healthScore = score;
    
    // Update score in sidebar
    const scoreElement = document.getElementById('healthScore');
    const circleFill = document.querySelector('.circle-fill');
    
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    if (circleFill) {
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (score / 100) * circumference;
        circleFill.style.strokeDashoffset = offset;
        
        // Update color based on score
        if (score >= 80) {
            circleFill.style.stroke = RESULTS_CONFIG.chartColors.success;
        } else if (score >= 60) {
            circleFill.style.stroke = RESULTS_CONFIG.chartColors.warning;
        } else {
            circleFill.style.stroke = RESULTS_CONFIG.chartColors.danger;
        }
    }
}

/**
 * ============================================================================
 * RESULTS DISPLAY FUNCTIONS
 * ============================================================================
 */

function displayResults(results) {
    // Overall result
    updateOverallResult(results.overallResult);
    
    // Confidence score
    updateConfidenceScore(results.confidence);
    
    // Severity level
    updateSeverityLevel(results.severity);
    
    // Key metrics
    updateKeyMetrics(results.metrics);
    
    // Recording info
    updateRecordingInfo(results.recordingInfo);
    
    // Update charts with new data
    updateCharts(results);
}

function updateOverallResult(result) {
    const iconElement = document.getElementById('resultIcon');
    const statusElement = document.getElementById('overallStatus');
    const descriptionElement = document.getElementById('resultDescription');
    
    if (!result) return;
    
    // Update icon and color
    if (iconElement) {
        iconElement.className = 'result-icon';
        
        if (result.status === 'normal') {
            iconElement.classList.add('normal');
            iconElement.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else if (result.status === 'warning') {
            iconElement.classList.add('warning');
            iconElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        } else {
            iconElement.classList.add('alert');
            iconElement.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        }
    }
    
    // Update status text
    if (statusElement) {
        statusElement.textContent = result.label || 'Analysis Complete';
        statusElement.style.color = getStatusColor(result.status);
    }
    
    // Update description
    if (descriptionElement) {
        descriptionElement.textContent = result.description || 'Voice analysis completed successfully.';
    }
}

function updateConfidenceScore(confidence) {
    const element = document.getElementById('confidenceScore');
    if (element && confidence !== undefined) {
        element.textContent = `${confidence}%`;
        
        // Update color based on confidence
        if (confidence >= 90) {
            element.style.color = RESULTS_CONFIG.chartColors.success;
        } else if (confidence >= 75) {
            element.style.color = RESULTS_CONFIG.chartColors.warning;
        } else {
            element.style.color = RESULTS_CONFIG.chartColors.danger;
        }
    }
}

function updateSeverityLevel(severity) {
    const fillElement = document.getElementById('severityFill');
    const textElement = document.getElementById('severityText');
    
    if (!severity) return;
    
    const levels = {
        low: { width: '25%', color: RESULTS_CONFIG.chartColors.success, text: 'Low' },
        medium: { width: '50%', color: RESULTS_CONFIG.chartColors.warning, text: 'Medium' },
        high: { width: '75%', color: RESULTS_CONFIG.chartColors.danger, text: 'High' }
    };
    
    const level = levels[severity.toLowerCase()] || levels.low;
    
    if (fillElement) {
        fillElement.style.width = level.width;
        fillElement.style.background = level.color;
        fillElement.className = 'severity-fill ' + severity.toLowerCase();
    }
    
    if (textElement) {
        textElement.textContent = level.text;
        textElement.style.color = level.color;
        textElement.className = 'severity-text ' + severity.toLowerCase();
    }
}

function updateKeyMetrics(metrics) {
    if (!metrics) return;
    
    // Update each metric card
    const metricIds = ['pitchStability', 'voiceClarity', 'breathControl', 'consistency'];
    
    metricIds.forEach(id => {
        const element = document.getElementById(id);
        if (element && metrics[id] !== undefined) {
            element.textContent = `${metrics[id].value}%`;
            
            // Update trend
            const trendElement = element.parentElement.querySelector('.metric-trend');
            if (trendElement && metrics[id].trend) {
                const trend = metrics[id].trend;
                const absTrend = Math.abs(trend);
                
                trendElement.innerHTML = `<i class="fas fa-${trend > 0 ? 'arrow-up' : trend < 0 ? 'arrow-down' : 'minus'}"></i> ${absTrend}%`;
                trendElement.className = `metric-trend ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'}`;
            }
        }
    });
}

function updateRecordingInfo(info) {
    if (!info) return;
    
    const elements = {
        recordingId: document.getElementById('recordingId'),
        recordingDateTime: document.getElementById('recordingDateTime'),
        recordingDuration: document.getElementById('recordingDuration'),
        recordingEnvironment: document.getElementById('recordingEnvironment')
    };
    
    // Update each element if data exists
    if (info.id && elements.recordingId) {
        elements.recordingId.textContent = info.id;
    }
    
    if (info.timestamp && elements.recordingDateTime) {
        const date = new Date(info.timestamp);
        elements.recordingDateTime.textContent = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' • ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    if (info.duration && elements.recordingDuration) {
        elements.recordingDuration.textContent = `${info.duration}s`;
    }
    
    if (info.environment && elements.recordingEnvironment) {
        elements.recordingEnvironment.textContent = info.environment;
    }
}

function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'normal': return RESULTS_CONFIG.chartColors.success;
        case 'warning': return RESULTS_CONFIG.chartColors.warning;
        case 'alert': return RESULTS_CONFIG.chartColors.danger;
        default: return RESULTS_CONFIG.chartColors.primary;
    }
}

/**
 * ============================================================================
 * CHART FUNCTIONS
 * ============================================================================
 */

function initializeCharts() {
    // Initialize pattern chart
    initializePatternChart();
    
    // Initialize trend chart
    initializeTrendChart();
}

function initializePatternChart() {
    const ctx = document.getElementById('patternChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (resultsState.patternChart) {
        resultsState.patternChart.destroy();
    }
    
    resultsState.patternChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Normal', 'Attention Needed', 'Alert'],
            datasets: [{
                data: [75, 20, 5],
                backgroundColor: [
                    RESULTS_CONFIG.chartColors.normal,
                    RESULTS_CONFIG.chartColors.attention,
                    RESULTS_CONFIG.chartColors.alert
                ],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            }
        }
    });
}

function initializeTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (resultsState.trendChart) {
        resultsState.trendChart.destroy();
    }
    
    // Generate demo data
    const labels = [];
    const scores = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Generate realistic score with some variation
        const baseScore = 80 + Math.sin(i / 7) * 10;
        const randomVariation = (Math.random() - 0.5) * 8;
        scores.push(Math.min(100, Math.max(0, Math.round(baseScore + randomVariation))));
    }
    
    resultsState.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Voice Health Score',
                data: scores,
                borderColor: RESULTS_CONFIG.chartColors.primary,
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
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
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Score: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8
                    }
                }
            }
        }
    });
}

function updateCharts(results) {
    if (!results || !results.charts) return;
    
    // Update pattern chart if data provided
    if (results.charts.pattern && resultsState.patternChart) {
        resultsState.patternChart.data.datasets[0].data = results.charts.pattern.data;
        resultsState.patternChart.update();
    }
    
    // Update trend chart if data provided
    if (results.charts.trend && resultsState.trendChart) {
        resultsState.trendChart.data.labels = results.charts.trend.labels;
        resultsState.trendChart.data.datasets[0].data = results.charts.trend.data;
        resultsState.trendChart.update();
    }
}

/**
 * ============================================================================
 * UI INTERACTION FUNCTIONS
 * ============================================================================
 */

function toggleDetailedAnalysis() {
    const detailsSection = document.getElementById('detailedAnalysis');
    const toggleBtn = document.getElementById('toggleDetails');
    
    if (!detailsSection || !toggleBtn) return;
    
    const isHidden = detailsSection.style.display === 'none';
    
    if (isHidden) {
        detailsSection.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Details';
        
        // Animate scroll to details
        setTimeout(() => {
            detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else {
        detailsSection.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show Details';
    }
}

function handleTabSwitch(event) {
    const tabBtn = event.currentTarget;
    const tabId = tabBtn.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    tabBtn.classList.add('active');
    
    // Show corresponding tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
        if (pane.dataset.tab === tabId) {
            pane.classList.add('active');
        }
    });
}

function toggleAudioPreview() {
    if (!resultsState.audioElement) {
        // Create demo audio element
        resultsState.audioElement = new Audio();
        // In production, this would be the actual recording URL
        
        // Set up event listeners
        resultsState.audioElement.addEventListener('ended', () => {
            resultsState.isPlaying = false;
            updatePlayButton();
        });
        
        resultsState.audioElement.addEventListener('timeupdate', updateAudioProgress);
    }
    
    const playBtn = document.getElementById('previewPlayBtn');
    
    if (resultsState.isPlaying) {
        resultsState.audioElement.pause();
        resultsState.isPlaying = false;
    } else {
        // For demo, just simulate playback
        resultsState.isPlaying = true;
        simulateAudioPlayback();
    }
    
    updatePlayButton();
}

function simulateAudioPlayback() {
    const progressFill = document.querySelector('.progress-fill-small');
    const audioTime = document.querySelector('.audio-time');
    
    if (!progressFill || !audioTime) return;
    
    let progress = 0;
    const totalDuration = 32; // seconds
    
    const interval = setInterval(() => {
        if (!resultsState.isPlaying) {
            clearInterval(interval);
            return;
        }
        
        progress += 1;
        const percentage = (progress / totalDuration) * 100;
        
        progressFill.style.width = `${percentage}%`;
        
        const currentSeconds = Math.floor(progress / 100 * totalDuration);
        const formattedTime = `0:${currentSeconds.toString().padStart(2, '0')}`;
        audioTime.textContent = formattedTime;
        
        if (percentage >= 100) {
            clearInterval(interval);
            resultsState.isPlaying = false;
            updatePlayButton();
        }
    }, 100); // Update every 100ms
}

function updatePlayButton() {
    const playBtn = document.getElementById('previewPlayBtn');
    if (!playBtn) return;
    
    const icon = playBtn.querySelector('i');
    if (icon) {
        icon.className = resultsState.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
}

function updateAudioProgress() {
    if (!resultsState.audioElement) return;
    
    const progressFill = document.querySelector('.progress-fill-small');
    const audioTime = document.querySelector('.audio-time');
    
    if (progressFill && resultsState.audioElement.duration) {
        const percentage = (resultsState.audioElement.currentTime / resultsState.audioElement.duration) * 100;
        progressFill.style.width = `${percentage}%`;
    }
    
    if (audioTime) {
        const currentTime = formatTime(resultsState.audioElement.currentTime);
        const totalTime = formatTime(resultsState.audioElement.duration || 32);
        audioTime.textContent = `${currentTime}/${totalTime}`;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleExport(event) {
    const format = event.currentTarget.dataset.format;
    
    switch(format) {
        case 'pdf':
            exportPDF();
            break;
        case 'csv':
            exportCSV();
            break;
        case 'share':
            showShareModal();
            break;
    }
}

function exportPDF() {
    showToast('Generating PDF report...', 'info');
    
    // Simulate PDF generation
    setTimeout(() => {
        showToast('PDF report downloaded successfully', 'success');
        
        // In production, this would trigger an actual download
        const link = document.createElement('a');
        link.href = '#';
        link.download = `voice-health-report-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
    }, 2000);
}

function exportCSV() {
    showToast('Exporting raw data...', 'info');
    
    // Simulate CSV export
    setTimeout(() => {
        showToast('CSV data exported successfully', 'success');
        
        // In production, this would generate actual CSV
        const csvContent = "Feature,Value,Unit\nMFCC1,0.123,au\nPitch,185,Hz\nEnergy,0.42,au\nJitter,0.45,%";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `voice-data-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    }, 1500);
}

/**
 * ============================================================================
 * SHARE MODAL FUNCTIONS
 * ============================================================================
 */

function showShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function handleShareOption(event) {
    event.stopPropagation();
    const option = event.currentTarget.closest('.share-option');
    
    if (!option) return;
    
    const optionType = option.querySelector('.share-icon').className.includes('email') ? 'email' :
                      option.querySelector('.share-icon').className.includes('doctor') ? 'doctor' : 'link';
    
    switch(optionType) {
        case 'email':
            shareViaEmail();
            break;
        case 'doctor':
            shareWithDoctor();
            break;
        case 'link':
            generateShareLink();
            break;
    }
}

function shareViaEmail() {
    showToast('Opening email composer...', 'info');
    
    // In production, this would open mailto: link with report attached
    const email = 'user@example.com';
    const subject = `Voice Health Report - ${new Date().toLocaleDateString()}`;
    const body = `Please find attached my voice health analysis report.\n\nGenerated on: ${new Date().toLocaleString()}`;
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    setTimeout(() => {
        window.open(mailtoLink, '_blank');
        closeShareModal();
    }, 500);
}

function shareWithDoctor() {
    showToast('Sharing with healthcare provider...', 'info');
    
    // Simulate sharing process
    setTimeout(() => {
        showToast('Results shared securely with your healthcare provider', 'success');
        closeShareModal();
    }, 1500);
}

function generateShareLink() {
    showToast('Generating secure share link...', 'info');
    
    // Simulate link generation
    setTimeout(() => {
        const shareLink = `https://voicehealth.example.com/share/${generateRandomId()}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareLink).then(() => {
            showToast('Share link copied to clipboard (expires in 7 days)', 'success');
            closeShareModal();
        }).catch(() => {
            showToast('Failed to copy link. Please try again.', 'error');
        });
    }, 1000);
}

function generateRandomId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

function handleLogout(e) {
    e.preventDefault();
    if (window.Auth && window.Auth.logout) {
        window.Auth.logout();
    } else {
        window.location.href = 'login.html';
    }
}

function handleKeyboardShortcuts(e) {
    // Close modal on Escape
    if (e.key === 'Escape') {
        closeShareModal();
    }
    
    // Space to play/pause audio preview
    if (e.key === ' ' && !e.target.matches('input, textarea, button')) {
        e.preventDefault();
        toggleAudioPreview();
    }
}

function showToast(message, type = 'info') {
    if (window.UI && window.UI.showToast) {
        window.UI.showToast(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * ============================================================================
 * DATA FETCHING FUNCTIONS
 * ============================================================================
 */

async function getDemoResults(resultId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate random results for demo
            const healthScore = Math.floor(Math.random() * 30) + 70;
            const confidence = Math.floor(Math.random() * 15) + 85;
            const severity = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
            const status = severity === 'low' ? 'normal' : severity === 'medium' ? 'warning' : 'alert';
            
            resolve({
                id: resultId,
                timestamp: new Date().toISOString(),
                overallResult: {
                    status: status,
                    label: getResultLabel(status),
                    description: getResultDescription(status)
                },
                confidence: confidence,
                severity: severity,
                healthScore: healthScore,
                metrics: {
                    pitchStability: { value: Math.floor(Math.random() * 20) + 80, trend: Math.floor(Math.random() * 6) - 2 },
                    voiceClarity: { value: Math.floor(Math.random() * 20) + 75, trend: Math.floor(Math.random() * 6) - 2 },
                    breathControl: { value: Math.floor(Math.random() * 25) + 70, trend: Math.floor(Math.random() * 6) - 2 },
                    consistency: { value: Math.floor(Math.random() * 20) + 80, trend: Math.floor(Math.random() * 6) - 2 }
                },
                recordingInfo: {
                    id: `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
                    timestamp: new Date().toISOString(),
                    duration: Math.floor(Math.random() * 20) + 20,
                    environment: ['Quiet room', 'Office', 'Home'][Math.floor(Math.random() * 3)]
                },
                charts: {
                    pattern: {
                        data: [75, 20, 5]
                    },
                    trend: {
                        labels: Array.from({ length: 30 }, (_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (29 - i));
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }),
                        data: Array.from({ length: 30 }, (_, i) => {
                            const baseScore = 75 + Math.sin(i / 7) * 15;
                            const randomVariation = (Math.random() - 0.5) * 10;
                            return Math.min(100, Math.max(0, Math.round(baseScore + randomVariation)));
                        })
                    }
                }
            });
        }, 1000);
    });
}

async function getRealResults(resultId) {
    try {
        const token = window.Auth.getToken();
        const response = await fetch(`${RESULTS_CONFIG.apiBaseUrl}/results/${resultId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch results');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

function getResultLabel(status) {
    switch(status) {
        case 'normal': return 'Normal Voice Patterns';
        case 'warning': return 'Attention Recommended';
        case 'alert': return 'Consultation Advised';
        default: return 'Analysis Complete';
    }
}

function getResultDescription(status) {
    switch(status) {
        case 'normal': return 'Your voice analysis shows patterns within normal ranges. No significant anomalies detected.';
        case 'warning': return 'Some voice patterns require attention. Consider implementing the recommendations below.';
        case 'alert': return 'Significant voice pattern deviations detected. Consult a healthcare professional for further evaluation.';
        default: return 'Voice analysis completed successfully.';
    }
}

/**
 * ============================================================================
 * CLEANUP
 * ============================================================================
 */

function cleanup() {
    // Stop audio playback
    if (resultsState.audioElement) {
        resultsState.audioElement.pause();
        resultsState.audioElement = null;
    }
    
    // Destroy charts
    if (resultsState.patternChart) {
        resultsState.patternChart.destroy();
    }
    
    if (resultsState.trendChart) {
        resultsState.trendChart.destroy();
    }
}

// Cleanup on page unload
window.addEventListener('unload', cleanup);

/**
 * ============================================================================
 * EXPORT RESULTS FUNCTIONS
 * ============================================================================
 */

window.Results = {
    loadResultsData,
    exportPDF,
    exportCSV,
    showShareModal,
    cleanup
};