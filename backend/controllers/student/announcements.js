import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/student/announcements
 * Get all announcements for student's enrolled classes
 */
export const getStudentAnnouncements = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();

    // First, get all classes the student is enrolled in
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', studentId);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return ErrorResponse.internalServerError('Failed to fetch student enrollments').send(res);
    }

    // If student is not enrolled in any classes, return empty array
    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({ announcements: [] });
    }

    // Extract class IDs
    const classIds = enrollments.map(e => e.class_id);

    // Get all announcements for these classes
    const { data: announcements, error: announceError } = await supabase
      .from('class_announcements')
      .select(`
        *,
        classes (
          id,
          name,
          code
        )
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false });

    if (announceError) {
      console.error('Error fetching announcements:', announceError);
      return ErrorResponse.internalServerError('Failed to fetch announcements').send(res);
    }

    // Format announcements for frontend
    const enrichedAnnouncements = (announcements || []).map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      classId: announcement.class_id,
      className: announcement.classes?.name || 'Unknown',
      classCode: announcement.classes?.code || '',
      createdAt: announcement.created_at,
      created_at: announcement.created_at,  // Also include snake_case for compatibility
      updatedAt: announcement.updated_at,
      updated_at: announcement.updated_at,  // Also include snake_case for compatibility
      viewCount: announcement.view_count || 0,
    }));

    res.status(200).json({ announcements: enrichedAnnouncements });
  } catch (err) {
    console.error('Error in getStudentAnnouncements:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching announcements').send(res);
  }
};

