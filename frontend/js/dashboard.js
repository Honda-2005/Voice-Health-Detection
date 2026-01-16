// dashboard.js - Dashboard functionality for Voice Health System

/**
 * ============================================================================
 * DASHBOARD MODULE
 * ============================================================================
 */

// Configuration
const DASHBOARD_CONFIG = {
    apiBaseUrl: 'http://localhost:8000/api', // Backend API URL
    demoMode: true, // Set to false for production
    updateInterval: 30000, // Update data every 30 seconds
    chartColors: {
        primary: '#4361ee',
        success: '#4cc9f0',
        warning: '#f8961e',
        danger: '#f72585',
        info: '#7209b7'
    }
};

/**
 * ============================================================================
 * INITIALIZATION
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard Initialized');
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize dashboard components
    initializeDashboard();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Start periodic updates
    startPeriodicUpdates();
});

/**
 * ============================================================================
 * DASHBOARD INITIALIZATION
 * ============================================================================
 */

function initializeDashboard() {
    // Load user data
    loadUserData();
    
    // Load dashboard statistics
    loadDashboardStats();
    
    // Load recent recordings
    loadRecentRecordings();
    
    // Load health status
    loadHealthStatus();
    
    // Initialize trend chart
    initializeTrendChart();
    
    // Update date and time
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    
    // Load health tips
    loadHealthTip();
    
    // Load announcements
    loadAnnouncements();
}

function initializeEventListeners() {
    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Trend filter
    const trendFilter = document.getElementById('trendFilter');
    if (trendFilter) {
        trendFilter.addEventListener('change', updateTrendChart);
    }
    
    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.querySelector('span').textContent;
            trackUserAction(action);
        });
    });
    
    // Notification bell
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', toggleNotifications);
    }
}

/**
 * ============================================================================
 * DATA LOADING FUNCTIONS
 * ============================================================================
 */

async function loadUserData() {
    try {
        const user = window.Auth.getUser();
        
        if (user) {
            // Update user info in sidebar
            document.getElementById('userName').textContent = user.name || 'User';
            document.getElementById('userEmail').textContent = user.email || 'user@example.com';
            document.getElementById('greetingName').textContent = user.name?.split(' ')[0] || 'User';
            
            // Update avatar with first letter
            const avatar = document.getElementById('userAvatar');
            if (avatar && user.name) {
                const initials = getInitials(user.name);
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(DASHBOARD_CONFIG.chartColors.primary.slice(1))}&color=fff&size=100`;
            }
            
            // Calculate membership days
            if (user.createdAt) {
                const joinDate = new Date(user.createdAt);
                const today = new Date();
                const diffTime = Math.abs(today - joinDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                document.getElementById('memberSince').textContent = diffDays;
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadDashboardStats() {
    try {
        let stats;
        
        if (DASHBOARD_CONFIG.demoMode) {
            stats = await getDemoStats();
        } else {
            stats = await getRealStats();
        }
        
        // Update all stat elements
        updateStatElements(stats);
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Use demo data as fallback
        const stats = await getDemoStats();
        updateStatElements(stats);
    }
}

async function loadRecentRecordings() {
    try {
        let recordings;
        
        if (DASHBOARD_CONFIG.demoMode) {
            recordings = getDemoRecordings();
        } else {
            recordings = await getRealRecordings();
        }
        
        displayRecentRecordings(recordings);
        
    } catch (error) {
        console.error('Error loading recent recordings:', error);
        displayRecentRecordings(getDemoRecordings());
    }
}

async function loadHealthStatus() {
    try {
        let status;
        
        if (DASHBOARD_CONFIG.demoMode) {
            status = getDemoHealthStatus();
        } else {
            status = await getRealHealthStatus();
        }
        
        updateHealthStatus(status);
        
    } catch (error) {
        console.error('Error loading health status:', error);
        updateHealthStatus(getDemoHealthStatus());
    }
}

async function loadHealthTip() {
    const tips = [
        {
            title: "Stay Hydrated",
            content: "Drinking enough water helps maintain vocal cord lubrication and prevents voice strain. Aim for 8 glasses daily.",
            category: "Vocal Health",
            source: "Medical Advice",
            icon: "fa-tint"
        },
        {
            title: "Practice Good Posture",
            content: "Maintain an upright posture while speaking to allow optimal airflow and reduce strain on vocal cords.",
            category: "Technique",
            source: "Voice Therapy",
            icon: "fa-user"
        },
        {
            title: "Avoid Vocal Strain",
            content: "Don't shout or whisper excessively. Use a moderate volume and take regular breaks when speaking for long periods.",
            category: "Prevention",
            source: "ENT Specialist",
            icon: "fa-volume-off"
        },
        {
            title: "Warm Up Your Voice",
            content: "Practice gentle vocal exercises in the morning to prepare your vocal cords for the day.",
            category: "Routine",
            source: "Voice Coach",
            icon: "fa-music"
        },
        {
            title: "Monitor Air Quality",
            content: "Avoid dry or polluted environments. Use a humidifier if the air is too dry.",
            category: "Environment",
            source: "Health Expert",
            icon: "fa-wind"
        }
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    displayHealthTip(randomTip);
}

async function loadAnnouncements() {
    // This would normally come from an API
    const announcements = [
        {
            title: "New Feature: Voice Trends",
            content: "Track your voice health patterns over time with our new trends analysis.",
            date: "2 days ago",
            icon: "fa-star",
            new: true
        },
        {
            title: "Privacy Update",
            content: "Enhanced encryption for your voice recordings and health data.",
            date: "1 week ago",
            icon: "fa-shield-alt",
            new: false
        },
        {
            title: "Mobile App Coming Soon",
            content: "Access Voice Health on the go with our upcoming mobile application.",
            date: "2 weeks ago",
            icon: "fa-mobile-alt",
            new: false
        }
    ];
    
    displayAnnouncements(announcements);
}

/**
 * ============================================================================
 * DISPLAY FUNCTIONS
 * ============================================================================
 */

function updateStatElements(stats) {
    // Update sidebar stats
    document.getElementById('totalRecordings').textContent = stats.totalRecordings || 0;
    document.getElementById('normalCount').textContent = stats.normalResults || 0;
    document.getElementById('warningCount').textContent = stats.warningResults || 0;
    document.getElementById('lastCheck').textContent = stats.lastCheck || '--';
    
    // Update main stat cards
    document.getElementById('totalRecordingsCard').textContent = stats.totalRecordings || 0;
    document.getElementById('avgConfidence').textContent = `${stats.avgConfidence || 0}%`;
    document.getElementById('attentionNeeded').textContent = stats.attentionNeeded || 0;
    document.getElementById('daysSinceLast').textContent = stats.daysSinceLast || 0;
}

function displayRecentRecordings(recordings) {
    const container = document.getElementById('recentRecordings');
    if (!container) return;
    
    if (recordings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-microphone-slash"></i>
                <p>No recordings yet</p>
                <button class="btn btn-primary" onclick="window.location.href='record.html'">
                    Make your first recording
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    recordings.forEach(recording => {
        const date = new Date(recording.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusClass = getStatusClass(recording.status);
        const statusIcon = getStatusIcon(recording.status);
        
        html += `
            <div class="recording-item">
                <div class="recording-icon ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                </div>
                <div class="recording-info">
                    <h4>${recording.title || 'Voice Recording'}</h4>
                    <div class="recording-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-chart-bar"></i> ${recording.confidence}% confidence</span>
                        <span><i class="fas fa-clock"></i> ${recording.duration}s</span>
                    </div>
                </div>
                <div class="recording-actions">
                    <button class="btn-icon" onclick="playRecording('${recording.id}')" title="Play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-icon" onclick="viewRecordingDetails('${recording.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateHealthStatus(status) {
    // Update status badge
    const statusBadge = document.getElementById('overallStatus');
    statusBadge.textContent = status.overall;
    statusBadge.className = `status-badge ${getStatusClass(status.overall)}`;
    
    // Update status text
    document.getElementById('statusText').textContent = status.overall;
    document.getElementById('statusText').className = getStatusClass(status.overall);
    document.getElementById('statusDescription').textContent = status.description;
    
    // Update status circle
    const statusCircle = document.querySelector('.status-circle');
    statusCircle.className = `status-circle ${getStatusClass(status.overall)}`;
    statusCircle.innerHTML = `<i class="fas ${getStatusIcon(status.overall)}"></i>`;
    
    // Update metrics
    if (status.metrics) {
        const metricsContainer = document.querySelector('.status-metrics');
        let metricsHtml = '';
        
        status.metrics.forEach(metric => {
            metricsHtml += `
                <div class="metric">
                    <span class="metric-label">${metric.name}</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${metric.value}%; background: ${metric.color || DASHBOARD_CONFIG.chartColors.success}"></div>
                    </div>
                    <span class="metric-value">${metric.value}%</span>
                </div>
            `;
        });
        
        metricsContainer.innerHTML = metricsHtml;
    }
}

function displayHealthTip(tip) {
    const container = document.querySelector('.health-tip');
    if (!container) return;
    
    container.innerHTML = `
        <div class="tip-icon">
            <i class="fas ${tip.icon}"></i>
        </div>
        <div class="tip-content">
            <h4>${tip.title}</h4>
            <p>${tip.content}</p>
            <div class="tip-meta">
                <span class="tip-category"><i class="fas fa-tag"></i> ${tip.category}</span>
                <span class="tip-source"><i class="fas fa-stethoscope"></i> ${tip.source}</span>
            </div>
        </div>
    `;
}

function displayAnnouncements(announcements) {
    const container = document.querySelector('.announcements');
    if (!container) return;
    
    let html = '';
    
    announcements.forEach(announcement => {
        html += `
            <div class="announcement-item ${announcement.new ? 'new' : ''}">
                <div class="announcement-icon">
                    <i class="fas ${announcement.icon}"></i>
                </div>
                <div class="announcement-content">
                    <h4>${announcement.title}</h4>
                    <p>${announcement.content}</p>
                    <span class="announcement-date">${announcement.date}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * ============================================================================
 * CHART FUNCTIONS
 * ============================================================================
 */

let trendChart;

function initializeTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (trendChart) {
        trendChart.destroy();
    }
    
    // Get demo data
    const data = getDemoChartData();
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Voice Health Score',
                data: data.scores,
                borderColor: DASHBOARD_CONFIG.chartColors.primary,
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
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
                    intersect: false
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
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateTrendChart() {
    const filter = document.getElementById('trendFilter');
    const days = filter ? parseInt(filter.value) : 30;
    
    // Get new data based on filter
    const data = getDemoChartData(days);
    
    if (trendChart) {
        trendChart.data.labels = data.labels;
        trendChart.data.datasets[0].data = data.scores;
        trendChart.update();
    }
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const dateTimeString = now.toLocaleDateString('en-US', options);
    document.getElementById('currentDateTime').textContent = dateTimeString;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'normal':
        case 'good':
        case 'healthy':
            return 'success';
        case 'warning':
        case 'moderate':
        case 'attention':
            return 'warning';
        case 'alert':
        case 'critical':
        case 'abnormal':
            return 'alert';
        default:
            return 'success';
    }
}

function getStatusIcon(status) {
    switch(status.toLowerCase()) {
        case 'normal':
        case 'good':
        case 'healthy':
            return 'fa-check';
        case 'warning':
        case 'moderate':
        case 'attention':
            return 'fa-exclamation-triangle';
        case 'alert':
        case 'critical':
        case 'abnormal':
            return 'fa-exclamation-circle';
        default:
            return 'fa-check';
    }
}

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

function toggleNotifications() {
    const dropdown = document.querySelector('.notification-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function loadNewTip() {
    loadHealthTip();
}

function showHealthTips() {
    window.UI.showModal('healthTips', `
        <h3>Voice Health Tips</h3>
        <div class="tips-list">
            <div class="tip">
                <i class="fas fa-tint"></i>
                <div>
                    <h4>Stay Hydrated</h4>
                    <p>Drink plenty of water throughout the day to keep vocal cords moist.</p>
                </div>
            </div>
            <div class="tip">
                <i class="fas fa-volume-off"></i>
                <div>
                    <h4>Avoid Strain</h4>
                    <p>Don't shout or whisper excessively. Use a moderate volume.</p>
                </div>
            </div>
            <div class="tip">
                <i class="fas fa-user"></i>
                <div>
                    <h4>Good Posture</h4>
                    <p>Maintain upright posture for optimal airflow and vocal production.</p>
                </div>
            </div>
            <div class="tip">
                <i class="fas fa-bed"></i>
                <div>
                    <h4>Get Enough Sleep</h4>
                    <p>Rest is essential for vocal cord recovery and overall health.</p>
                </div>
            </div>
        </div>
    `, {
        title: 'Voice Health Tips',
        size: 'medium'
    });
}

function playRecording(recordingId) {
    console.log('Playing recording:', recordingId);
    window.UI.showToast('Playing recording...', 'info');
}

function viewRecordingDetails(recordingId) {
    console.log('Viewing recording details:', recordingId);
    window.location.href = `prediction_result.html?id=${recordingId}`;
}

function trackUserAction(action) {
    console.log('User action:', action);
    // In production, this would send analytics data
}

function startPeriodicUpdates() {
    setInterval(() => {
        loadDashboardStats();
        loadRecentRecordings();
        loadHealthStatus();
    }, DASHBOARD_CONFIG.updateInterval);
}

/**
 * ============================================================================
 * DEMO DATA FUNCTIONS
 * ============================================================================
 */

function getDemoStats() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalRecordings: Math.floor(Math.random() * 50) + 20,
                normalResults: Math.floor(Math.random() * 40) + 15,
                warningResults: Math.floor(Math.random() * 10) + 2,
                lastCheck: '2 hours ago',
                avgConfidence: Math.floor(Math.random() * 20) + 80,
                attentionNeeded: Math.floor(Math.random() * 5) + 1,
                daysSinceLast: Math.floor(Math.random() * 7) + 1
            });
        }, 500);
    });
}

function getDemoRecordings() {
    const statuses = ['normal', 'warning', 'alert'];
    const recordings = [];
    
    for (let i = 0; i < 5; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        recordings.push({
            id: 'rec-' + Date.now() + i,
            title: `Voice Recording ${i + 1}`,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: status,
            confidence: Math.floor(Math.random() * 30) + 70,
            duration: Math.floor(Math.random() * 30) + 10
        });
    }
    
    return recordings;
}

function getDemoHealthStatus() {
    const statuses = [
        { overall: 'Normal', description: 'Your voice patterns are within normal range.' },
        { overall: 'Warning', description: 'Some patterns need attention. Consider a check-up.' },
        { overall: 'Normal', description: 'Voice health is stable and within expected ranges.' }
    ];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    status.metrics = [
        { name: 'Pitch Stability', value: Math.floor(Math.random() * 20) + 80, color: DASHBOARD_CONFIG.chartColors.success },
        { name: 'Voice Clarity', value: Math.floor(Math.random() * 20) + 75, color: DASHBOARD_CONFIG.chartColors.primary },
        { name: 'Consistency', value: Math.floor(Math.random() * 25) + 70, color: DASHBOARD_CONFIG.chartColors.warning }
    ];
    
    return status;
}

function getDemoChartData(days = 30) {
    const labels = [];
    const scores = [];
    
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Generate realistic-looking scores
        const baseScore = 75 + Math.sin(i / 7) * 15;
        const randomVariation = (Math.random() - 0.5) * 10;
        scores.push(Math.min(100, Math.max(0, Math.round(baseScore + randomVariation))));
    }
    
    return { labels, scores };
}

/**
 * ============================================================================
 * API FUNCTIONS (FOR PRODUCTION)
 * ============================================================================
 */

async function getRealStats() {
    try {
        const token = window.Auth.getToken();
        const response = await fetch(`${DASHBOARD_CONFIG.apiBaseUrl}/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function getRealRecordings() {
    try {
        const token = window.Auth.getToken();
        const response = await fetch(`${DASHBOARD_CONFIG.apiBaseUrl}/recordings/recent`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch recordings');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function getRealHealthStatus() {
    try {
        const token = window.Auth.getToken();
        const response = await fetch(`${DASHBOARD_CONFIG.apiBaseUrl}/health/status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch health status');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

/**
 * ============================================================================
 * EXPORT DASHBOARD FUNCTIONS
 * ============================================================================
 */

window.Dashboard = {
    initializeDashboard,
    loadUserData,
    loadDashboardStats,
    loadRecentRecordings,
    loadHealthStatus,
    loadHealthTip,
    showHealthTips,
    playRecording,
    viewRecordingDetails
};