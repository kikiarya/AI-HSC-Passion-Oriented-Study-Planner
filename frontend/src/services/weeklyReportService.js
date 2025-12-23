import authService from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Generate weekly report for a student
 * @param {Object} params - Weekly report parameters
 * @param {string} params.student_id - Student ID (UUID, optional if authenticated as student)
 * @param {string} params.report_week_start - Week start date (YYYY-MM-DD)
 * @param {string} params.report_week_end - Week end date (YYYY-MM-DD)
 * @param {string} params.model - OpenAI model (optional, default: 'gpt-4.1-nano')
 * @param {boolean} params.useStudentEndpoint - Use student endpoint instead of ai-agent (default: true)
 * @returns {Promise<Object>} Weekly report data
 */
export async function generateWeeklyReport({ 
  student_id, 
  report_week_start, 
  report_week_end, 
  model = 'gpt-4.1-nano',
  send_email,
  email
}) {
  try {
    // Use student endpoint if authenticated, otherwise use ai-agent endpoint
    const endpoint = '/ai-agent/weekly-report';
    
    const response = await authService.authenticatedRequest(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify({
          ...(student_id && { student_id }),
          report_week_start,
          report_week_end,
          model,
          ...(typeof send_email !== 'undefined' ? { send_email } : {}),
          ...(email ? { email } : {})
        })
      }
    );

    if (!response || !response.data || !response.data.weekly_report) {
      throw new Error('Invalid response from weekly report API');
    }

    return response.data.weekly_report;
  } catch (error) {
    console.error('Generate weekly report error:', error);
    throw new Error(error.message || 'Failed to generate weekly report');
  }
}

/**
 * Generate and email weekly report in one call
 * Returns full API response including email status
 */
export async function emailWeeklyReport({ 
  student_id, 
  report_week_start, 
  report_week_end, 
  model = 'gpt-4.1-nano',
  email
}) {
  try {
    const endpoint = '/ai-agent/weekly-report';

    const response = await authService.authenticatedRequest(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify({
          ...(student_id && { student_id }),
          report_week_start,
          report_week_end,
          model,
          send_email: true,
          ...(email ? { email } : {})
        })
      }
    );

    return response;
  } catch (error) {
    console.error('Email weekly report error:', error);
    throw new Error(error.message || 'Failed to email weekly report');
  }
}

/**
 * Transform API response to component format
 * Maps the API response structure to what the component expects
 */
export function transformWeeklyReport(apiReport) {
  if (!apiReport) return null;

  // Transform top_3_focus_areas_next_week to topFocusAreas
  const topFocusAreas = apiReport.top_3_focus_areas_next_week?.map((focus, index) => {
    // Parse focus area string to extract subject, priority, reason, recommendation
    // If it's just a string, create a structured object
    if (typeof focus === 'string') {
      // Try to extract subject name if format is "Subject: description"
      const parts = focus.split(':');
      const subjectName = parts.length > 1 ? parts[0].trim() : `Focus Area ${index + 1}`;
      const description = parts.length > 1 ? parts.slice(1).join(':').trim() : focus;
      
      return {
        subject: subjectName,
        priority: index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low',
        reason: description,
        recommendation: `Focus on ${description} this week`
      };
    }
    // If it's already an object, ensure it has all required fields
    return {
      subject: focus.subject || `Focus Area ${index + 1}`,
      priority: focus.priority || (index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'),
      reason: focus.reason || focus.description || '',
      recommendation: focus.recommendation || `Focus on ${focus.subject || 'this area'} this week`
    };
  }) || [];

  // Transform study_time_summary to studySummary
  const studyTimeSummaryData = apiReport.study_time_summary || {};
  const studySummary = {
    totalHours: studyTimeSummaryData.total_study_hours || 0,
    averageSession: studyTimeSummaryData.average_daily_hours || 0,
    targetHours: (studyTimeSummaryData.average_daily_hours || 0) * 7, // Estimate target from average daily
    completionRate: studyTimeSummaryData.total_study_hours 
      ? Math.round((studyTimeSummaryData.total_study_hours / ((studyTimeSummaryData.average_daily_hours || 1) * 7)) * 100)
      : 0,
    recommendation: apiReport.weekly_insight?.recommendation || 'Continue maintaining your study schedule'
  };

  // Transform courses to subjects
  const subjects = (apiReport.courses || []).map((course, index) => {
    const timeBySubject = studyTimeSummaryData.time_by_subject?.find(
      ts => ts.subject === course.course_name
    );
    
    return {
      name: course.course_name,
      studyTime: timeBySubject?.hours || 0,
      sessions: parseInt(course.attendance?.split('/')[0] || '0') || 0,
      lastStudied: new Date().toISOString(), // API doesn't provide this, use current date
      progress: Math.round((course.weekly_progress || 0) * 100),
      topics: course.topics || [], // API doesn't provide topics breakdown, default to empty array
      grade: course.weekly_score || null,
      teacher: course.teacher_name,
      attendance: course.attendance,
      feedback: course.feedback
    };
  });

  // Transform insights from weekly_insight and ai_analysis
  const insights = [];
  if (apiReport.weekly_insight) {
    insights.push({
      type: 'info',
      title: 'Weekly Summary',
      message: apiReport.weekly_insight.summary || ''
    });
    if (apiReport.weekly_insight.highlight) {
      insights.push({
        type: 'info',
        title: 'Key Achievement',
        message: apiReport.weekly_insight.highlight
      });
    }
  }
  if (apiReport.ai_analysis?.strengths?.length > 0) {
    insights.push({
      type: 'info',
      title: 'Strengths',
      message: apiReport.ai_analysis.strengths.join(', ')
    });
  }
  if (apiReport.ai_analysis?.areas_for_improvement?.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Areas for Improvement',
      message: apiReport.ai_analysis.areas_for_improvement.join(', ')
    });
  }

  // Transform grade history from database
  const gradeHistory = (apiReport.grade_history || []).map(grade => ({
    grade_id: grade.grade_id,
    course_name: grade.course_name,
    assessment: grade.assessment,
    score: grade.score,
    max_score: grade.max_score,
    grade: grade.grade,
    feedback: grade.feedback,
    created_at: grade.created_at,
    percentage: grade.max_score ? Math.round((grade.score / grade.max_score) * 100) : null
  }));

  // Map study time summary to studyTimeSummary for parent view
  const studyTimeSummary = (studyTimeSummaryData.time_by_subject || []).map(item => ({
    subject: item.subject,
    hours: item.hours
  }));

  // Map assignments for parent view
  const assignmentsCompletedThisWeek = (apiReport.assignments?.completed_this_week || []).length;
  
  // Map overall summary for parent view
  const overallSummary = {
    studyHours: studyTimeSummaryData.total_study_hours || 0,
    assignmentsCompleted: assignmentsCompletedThisWeek,
    averageGrade: apiReport.summary?.average_score || null,
    attendance: apiReport.summary?.attendance_rate ? `${apiReport.summary.attendance_rate}%` : null
  };

  // Map strengths and weaknesses from ai_analysis
  const strengths = apiReport.ai_analysis?.strengths || [];
  const weaknesses = apiReport.ai_analysis?.areas_for_improvement || [];
  const behaviorNotes = apiReport.weekly_insight?.summary || '';
  const recommendations = [
    ...(apiReport.weekly_insight?.recommendation ? [apiReport.weekly_insight.recommendation] : []),
    ...(topFocusAreas.slice(0, 3).map(focus => 
      typeof focus === 'string' ? focus : focus.recommendation || focus.reason
    ))
  ];

  return {
    week: `${apiReport.report_week_start} to ${apiReport.report_week_end}`,
    studentName: apiReport.student_name,
    studentId: apiReport.student_id,
    yearLevel: apiReport.year_level,
    topFocusAreas,
    studySummary,
    insights,
    subjects,
    gradeHistory,
    generatedAt: apiReport.generated_at || new Date().toISOString(),
    summary: apiReport.summary || {},
    // Parent-specific fields
    overallSummary,
    studyTimeSummary,
    strengths,
    weaknesses,
    behaviorNotes,
    recommendations,
    // Keep original API response for reference
    _original: apiReport
  };
}

export default {
  generateWeeklyReport,
  transformWeeklyReport,
  emailWeeklyReport
};

