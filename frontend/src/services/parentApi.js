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
        window.location.href = '/login/parent';
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
 * Parent API service
 */
const parentApi = {
  // Children
  // Get all children associated with parent
  async getChildren() {
    return authenticatedRequest('/parent/children', {
      method: 'GET'
    });
  },

  // Weekly Reports
  // Get child's weekly report
  async getChildWeeklyReport(student_id, report_week_start, report_week_end, model = 'gpt-5') {
    const params = new URLSearchParams();
    params.append('report_week_start', report_week_start);
    params.append('report_week_end', report_week_end);
    if (model) params.append('model', model);
    
    const queryString = params.toString();
    const endpoint = `/parent/children/${student_id}/weekly-report${queryString ? `?${queryString}` : ''}`;
    
    return authenticatedRequest(endpoint, {
      method: 'GET'
    });
  }
};

export default parentApi;

