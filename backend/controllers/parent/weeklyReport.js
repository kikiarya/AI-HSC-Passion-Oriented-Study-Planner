import { createWeeklyReport } from '../../controllers/weeklyReport.js';
import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/parent/children/:student_id/weekly-report
 * Get weekly report for a specific child (with parent verification)
 * Query params: report_week_start, report_week_end, model, email (optional), send_email (optional)
 */
export const getChildWeeklyReport = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { student_id } = req.params;
    const { report_week_start, report_week_end, model, email, send_email } = req.query;
    
    // Verify parent has access to this student
    const supabase = getSupabaseClient();
    const { data: guardianship, error: guardianError } = await supabase
      .from('guardianships')
      .select('parent_id, student_id')
      .eq('parent_id', parentId)
      .eq('student_id', student_id)
      .single();
    
    if (guardianError || !guardianship) {
      console.error('Parent access verification error:', guardianError);
      return ErrorResponse.forbidden('You do not have access to view this student\'s reports').send(res);
    }
    
    // Create a modified request object to pass student_id to createWeeklyReport
    req.body = {
      student_id: student_id,
      report_week_start: report_week_start,
      report_week_end: report_week_end,
      model: model || 'gpt-5',
      email: email || null,
      send_email: send_email === 'true' || send_email === true
    };
    
    // Call the existing createWeeklyReport function
    return createWeeklyReport(req, res);
  } catch (err) {
    console.error('Get child weekly report error:', err);
    return ErrorResponse.internalServerError('Failed to fetch child weekly report').send(res);
  }
};
