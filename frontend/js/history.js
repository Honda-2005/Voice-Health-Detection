// history.js - History management for Voice Health System

/**
 * ============================================================================
 * HISTORY MODULE
 * ============================================================================
 */

// Configuration
const HISTORY_CONFIG = {
    apiBaseUrl: 'http://localhost:8000/api',
    demoMode: true,
    recordsPerPage: 10,
    chartColors: {
        normal: '#4cc9f0',
        warning: '#f8961e',
        alert: '#f72585',
        primary: '#4361ee'
    }
};

// Global state
const historyState = {
    allRecords: [],
    filteredRecords: [],
    displayedRecords: [],
    selectedRecords: new Set(),
    currentPage: 1,
    currentView: 'list',
    currentFilter: 'all',
    sortBy: 'newest',
    searchQuery: '',
    dateRange: {
        start: null,
        end: null
    }
};

/**
 * ============================================================================
 * INITIALIZATION
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('History Page Initialized');
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize history
    initializeHistory();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load user data
    loadUserData();
    
    // Set default date range
    setDefaultDateRange();
});

/**
 * ============================================================================
 * INITIALIZATION FUNCTIONS
 * ============================================================================
 */

function initializeHistory() {
    console.log('Loading voice history...');
    
    // Load history data
    loadHistoryData();
    
    // Update statistics
    updateStatistics();
}

function initializeEventListeners() {
    // Navigation
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Date filter
    document.getElementById('applyDateFilter')?.addEventListener('click', applyDateFilter);
    
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });
    
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(e);
        });
    }
    
    // Sort
    document.getElementById('sortSelect')?.addEventListener('change', handleSortChange);
    
    // Selection
    document.getElementById('selectAll')?.addEventListener('change', handleSelectAll);
    
    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', goToPreviousPage);
    document.getElementById('nextPage')?.addEventListener('click', goToNextPage);
    
    // Export
    document.getElementById('exportHistoryBtn')?.addEventListener('click', exportAllHistory);
    
    // Quick actions
    document.getElementById('compareRecordingsBtn')?.addEventListener('click', openCompareModal);
    document.getElementById('deleteSelectedBtn')?.addEventListener('click', showDeleteModal);
    document.getElementById('compareSelectedBtn')?.addEventListener('click', compareSelected);
    document.getElementById('deleteSelectedConfirmBtn')?.addEventListener('click', showDeleteModal);
    document.getElementById('clearSelectionBtn')?.addEventListener('click', clearSelection);
    
    // Modal actions
    document.getElementById('closeComparisonBtn')?.addEventListener('click', closeComparisonModal);
    document.getElementById('exportComparisonBtn')?.addEventListener('click', exportComparison);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
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

function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // Default to 3 months back
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.valueAsDate = startDate;
        startDateInput.max = endDate.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
        endDateInput.valueAsDate = endDate;
        endDateInput.max = endDate.toISOString().split('T')[0];
        endDateInput.min = startDate.toISOString().split('T')[0];
    }
    
    // Update history state
    historyState.dateRange.start = startDate;
    historyState.dateRange.end = endDate;
}

/**
 * ============================================================================
 * DATA LOADING FUNCTIONS
 * ============================================================================
 */

async function loadHistoryData() {
    try {
        let records;
        
        if (HISTORY_CONFIG.demoMode) {
            records = await getDemoHistory();
        } else {
            records = await getRealHistory();
        }
        
        historyState.allRecords = records;
        historyState.filteredRecords = [...records];
        historyState.displayedRecords = [...records];
        
        // Update UI
        updateRecordsDisplay();
        updateStatistics();
        updatePagination();
        
        // Show/hide empty state
        toggleEmptyState(records.length === 0);
        
    } catch (error) {
        console.error('Error loading history:', error);
        showToast('Failed to load history data', 'error');
        
        // Show empty state
        toggleEmptyState(true);
    }
}

async function getDemoHistory() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const records = [];
            const now = new Date();
            const statuses = ['normal', 'warning', 'alert'];
            const environments = ['Quiet room', 'Office', 'Home', 'Car'];
            
            // Generate 45 demo records (3 months of data)
            for (let i = 44; i >= 0; i--) {
                const recordDate = new Date(now);
                recordDate.setDate(recordDate.getDate() - i);
                
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const score = status === 'normal' ? Math.floor(Math.random() * 20) + 80 :
                            status === 'warning' ? Math.floor(Math.random() * 20) + 60 :
                            Math.floor(Math.random() * 30) + 40;
                
                records.push({
                    id: `rec_${recordDate.getTime()}`,
                    timestamp: recordDate.toISOString(),
                    status: status,
                    healthScore: score,
                    confidence: Math.floor(Math.random() * 15) + 85,
                    duration: Math.floor(Math.random() * 30) + 20,
                    environment: environments[Math.floor(Math.random() * environments.length)],
                    features: {
                        pitchStability: Math.floor(Math.random() * 20) + 75,
                        voiceClarity: Math.floor(Math.random() * 25) + 70,
                        breathControl: Math.floor(Math.random() * 20) + 75,
                        consistency: Math.floor(Math.random() * 20) + 75
                    }
                });
            }
            
            resolve(records);
        }, 1500);
    });
}

async function getRealHistory() {
    try {
        const token = window.Auth.getToken();
        const response = await fetch(`${HISTORY_CONFIG.apiBaseUrl}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

/**
 * ============================================================================
 * DISPLAY FUNCTIONS
 * ============================================================================
 */

function updateRecordsDisplay() {
    // Apply filters, search, and sort
    filterRecords();
    searchRecords();
    sortRecords();
    
    // Paginate
    paginateRecords();
    
    // Update UI based on current view
    switch(historyState.currentView) {
        case 'list':
            displayListView();
            break;
        case 'grid':
            displayGridView();
            break;
        case 'timeline':
            displayTimelineView();
            break;
    }
    
    // Update record count
    updateRecordCount();
    
    // Update selected actions
    updateSelectedActions();
}

function displayListView() {
    const container = document.getElementById('recordsList');
    if (!container) return;
    
    if (historyState.displayedRecords.length === 0) {
        container.innerHTML = `
            <div class="empty-row">
                <div class="table-cell" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 2rem; color: var(--gray-light); margin-bottom: 15px;"></i>
                    <p style="color: var(--gray); font-size: 1.1rem;">No records match your filters</p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    historyState.displayedRecords.forEach(record => {
        const date = new Date(record.timestamp);
        const isSelected = historyState.selectedRecords.has(record.id);
        
        html += `
            <div class="record-row ${isSelected ? 'selected' : ''}" data-id="${record.id}">
                <div class="table-cell select-cell">
                    <label class="checkbox-container">
                        <input type="checkbox" class="record-checkbox" ${isSelected ? 'checked' : ''} data-id="${record.id}">
                        <span class="checkmark"></span>
                    </label>
                </div>
                <div class="table-cell date-cell">
                    <div class="record-date">
                        <span class="date-main">${date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                        })}</span>
                        <span class="date-sub">${date.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                </div>
                <div class="table-cell status-cell">
                    <span class="status-badge ${record.status}">${record.status.toUpperCase()}</span>
                </div>
                <div class="table-cell score-cell">
                    <span class="record-score">${record.healthScore}</span>
                </div>
                <div class="table-cell duration-cell">
                    <span class="record-duration">${record.duration}s</span>
                </div>
                <div class="table-cell confidence-cell">
                    <span class="record-confidence">${record.confidence}%</span>
                </div>
                <div class="table-cell actions-cell">
                    <div class="record-actions">
                        <button class="action-icon" title="View Details" onclick="viewRecordDetails('${record.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon" title="Play Recording" onclick="playRecording('${record.id}')">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="action-icon" title="Compare" onclick="addToComparison('${record.id}')">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to checkboxes
    container.querySelectorAll('.record-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleRecordSelection);
    });
}

function displayGridView() {
    const container = document.getElementById('recordsGrid');
    if (!container) return;
    
    if (historyState.displayedRecords.length === 0) {
        container.innerHTML = `
            <div class="empty-grid" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--gray-light); margin-bottom: 20px;"></i>
                <h3 style="color: var(--gray); margin-bottom: 10px;">No records found</h3>
                <p style="color: var(--gray-light);">Try adjusting your filters or search query</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    historyState.displayedRecords.forEach(record => {
        const date = new Date(record.timestamp);
        const isSelected = historyState.selectedRecords.has(record.id);
        
        html += `
            <div class="record-card ${record.status} ${isSelected ? 'selected' : ''}" data-id="${record.id}">
                <div class="card-header">
                    <div class="card-date">
                        <div class="date">${date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                        })}</div>
                        <div class="time">${date.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</div>
                    </div>
                    <div class="card-status ${record.status}">${record.status.toUpperCase()}</div>
                </div>
                
                <div class="card-body">
                    <div class="card-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Health Score</span>
                            <span class="metric-value">${record.healthScore}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Confidence</span>
                            <span class="metric-value">${record.confidence}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Duration</span>
                            <span class="metric-value">${record.duration}s</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Environment</span>
                            <span class="metric-value">${record.environment}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="card-selection">
                        <label class="checkbox-container">
                            <input type="checkbox" class="record-checkbox" ${isSelected ? 'checked' : ''} data-id="${record.id}">
                            <span class="checkmark"></span>
                            <span>Select</span>
                        </label>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline" onclick="viewRecordDetails('${record.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="playRecording('${record.id}')">
                            <i class="fas fa-play"></i> Play
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to checkboxes
    container.querySelectorAll('.record-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleRecordSelection);
    });
}

function displayTimelineView() {
    const container = document.querySelector('.timeline');
    if (!container) return;
    
    if (historyState.displayedRecords.length === 0) {
        container.innerHTML = `
            <div class="empty-timeline" style="text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--gray-light); margin-bottom: 20px;"></i>
                <h3 style="color: var(--gray); margin-bottom: 10px;">No timeline data</h3>
                <p style="color: var(--gray-light);">Try adjusting your filters or date range</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Group records by month
    const recordsByMonth = {};
    historyState.displayedRecords.forEach(record => {
        const date = new Date(record.timestamp);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!recordsByMonth[monthKey]) {
            recordsByMonth[monthKey] = [];
        }
        recordsByMonth[monthKey].push(record);
    });
    
    // Create timeline items
    Object.keys(recordsByMonth).forEach((month, monthIndex) => {
        const monthRecords = recordsByMonth[month];
        
        html += `
            <div class="timeline-month">
                <div class="month-header">
                    <h3>${month}</h3>
                    <span class="month-count">${monthRecords.length} recordings</span>
                </div>
                <div class="month-records">
        `;
        
        monthRecords.forEach((record, recordIndex) => {
            const date = new Date(record.timestamp);
            
            html += `
                <div class="timeline-item ${record.status}">
                    <div class="timeline-marker">
                        <i class="fas fa-microphone"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <div class="timeline-date">
                                ${date.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric'
                                })}
                            </div>
                            <div class="timeline-status ${record.status}">
                                ${record.status.toUpperCase()}
                            </div>
                        </div>
                        <div class="timeline-body">
                            <div class="timeline-metric">
                                <span class="metric-label">Health Score</span>
                                <span class="metric-value">${record.healthScore}</span>
                            </div>
                            <div class="timeline-metric">
                                <span class="metric-label">Duration</span>
                                <span class="metric-value">${record.duration}s</span>
                            </div>
                            <div class="timeline-metric">
                                <span class="metric-label">Confidence</span>
                                <span class="metric-value">${record.confidence}%</span>
                            </div>
                        </div>
                        <div class="timeline-footer">
                            <button class="btn btn-sm btn-outline" onclick="viewRecordDetails('${record.id}')">
                                <i class="fas fa-eye"></i> Details
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="playRecording('${record.id}')">
                                <i class="fas fa-play"></i> Play
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateRecordCount() {
    const element = document.getElementById('recordCount');
    if (element) {
        const total = historyState.filteredRecords.length;
        const displayed = historyState.displayedRecords.length;
        const page = historyState.currentPage;
        const perPage = HISTORY_CONFIG.recordsPerPage;
        const start = (page - 1) * perPage + 1;
        const end = Math.min(page * perPage, total);
        
        if (total === 0) {
            element.textContent = 'No records found';
        } else if (total === displayed) {
            element.textContent = `${total} records`;
        } else {
            element.textContent = `Showing ${start}-${end} of ${total} records`;
        }
    }
}

function updateStatistics() {
    const total = historyState.allRecords.length;
    
    if (total === 0) {
        // Set default values
        document.getElementById('totalHistory').textContent = '0';
        document.getElementById('totalRecordingsStat').textContent = '0';
        document.getElementById('normalRecordings').textContent = '0';
        document.getElementById('warningRecordings').textContent = '0';
        document.getElementById('alertRecordings').textContent = '0';
        document.getElementById('consistencyValue').textContent = '0%';
        document.getElementById('consistencyFill').style.width = '0%';
        
        // Calculate days tracked
        const daysTracked = calculateDaysTracked([]);
        document.getElementById('historyDays').textContent = daysTracked;
        
        // Calculate average score
        document.getElementById('avgScore').textContent = '0';
        
        return;
    }
    
    // Update counts
    document.getElementById('totalHistory').textContent = total;
    document.getElementById('totalRecordingsStat').textContent = total;
    
    // Count by status
    const normalCount = historyState.allRecords.filter(r => r.status === 'normal').length;
    const warningCount = historyState.allRecords.filter(r => r.status === 'warning').length;
    const alertCount = historyState.allRecords.filter(r => r.status === 'alert').length;
    
    document.getElementById('normalRecordings').textContent = normalCount;
    document.getElementById('warningRecordings').textContent = warningCount;
    document.getElementById('alertRecordings').textContent = alertCount;
    
    // Calculate days tracked
    const daysTracked = calculateDaysTracked(historyState.allRecords);
    document.getElementById('historyDays').textContent = daysTracked;
    
    // Calculate average score
    const avgScore = Math.round(historyState.allRecords.reduce((sum, r) => sum + r.healthScore, 0) / total);
    document.getElementById('avgScore').textContent = avgScore;
    
    // Calculate consistency (percentage of recordings within 10% of average score)
    const consistentCount = historyState.allRecords.filter(r => 
        Math.abs(r.healthScore - avgScore) <= 10
    ).length;
    const consistency = Math.round((consistentCount / total) * 100);
    
    document.getElementById('consistencyValue').textContent = `${consistency}%`;
    document.getElementById('consistencyFill').style.width = `${consistency}%`;
    
    // Update consistency color
    const fillElement = document.getElementById('consistencyFill');
    if (consistency >= 80) {
        fillElement.style.background = 'var(--success)';
    } else if (consistency >= 60) {
        fillElement.style.background = 'var(--warning)';
    } else {
        fillElement.style.background = 'var(--danger)';
    }
}

function calculateDaysTracked(records) {
    if (records.length === 0) return 0;
    
    const dates = records.map(r => new Date(r.timestamp).toDateString());
    const uniqueDates = new Set(dates);
    
    return uniqueDates.size;
}

function toggleEmptyState(isEmpty) {
    const emptyState = document.getElementById('emptyState');
    const recordsContainer = document.querySelector('.records-container');
    
    if (emptyState && recordsContainer) {
        if (isEmpty) {
            emptyState.style.display = 'block';
            recordsContainer.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            recordsContainer.style.display = 'block';
        }
    }
}

/**
 * ============================================================================
 * FILTERING, SEARCHING, AND SORTING
 * ============================================================================
 */

function filterRecords() {
    let filtered = [...historyState.allRecords];
    
    // Apply status filter
    if (historyState.currentFilter !== 'all') {
        filtered = filtered.filter(record => record.status === historyState.currentFilter);
    }
    
    // Apply date filter
    if (historyState.dateRange.start && historyState.dateRange.end) {
        filtered = filtered.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= historyState.dateRange.start && 
                   recordDate <= historyState.dateRange.end;
        });
    }
    
    historyState.filteredRecords = filtered;
}

function searchRecords() {
    if (!historyState.searchQuery.trim()) {
        // If no search query, use filtered records
        historyState.displayedRecords = [...historyState.filteredRecords];
        return;
    }
    
    const query = historyState.searchQuery.toLowerCase();
    historyState.displayedRecords = historyState.filteredRecords.filter(record => {
        // Search in various fields
        return (
            record.id.toLowerCase().includes(query) ||
            record.status.toLowerCase().includes(query) ||
            record.environment.toLowerCase().includes(query) ||
            record.timestamp.toLowerCase().includes(query)
        );
    });
}

function sortRecords() {
    const sortFunction = getSortFunction(historyState.sortBy);
    historyState.displayedRecords.sort(sortFunction);
}

function getSortFunction(sortBy) {
    switch(sortBy) {
        case 'newest':
            return (a, b) => new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
            return (a, b) => new Date(a.timestamp) - new Date(b.timestamp);
        case 'score-high':
            return (a, b) => b.healthScore - a.healthScore;
        case 'score-low':
            return (a, b) => a.healthScore - b.healthScore;
        case 'duration':
            return (a, b) => b.duration - a.duration;
        default:
            return (a, b) => new Date(b.timestamp) - new Date(a.timestamp);
    }
}

function paginateRecords() {
    const perPage = HISTORY_CONFIG.recordsPerPage;
    const startIndex = (historyState.currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    historyState.displayedRecords = historyState.displayedRecords.slice(startIndex, endIndex);
}

function updatePagination() {
    const totalRecords = historyState.filteredRecords.length;
    const perPage = HISTORY_CONFIG.recordsPerPage;
    const totalPages = Math.ceil(totalRecords / perPage);
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (prevBtn) {
        prevBtn.disabled = historyState.currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = historyState.currentPage === totalPages || totalPages === 0;
    }
    
    if (pageNumbers) {
        let html = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, historyState.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page
        if (startPage > 1) {
            html += `<span class="page-number" data-page="1">1</span>`;
            if (startPage > 2) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        // Visible pages
        for (let i = startPage; i <= endPage; i++) {
            html += `<span class="page-number ${i === historyState.currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += `<span class="page-number" data-page="${totalPages}">${totalPages}</span>`;
        }
        
        pageNumbers.innerHTML = html;
        
        // Add event listeners to page numbers
        pageNumbers.querySelectorAll('.page-number').forEach(pageEl => {
            pageEl.addEventListener('click', () => {
                const page = parseInt(pageEl.dataset.page);
                if (page !== historyState.currentPage) {
                    historyState.currentPage = page;
                    updateRecordsDisplay();
                }
            });
        });
    }
}

/**
 * ============================================================================
 * EVENT HANDLERS
 * ============================================================================
 */

function handleFilterClick(event) {
    const filterBtn = event.currentTarget;
    const filter = filterBtn.dataset.filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    filterBtn.classList.add('active');
    
    // Update state
    historyState.currentFilter = filter;
    historyState.currentPage = 1;
    
    // Update display
    updateRecordsDisplay();
}

function applyDateFilter() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && endDateInput) {
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        
        if (startDate && endDate && startDate > endDate) {
            showToast('Start date cannot be after end date', 'error');
            return;
        }
        
        historyState.dateRange.start = startDate;
        historyState.dateRange.end = endDate;
        historyState.currentPage = 1;
        
        updateRecordsDisplay();
        showToast('Date filter applied', 'success');
    }
}

function handleViewChange(event) {
    const viewBtn = event.currentTarget;
    const view = viewBtn.dataset.view;
    
    // Update active view button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    viewBtn.classList.add('active');
    
    // Hide all views
    document.querySelectorAll('.records-view').forEach(viewEl => {
        viewEl.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(`${view}View`).classList.add('active');
    
    // Update state
    historyState.currentView = view;
    
    // Update display for the new view
    updateRecordsDisplay();
}

function handleSearch(event) {
    historyState.searchQuery = event.target.value;
    historyState.currentPage = 1;
    updateRecordsDisplay();
}

function handleSortChange(event) {
    historyState.sortBy = event.target.value;
    updateRecordsDisplay();
}

function handleRecordSelection(event) {
    const checkbox = event.currentTarget;
    const recordId = checkbox.dataset.id;
    
    if (checkbox.checked) {
        historyState.selectedRecords.add(recordId);
    } else {
        historyState.selectedRecords.delete(recordId);
    }
    
    // Update "Select All" checkbox
    updateSelectAllCheckbox();
    
    // Update selected actions
    updateSelectedActions();
}

function handleSelectAll(event) {
    const selectAllCheckbox = event.currentTarget;
    const recordCheckboxes = document.querySelectorAll('.record-checkbox');
    
    if (selectAllCheckbox.checked) {
        // Select all displayed records
        historyState.displayedRecords.forEach(record => {
            historyState.selectedRecords.add(record.id);
        });
        recordCheckboxes.forEach(cb => cb.checked = true);
    } else {
        // Deselect all
        historyState.selectedRecords.clear();
        recordCheckboxes.forEach(cb => cb.checked = false);
    }
    
    updateSelectedActions();
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    if (!selectAllCheckbox) return;
    
    const displayedIds = new Set(historyState.displayedRecords.map(r => r.id));
    const selectedDisplayed = Array.from(historyState.selectedRecords).filter(id => 
        displayedIds.has(id)
    );
    
    if (selectedDisplayed.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedDisplayed.length === displayedIds.size) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function updateSelectedActions() {
    const selectedActions = document.getElementById('selectedActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedActions && selectedCount) {
        const count = historyState.selectedRecords.size;
        
        if (count > 0) {
            selectedActions.style.display = 'flex';
            selectedCount.textContent = count;
        } else {
            selectedActions.style.display = 'none';
        }
    }
}

function clearSelection() {
    historyState.selectedRecords.clear();
    
    // Update checkboxes
    document.querySelectorAll('.record-checkbox').forEach(cb => cb.checked = false);
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    
    updateSelectedActions();
}

function goToPreviousPage() {
    if (historyState.currentPage > 1) {
        historyState.currentPage--;
        updateRecordsDisplay();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(historyState.filteredRecords.length / HISTORY_CONFIG.recordsPerPage);
    if (historyState.currentPage < totalPages) {
        historyState.currentPage++;
        updateRecordsDisplay();
    }
}

/**
 * ============================================================================
 * RECORD ACTIONS
 * ============================================================================
 */

function viewRecordDetails(recordId) {
    // Navigate to results page with this record
    window.location.href = `prediction_result.html?id=${recordId}`;
}

function playRecording(recordId) {
    const record = historyState.allRecords.find(r => r.id === recordId);
    if (!record) return;
    
    showToast(`Playing recording from ${new Date(record.timestamp).toLocaleDateString()}`, 'info');
    
    // In production, this would play the actual audio file
    // For demo, we'll just show a notification
    setTimeout(() => {
        showToast('Audio playback complete', 'success');
    }, 2000);
}

function addToComparison(recordId) {
    historyState.selectedRecords.add(recordId);
    updateSelectedActions();
    showToast('Recording added to comparison', 'success');
}

function compareSelected() {
    if (historyState.selectedRecords.size < 2) {
        showToast('Please select at least 2 recordings to compare', 'warning');
        return;
    }
    
    if (historyState.selectedRecords.size > 5) {
        showToast('Please select no more than 5 recordings to compare', 'warning');
        return;
    }
    
    openCompareModal();
}

function openCompareModal() {
    const modal = document.getElementById('comparisonModal');
    if (!modal) return;
    
    const selectedRecords = Array.from(historyState.selectedRecords)
        .map(id => historyState.allRecords.find(r => r.id === id))
        .filter(Boolean);
    
    if (selectedRecords.length < 2) {
        showToast('Please select at least 2 recordings to compare', 'warning');
        return;
    }
    
    // Load comparison content
    loadComparisonContent(selectedRecords);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function loadComparisonContent(records) {
    const container = document.querySelector('.comparison-container');
    if (!container) return;
    
    // Sort by date
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let html = `
        <div class="comparison-header">
            <h4>Comparing ${records.length} Recordings</h4>
            <p>Analysis of selected voice recordings</p>
        </div>
        
        <div class="comparison-table">
            <div class="comparison-row header">
                <div class="comparison-cell">Date & Time</div>
                <div class="comparison-cell">Status</div>
                <div class="comparison-cell">Health Score</div>
                <div class="comparison-cell">Confidence</div>
                <div class="comparison-cell">Duration</div>
                <div class="comparison-cell">Pitch Stability</div>
                <div class="comparison-cell">Voice Clarity</div>
            </div>
    `;
    
    records.forEach(record => {
        const date = new Date(record.timestamp);
        
        html += `
            <div class="comparison-row">
                <div class="comparison-cell">
                    ${date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                    })}<br>
                    <small>${date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</small>
                </div>
                <div class="comparison-cell">
                    <span class="status-badge ${record.status}">${record.status.toUpperCase()}</span>
                </div>
                <div class="comparison-cell">
                    <span class="score-value">${record.healthScore}</span>
                </div>
                <div class="comparison-cell">
                    <span class="confidence-value">${record.confidence}%</span>
                </div>
                <div class="comparison-cell">
                    <span class="duration-value">${record.duration}s</span>
                </div>
                <div class="comparison-cell">
                    <span class="feature-value">${record.features?.pitchStability || 'N/A'}%</span>
                </div>
                <div class="comparison-cell">
                    <span class="feature-value">${record.features?.voiceClarity || 'N/A'}%</span>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        
        <div class="comparison-chart">
            <h5>Health Score Comparison</h5>
            <canvas id="comparisonChart"></canvas>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Initialize comparison chart
    initializeComparisonChart(records);
}

function initializeComparisonChart(records) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    
    // Sort records by date for chart
    const sortedRecords = [...records].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const labels = sortedRecords.map(r => 
        new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    
    const scores = sortedRecords.map(r => r.healthScore);
    const statusColors = sortedRecords.map(r => 
        r.status === 'normal' ? HISTORY_CONFIG.chartColors.normal :
        r.status === 'warning' ? HISTORY_CONFIG.chartColors.warning :
        HISTORY_CONFIG.chartColors.alert
    );
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Health Score',
                data: scores,
                backgroundColor: statusColors,
                borderColor: 'white',
                borderWidth: 2,
                borderRadius: 6
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
                    callbacks: {
                        label: function(context) {
                            const record = sortedRecords[context.dataIndex];
                            return [
                                `Score: ${context.parsed.y}`,
                                `Status: ${record.status.toUpperCase()}`,
                                `Confidence: ${record.confidence}%`
                            ];
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
                    }
                }
            }
        }
    });
}

function closeComparisonModal() {
    const modal = document.getElementById('comparisonModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function exportComparison() {
    showToast('Exporting comparison data...', 'info');
    
    setTimeout(() => {
        showToast('Comparison exported successfully', 'success');
        closeComparisonModal();
    }, 1500);
}

function showDeleteModal() {
    if (historyState.selectedRecords.size === 0) {
        showToast('Please select recordings to delete', 'warning');
        return;
    }
    
    const modal = document.getElementById('deleteModal');
    const deleteCount = document.getElementById('deleteCount');
    
    if (modal && deleteCount) {
        deleteCount.textContent = historyState.selectedRecords.size;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function confirmDelete() {
    const selectedCount = historyState.selectedRecords.size;
    
    showToast(`Deleting ${selectedCount} recording(s)...`, 'info');
    
    // In production, this would make an API call to delete records
    // For demo, we'll simulate deletion
    setTimeout(() => {
        // Remove selected records from all arrays
        historyState.allRecords = historyState.allRecords.filter(
            r => !historyState.selectedRecords.has(r.id)
        );
        
        // Clear selection
        historyState.selectedRecords.clear();
        
        // Update display
        updateRecordsDisplay();
        updateStatistics();
        updateSelectedActions();
        
        showToast(`${selectedCount} recording(s) deleted successfully`, 'success');
        closeDeleteModal();
    }, 2000);
}

function exportAllHistory() {
    showToast('Exporting all history data...', 'info');
    
    // In production, this would generate and download a CSV/PDF
    // For demo, we'll simulate the process
    setTimeout(() => {
        const csvContent = generateHistoryCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `voice-health-history-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        showToast('History exported successfully', 'success');
    }, 1500);
}

function generateHistoryCSV() {
    const headers = ['Date', 'Time', 'Status', 'Health Score', 'Confidence', 'Duration', 'Environment', 'Pitch Stability', 'Voice Clarity', 'Breath Control', 'Consistency'];
    const rows = historyState.allRecords.map(record => {
        const date = new Date(record.timestamp);
        return [
            date.toLocaleDateString('en-US'),
            date.toLocaleTimeString('en-US'),
            record.status,
            record.healthScore,
            record.confidence,
            record.duration,
            record.environment,
            record.features?.pitchStability || 'N/A',
            record.features?.voiceClarity || 'N/A',
            record.features?.breathControl || 'N/A',
            record.features?.consistency || 'N/A'
        ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
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

function showToast(message, type = 'info') {
    if (window.UI && window.UI.showToast) {
        window.UI.showToast(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * ============================================================================
 * CLEANUP
 * ============================================================================
 */

function cleanup() {
    // Clear any intervals or timeouts
    // (none currently in use)
}

// Cleanup on page unload
window.addEventListener('unload', cleanup);

/**
 * ============================================================================
 * EXPORT HISTORY FUNCTIONS
 * ============================================================================
 */

window.History = {
    loadHistoryData,
    exportAllHistory,
    compareSelected,
    cleanup
};