import authService from './authService.js';

/**
 * Generate AI-powered study plan
 * @param {Object} params - Study plan parameters
 * @param {string[]} params.subjects - List of subjects
 * @param {Object} params.exam_dates - Exam dates by subject
 * @param {number} params.available_hours_per_week - Available study hours per week
 * @param {Object} params.preferences - Learning preferences
 * @returns {Promise<Object>} Study plan data
 */
export async function generateStudyPlan({
  subjects,
  exam_dates,
  available_hours_per_week,
  preferences
}) {
  try {
    const response = await authService.authenticatedRequest(
      '/student/study-plan/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          subjects,
          exam_dates,
          available_hours_per_week,
          preferences
        })
      }
    );

    if (!response || !response.study_plan) {
      throw new Error('Invalid response from study plan API');
    }

    return response;
  } catch (error) {
    console.error('Generate study plan error:', error);
    throw new Error(error.message || 'Failed to generate study plan');
  }
}

/**
 * Save study plan preferences
 * @param {Object} preferences - User study preferences
 * @returns {Promise<Object>} Response data
 */
export async function saveStudyPlanPreferences(preferences) {
  try {
    const response = await authService.authenticatedRequest(
      '/student/study-plan/preferences',
      {
        method: 'POST',
        body: JSON.stringify({ preferences })
      }
    );

    return response;
  } catch (error) {
    console.error('Save preferences error:', error);
    throw new Error(error.message || 'Failed to save preferences');
  }
}

/**
 * Get saved study plan preferences
 * @returns {Promise<Object>} User preferences
 */
export async function getStudyPlanPreferences() {
  try {
    const response = await authService.authenticatedRequest(
      '/student/study-plan/preferences',
      {
        method: 'GET'
      }
    );

    return response.preferences || {};
  } catch (error) {
    console.error('Get preferences error:', error);
    return {}; // Return empty object if preferences not found
  }
}

export default {
  generateStudyPlan,
  saveStudyPlanPreferences,
  getStudyPlanPreferences
};

