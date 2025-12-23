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
        window.location.href = '/login/student';
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
 * Student API service
 */
const studentApi = {
  // Announcements
  async getAnnouncements() {
    return authenticatedRequest('/student/announcements', {
      method: 'GET'
    });
  },

  // Classes
  // Get all classes the student is enrolled in from the backend API
  // JWT token is automatically passed in Authorization header
  async getClasses() {
    return authenticatedRequest('/student/classes', {
      method: 'GET'
    });
  },

  // HSC Subjects
  // Get all HSC subjects from the database
  async getHSCSubjects() {
    return authenticatedRequest('/student/hsc-subjects', {
      method: 'GET'
    
    });
  },
  // Assignments
  // Get all assignments for student's enrolled classes
  // JWT token is automatically passed in Authorization header
  async getAssignments(options = {}) {
    const upcoming = typeof options === 'boolean' ? options : options.upcoming;
    const qs = upcoming ? `?upcoming=${encodeURIComponent(upcoming)}` : '';
    return authenticatedRequest(`/student/assignments${qs}`, {
      method: 'GET'
    });
  },

  // Get detailed information for a specific assignment
  async getAssignmentDetail(assignmentId) {
    return authenticatedRequest(`/student/assignments/${assignmentId}`, {
      method: 'GET'
    });
  },

  // Submit an assignment
  async submitAssignment(assignmentId, submissionData) {
    return authenticatedRequest(`/student/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData)
    });
  },

  // Grades
  // Get all grades for student
  // JWT token is automatically passed in Authorization header
  async getGrades() {
    return authenticatedRequest('/student/grades', {
      method: 'GET'
    });
  },

  // Selected Subjects
  // Add a single selected HSC subject
  // JWT token is automatically passed in Authorization header
  async addSelectedSubject(data) {
    return authenticatedRequest('/student/selected-subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get student's selected HSC subjects
  async getSelectedSubjects() {
    return authenticatedRequest('/student/selected-subjects', {
      method: 'GET'
    });
  },

  // Delete a specific selected subject
  async deleteSelectedSubject(subjectId) {
    return authenticatedRequest(`/student/selected-subjects/${subjectId}`, {
      method: 'DELETE'
    });
  },

  // Practice Questions
  // Generate AI practice questions based on selected subjects
  async generatePracticeQuestions() {
    return authenticatedRequest('/student/practice-questions/generate', {
      method: 'POST'
    });
  },

  // Get practice question stats
  async getPracticeStats() {
    return authenticatedRequest('/student/practice-questions/stats', {
      method: 'GET'
    });
  },

  // Review Questions
  // Get practice questions for review
  async getReviewQuestions() {
    return authenticatedRequest('/student/review-questions', {
      method: 'GET'
    });
  },

  // Get review statistics
  async getReviewStats() {
    return authenticatedRequest('/student/review-questions/stats', {
      method: 'GET'
    });
  },

  // Practice Answers
  // Get all practice questions for answering
  async getPracticeQuestions() {
    return authenticatedRequest('/student/practice-answers/questions', {
      method: 'GET'
    });
  },

  // Submit practice answer
  async submitPracticeAnswer(data) {
    return authenticatedRequest('/student/practice-answers/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },


  // Modules
  async getClassModules(classId) {
    return authenticatedRequest(`/student/classes/${classId}/modules`, {
      method: 'GET'
    });
  },
  async getModule(moduleId) {
    return authenticatedRequest(`/student/modules/${moduleId}`, {
      method: 'GET'
    });
  },

  // Knowledge Gaps
  async analyzeKnowledgeGaps() {
    return authenticatedRequest('/student/knowledge-gaps/analyze', {
      method: 'POST'
    });
  },
  async getKnowledgeGapsStats() {
    return authenticatedRequest('/student/knowledge-gaps/stats', {
      method: 'GET'
    });
  }

};

export default studentApi;
