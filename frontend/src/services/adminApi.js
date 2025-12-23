// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Get access token from localStorage
 */
const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Make an authenticated API request
 */
const authenticatedRequest = async (endpoint, options = {}) => {
  const token = getAccessToken();
  
  if (!token) {
    console.error('No access token found in localStorage');
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making API request to: ${url}`);
  console.log('Request options:', { method: options.method || 'GET', headers: options.headers });

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      throw new Error(`Server error: ${text.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Unauthorized - clearing session');
        // Clear session on unauthorized
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login/admin';
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Failed to connect to server'}`);
  }
};

/**
 * Admin API service
 */
const adminApi = {
  /**
   * Get all students
   */
  async getStudents() {
    return authenticatedRequest('/admin/students', {
      method: 'GET'
    });
  },

  /**
   * Create a student account
   */
  async createStudent(studentData) {
    return authenticatedRequest('/admin/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  },

  /**
   * Get all teachers
   */
  async getTeachers() {
    return authenticatedRequest('/admin/teachers', {
      method: 'GET'
    });
  },

  /**
   * Create a teacher account
   */
  async createTeacher(teacherData) {
    return authenticatedRequest('/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData)
    });
  },

  /**
   * Update a user
   */
  async updateUser(userId, userData) {
    return authenticatedRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  /**
   * Delete a user
   */
  async deleteUser(userId) {
    return authenticatedRequest(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Reset user password
   */
  async resetPassword(userId, newPassword) {
    return authenticatedRequest('/admin/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword })
    });
  },
};

export default adminApi;

