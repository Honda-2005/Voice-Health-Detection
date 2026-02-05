/**
 * Auth Storage - Handles token and user data persistence
 * Separated for better security and maintainability
 */

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'voice_health_access_token',
    REFRESH_TOKEN: 'voice_health_refresh_token',
    USER_DATA: 'voice_health_user',
    REMEMBER_ME: 'voice_health_remember_me',
};

export const AuthStorage = {
    /**
     * Save authentication tokens
     */
    saveTokens(accessToken, refreshToken, rememberMe = false) {
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

        if (rememberMe) {
            localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        }
    },

    /**
     * Get access token
     */
    getAccessToken() {
        return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
            sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    },

    /**
     * Get refresh token
     */
    getRefreshToken() {
        return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
            sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    },

    /**
     * Save user data (sanitized - no sensitive info)
     */
    saveUser(user) {
        const sanitizedUser = {
            id: user.id || user._id,
            email: user.email,
            fullName: user.fullName || user.profile?.fullName,
            role: user.role,
            isVerified: user.isVerified,
        };

        const storage = this.isRememberMe() ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(sanitizedUser));
    },

    /**
     * Get user data
     */
    getUser() {
        const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA) ||
            sessionStorage.getItem(STORAGE_KEYS.USER_DATA);

        if (!stored) return null;

        try {
            return JSON.parse(stored);
        } catch (error) {
            console.error('Failed to parse user data:', error);
            return null;
        }
    },

    /**
     * Clear all auth data
     */
    clearAuth() {
        // Clear from both storages
        [localStorage, sessionStorage].forEach(storage => {
            Object.values(STORAGE_KEYS).forEach(key => {
                storage.removeItem(key);
            });
        });
    },

    /**
     * Check if user chose "remember me"
     */
    isRememberMe() {
        return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getAccessToken();
    },

    /**
     * Get authorization header
     */
    getAuthHeader() {
        const token = this.getAccessToken();
        return token ? `Bearer ${token}` : null;
    },
};

export default AuthStorage;
