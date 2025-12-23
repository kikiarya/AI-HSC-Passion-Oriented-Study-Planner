import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * POST /api/student/selected-subjects
 * Add a single selected HSC subject
 */
export const addSelectedSubject = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject_code, subject_name, category, reasoning } = req.body;
    
    if (!subject_code || !subject_name) {
      return ErrorResponse.badRequest('subject_code and subject_name are required').send(res);
    }
    
    console.log(`[addSelectedSubject] Adding subject ${subject_name} for student_id: ${studentId}`);
    
    const supabase = getSupabaseClient();
    
    // Check if subject already exists
    const { data: existing, error: checkError } = await supabase
      .from('selected_subjects')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject_code', subject_code)
      .eq('subject_name', subject_name)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing subject:', checkError);
      return ErrorResponse.internalServerError('Failed to check existing selections').send(res);
    }
    
    if (existing) {
      console.log(`[addSelectedSubject] Subject ${subject_name} already selected by student ${studentId}`);
      return res.status(400).json({
        success: false,
        error: `You have already selected "${subject_name}"`
      });
    }
    
    // Insert new selection
    const insertData = {
      student_id: studentId,
      subject_code: subject_code,
      subject_name: subject_name,
      category: category || null,
      reasoning: reasoning || null,
      selected_at: new Date().toISOString()
    };
    
    const { data, error: insertError } = await supabase
      .from('selected_subjects')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting selected subject:', insertError);
      // Check if it's a unique constraint violation
      if (insertError.code === '23505') {
        return res.status(400).json({
          success: false,
          error: `You have already selected "${subject_name}"`
        });
      }
      return ErrorResponse.internalServerError('Failed to save selected subject').send(res);
    }
    
    console.log(`[addSelectedSubject] Successfully added subject ${subject_name} for student ${studentId}`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully added "${subject_name}"`,
      data: data
    });
    
  } catch (error) {
    console.error('Unexpected error in addSelectedSubject:', error);
    return ErrorResponse.internalServerError('An unexpected error occurred').send(res);
  }
};

/**
 * GET /api/student/selected-subjects
 * Get student's selected HSC subjects
 */
export const getSelectedSubjects = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();
    
    console.log(`[getSelectedSubjects] Fetching selected subjects for student_id: ${studentId}`);
    
    const { data: selectedSubjects, error } = await supabase
      .from('selected_subjects')
      .select('*')
      .eq('student_id', studentId)
      .order('selected_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching selected subjects:', error);
      return ErrorResponse.internalServerError('Failed to fetch selected subjects').send(res);
    }
    
    console.log(`[getSelectedSubjects] Found ${selectedSubjects?.length || 0} selected subjects for student ${studentId}`);
    
    return res.status(200).json({
      success: true,
      subjects: selectedSubjects || []
    });
    
  } catch (error) {
    console.error('Unexpected error in getSelectedSubjects:', error);
    return ErrorResponse.internalServerError('An unexpected error occurred').send(res);
  }
};

/**
 * DELETE /api/student/selected-subjects/:id
 * Delete a specific selected subject
 */
export const deleteSelectedSubject = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;
    
    if (!id) {
      return ErrorResponse.badRequest('Subject ID is required').send(res);
    }
    
    const supabase = getSupabaseClient();
    
    console.log(`[deleteSelectedSubject] Deleting subject ${id} for student_id: ${studentId}`);
    
    const { error } = await supabase
      .from('selected_subjects')
      .delete()
      .eq('id', id)
      .eq('student_id', studentId);
    
    if (error) {
      console.error('Error deleting selected subject:', error);
      return ErrorResponse.internalServerError('Failed to delete selected subject').send(res);
    }
    
    console.log(`[deleteSelectedSubject] Successfully deleted subject ${id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Selected subject deleted successfully'
    });
    
  } catch (error) {
    console.error('Unexpected error in deleteSelectedSubject:', error);
    return ErrorResponse.internalServerError('An unexpected error occurred').send(res);
  }
};

