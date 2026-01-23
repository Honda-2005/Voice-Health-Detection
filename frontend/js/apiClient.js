/**
 * Voice Health Detection - API Client
 * Handles all communication with the backend API
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // ==================== AUTHENTICATION ====================

  async register(email, password, fullName, phone = '') {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone }),
      });
      const data = await response.json();
      
      if (data.success) {
        this.saveTokens(data.data.tokens);
      }
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (data.success) {
        this.saveTokens(data.data.tokens);
      }
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      const data = await response.json();
      
      if (data.success) {
        this.saveTokens(data.data.tokens);
      }
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      this.clearTokens();
      return { success: true };
    } catch (error) {
      this.clearTokens();
      return { success: false, message: error.message };
    }
  }

  async verifyEmail(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async forgotPassword(email) {
    try {
      const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async resetPassword(token, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ==================== USER PROFILE ====================

  async getProfile() {
    return this.makeRequest(`${this.baseURL}/users/profile`, 'GET');
  }

  async updateProfile(profileData) {
    return this.makeRequest(`${this.baseURL}/users/profile`, 'PUT', profileData);
  }

  async updateMedicalInfo(medicalData) {
    return this.makeRequest(`${this.baseURL}/users/medical-info`, 'PUT', medicalData);
  }

  async updateSettings(settings) {
    return this.makeRequest(`${this.baseURL}/users/settings`, 'PUT', settings);
  }

  async getUserStats() {
    return this.makeRequest(`${this.baseURL}/users/stats`, 'GET');
  }

  async deleteAccount(password) {
    return this.makeRequest(`${this.baseURL}/users/account`, 'DELETE', { password });
  }

  // ==================== RECORDINGS ====================

  async uploadRecording(audioFile, filename, duration) {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('filename', filename);
      formData.append('duration', duration);

      const response = await fetch(`${this.baseURL}/recordings/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: formData,
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.uploadRecording(audioFile, filename, duration);
      }

      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getRecordings(page = 1, limit = 10, status = null) {
    let url = `${this.baseURL}/recordings?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.makeRequest(url, 'GET');
  }

  async getRecordingById(id) {
    return this.makeRequest(`${this.baseURL}/recordings/${id}`, 'GET');
  }

  async updateRecording(id, notes) {
    return this.makeRequest(`${this.baseURL}/recordings/${id}`, 'PUT', { notes });
  }

  async deleteRecording(id) {
    return this.makeRequest(`${this.baseURL}/recordings/${id}`, 'DELETE');
  }

  async getRecordingStats() {
    return this.makeRequest(`${this.baseURL}/recordings/stats`, 'GET');
  }

  // ==================== PREDICTIONS ====================

  async submitForAnalysis(recordingId) {
    return this.makeRequest(`${this.baseURL}/predictions/analyze`, 'POST', { recordingId });
  }

  async getPredictions(page = 1, limit = 10, condition = null) {
    let url = `${this.baseURL}/predictions?page=${page}&limit=${limit}`;
    if (condition) url += `&condition=${condition}`;
    return this.makeRequest(url, 'GET');
  }

  async getPredictionById(id) {
    return this.makeRequest(`${this.baseURL}/predictions/${id}`, 'GET');
  }

  async getPredictionStats() {
    return this.makeRequest(`${this.baseURL}/predictions/stats`, 'GET');
  }

  async sharePrediction(id, userId) {
    return this.makeRequest(`${this.baseURL}/predictions/${id}/share`, 'POST', { userId });
  }

  // ==================== EVALUATION ====================

  async generateEvaluationReport(startDate = null, endDate = null, format = 'detailed') {
    return this.makeRequest(`${this.baseURL}/evaluation/report`, 'POST', {
      startDate,
      endDate,
      reportFormat: format,
    });
  }

  async getEvaluationStats(period = '7d') {
    return this.makeRequest(`${this.baseURL}/evaluation/stats?period=${period}`, 'GET');
  }

  async getTrendAnalysis() {
    return this.makeRequest(`${this.baseURL}/evaluation/trends`, 'GET');
  }

  // ==================== HELPER METHODS ====================

  async makeRequest(url, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: this.getAuthHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      let response = await fetch(url, options);

      // Handle token expiration
      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed.success) {
          options.headers = this.getAuthHeaders();
          response = await fetch(url, options);
        } else {
          this.logout();
          window.location.href = '/login';
          return { success: false, message: 'Unauthorized' };
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token || ''}`,
    };
  }

  saveTokens(tokens) {
    if (tokens.accessToken) {
      this.token = tokens.accessToken;
      localStorage.setItem('accessToken', tokens.accessToken);
    }
    if (tokens.refreshToken) {
      this.refreshToken = tokens.refreshToken;
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;
