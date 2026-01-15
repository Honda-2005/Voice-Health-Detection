/**
 * API Communication Layer
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Set authentication token in localStorage
 */
function setAuthToken(token) {
    localStorage.setItem('authToken');
}

/**
 * Remove authentication token from localStorage
 */
function removeAuthToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}

/**
 * Make an HTTP request to the API
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add authorization header if token exists
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Parse response
        const data = await response.json();

        // Handle errors
        if (!response.ok) {
            throw new Error(data.detail || data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * API Methods
 */
const API = {
    // Authentication
    auth: {
        /**
         * Register a new user
         */
        async register(userData) {
            return await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        /**
         * Login user
         */
        async login(credentials) {
            return await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
        },

        /**
         * Logout user
         */
        async logout() {
            return await apiRequest('/auth/logout', {
                method: 'POST'
            });
        },

        /**
         * Get current user
         */
        async getCurrentUser() {
            return await apiRequest('/auth/me', {
                method: 'GET'
            });
        }
    },

    // Profile Management
    profile: {
        /**
         * Get user profile
         */
        async getProfile() {
            return await apiRequest('/profile', {
                method: 'GET'
            });
        },

        /**
         * Update user profile
         */
        async updateProfile(profileData) {
            return await apiRequest('/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        },

        /**
         * Delete user account
         */
        async deleteAccount() {
            return await apiRequest('/profile', {
                method: 'DELETE'
            });
        }
    }
};

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getAuthToken();
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/frontend/views/login.html';
        return false;
    }
    return true;
}

/**
 * Redirect to homepage if already authenticated
 */
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = '/frontend/views/homepage.html';
    }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, getAuthToken, setAuthToken, removeAuthToken, isAuthenticated, requireAuth, redirectIfAuthenticated };
}
