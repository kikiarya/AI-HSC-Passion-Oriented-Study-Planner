import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/student/hsc-subjects
 * Get all HSC subjects from database
 */
export const getHSCSubjects = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    
    // Fetch all HSC subjects from database
    const { data: subjects, error } = await supabase
      .from('hsc_subjects')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching HSC subjects:', error);
      return ErrorResponse.internalServerError('Failed to fetch HSC subjects').send(res);
    }
    
    // Transform database fields (snake_case) to frontend format (camelCase)
    const transformedSubjects = (subjects || []).map(subject => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      category: subject.category,
      units: subject.units,
      difficulty: subject.difficulty,
      popularity: subject.popularity || 0,
      // Transform array fields - handle both JSONB and array formats
      prerequisites: Array.isArray(subject.prerequisites) 
        ? subject.prerequisites 
        : (typeof subject.prerequisites === 'string' 
            ? JSON.parse(subject.prerequisites || '[]') 
            : []),
      careerPaths: Array.isArray(subject.career_paths)
        ? subject.career_paths
        : (typeof subject.career_paths === 'string'
            ? JSON.parse(subject.career_paths || '[]')
            : []),
      recommendedFor: Array.isArray(subject.recommended_for)
        ? subject.recommended_for
        : (typeof subject.recommended_for === 'string'
            ? JSON.parse(subject.recommended_for || '[]')
            : []),
      atarContribution: subject.atar_contribution || subject.atarContribution || 'Medium',
      examType: subject.exam_type || subject.examType || 'Written',
      practicalWork: subject.practical_work || subject.practicalWork || 'None',
      description: subject.description || '',
      created_at: subject.created_at,
      updated_at: subject.updated_at
    }));
    
    return res.json({
      success: true,
      subjects: transformedSubjects
    });
  } catch (err) {
    console.error('Get HSC subjects error:', err);
    return ErrorResponse.internalServerError('Failed to fetch HSC subjects').send(res);
  }
};
