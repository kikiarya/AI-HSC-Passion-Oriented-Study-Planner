// API Base URL - adjust this based on your environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Auth service to handle all authentication-related API calls
 */
class AuthService {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (student or teacher)
   * @returns {Promise<Object>} User data and session
   */
  async login(email, password, role) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store session data in localStorage
      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data and session
   */
  async signup(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store session data in localStorage if available
      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call logout endpoint (optional, as we're clearing local storage)
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Get current user from localStorage
   * @returns {Object|null} User data
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get access token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Check if current user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Check if user has the role directly
    if (user.role === role) return true;
    
    // Check if user has the role in the roles array
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.includes(role);
    }
    
    return false;
  }

  /**
   * Make an authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async authenticatedRequest(endpoint, options = {}) {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server error: Expected JSON but got ${contentType || 'unknown type'}. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      // If unauthorized, clear session
      if (response.status === 401) {
        this.logout();
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    return this.authenticatedRequest('/profile', {
      method: 'GET'
    });
  }

  /**
   * Update current user profile
   * @param {Object} payload - fields to update: { first_name, last_name, avatar }
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(payload) {
    return this.authenticatedRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Request password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Response message
   */
  async requestPasswordReset(email) {
    const response = await fetch(`${API_BASE_URL}/auth/reset/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to request password reset');
    }

    return data;
  }

  /**
   * Confirm password reset with token
   * @param {string} token - Reset token from email
   * @param {string} password - New password
   * @returns {Promise<Object>} Response message
   */
  async confirmPasswordReset(token, password) {
    const response = await fetch(`${API_BASE_URL}/auth/reset/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    return data;
  }

  /**
   * Change password when logged in
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response message
   */
  async changePassword(currentPassword, newPassword) {
    return this.authenticatedRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
  
}

// Export a singleton instance
const authService = new AuthService();
export default authService;

