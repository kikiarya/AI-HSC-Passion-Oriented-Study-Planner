import { getSupabaseClient } from '../clients/supabaseClient.js';
import { ErrorResponse } from '../utils/errorResponse.js';

export const getTertiaryCoursesSubjectsMapping = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tertiary_courses_subjects_mapping')
      .select('*');

    if (error) {
      console.error('Supabase query error:', error);
      return ErrorResponse.internalServerError('Failed to fetch tertiary courses subjects mapping').send(res);
    }

    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('Tertiary courses subjects mapping error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};
