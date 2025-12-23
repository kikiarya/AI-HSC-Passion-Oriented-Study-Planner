import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/parent/children
 * Get all children associated with a parent
 */
export const getParentChildren = async (req, res) => {
  try {
    const parentId = req.user.id;
    const supabase = getSupabaseClient();
    
    // Get all guardianships for this parent
    const { data: guardianships, error: guardianError } = await supabase
      .from('guardianships')
      .select(`
        student_id,
        relationship,
        created_at,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('parent_id', parentId);
    
    console.log('Guardianships:', guardianships);
    console.log('Parent ID:', parentId);
    if (guardianError) {
      console.error('Error fetching children:', guardianError);
      return ErrorResponse.internalServerError('Failed to fetch children').send(res);
    }
    
    // Get student details for each child
    const children = (guardianships || []).map(g => ({
      student_id: g.student_id,
      relationship: g.relationship || 'Child',
      first_name: g.student?.first_name || '',
      last_name: g.student?.last_name || '',
      full_name: `${g.student?.first_name || ''} ${g.student?.last_name || ''}`.trim(),
      email: g.student?.email || '',
      added_at: g.created_at
    }));
    
    return res.json({
      success: true,
      children: children
    });
  } catch (err) {
    console.error('Get parent children error:', err);
    return ErrorResponse.internalServerError('Failed to fetch children').send(res);
  }
};
