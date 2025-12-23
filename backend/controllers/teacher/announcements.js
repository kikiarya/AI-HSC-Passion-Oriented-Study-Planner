import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/teacher/announcements
 * Get all announcements created by the teacher
 */
export const getAnnouncements = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId } = req.query; // Optional filter by class
    const supabase = getSupabaseClient();

    let query = supabase
      .from('class_announcements')
      .select(`
        *,
        classes (
          id,
          name,
          code
        )
      `)
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false });

    // Filter by class if provided
    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data: announcements, error: announceError } = await query;

    if (announceError) {
      console.error('Error fetching announcements:', announceError);
      return ErrorResponse.internalServerError('Failed to fetch announcements').send(res);
    }

    const enrichedAnnouncements = announcements.map(announcement => ({
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
      // Add view statistics if available
      viewCount: announcement.view_count || 0,
    }));

    res.status(200).json({ announcements: enrichedAnnouncements });
  } catch (err) {
    console.error('Error in getAnnouncements:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching announcements').send(res);
  }
};

/**
 * POST /api/teacher/announcements
 * Create a new announcement
 */
export const createAnnouncement = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId, title, content } = req.body;

    const supabase = getSupabaseClient();

    // Validate required fields
    if (!title || !content || !classId) {
      return ErrorResponse.badRequest('Missing required fields: title, content, classId').send(res);
    }

    // Verify teacher has access to this class
    const { data: access, error: accessError } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('profile_id', teacherId)
      .eq('class_id', classId)
      .single();

    if (accessError || !access) {
      return ErrorResponse.forbidden('You do not have access to this class').send(res);
    }

    // Create announcement
    const { data: announcement, error: createError } = await supabase
      .from('class_announcements')
      .insert([{
        class_id: classId,
        title,
        content,
        created_by: teacherId,
        view_count: 0,
      }])
      .select(`
        *,
        classes (
          id,
          name,
          code
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating announcement:', createError);
      return ErrorResponse.internalServerError('Failed to create announcement').send(res);
    }

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        classId: announcement.class_id,
        className: announcement.classes?.name,
        classCode: announcement.classes?.code,
        createdAt: announcement.created_at,
        created_at: announcement.created_at,  // Also include snake_case for compatibility
      }
    });
  } catch (err) {
    console.error('Error in createAnnouncement:', err);
    return ErrorResponse.internalServerError('An error occurred while creating announcement').send(res);
  }
};

/**
 * PUT /api/teacher/announcements/:id
 * Update an existing announcement
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: announcementId } = req.params;
    const { title, content } = req.body;

    const supabase = getSupabaseClient();

    // Get announcement to verify ownership
    const { data: announcement, error: fetchError } = await supabase
      .from('class_announcements')
      .select('created_by, class_id')
      .eq('id', announcementId)
      .single();

    if (fetchError || !announcement) {
      return ErrorResponse.notFound('Announcement not found').send(res);
    }

    // Verify ownership
    if (announcement.created_by !== teacherId) {
      return ErrorResponse.forbidden('You do not have permission to update this announcement').send(res);
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updateData.title = title;
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    // Update announcement
    const { data: updated, error: updateError } = await supabase
      .from('class_announcements')
      .update(updateData)
      .eq('id', announcementId)
      .select(`
        *,
        classes (
          id,
          name,
          code
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating announcement:', updateError);
      return ErrorResponse.internalServerError('Failed to update announcement').send(res);
    }

    res.status(200).json({
      message: 'Announcement updated successfully',
      announcement: {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        classId: updated.class_id,
        className: updated.classes?.name,
        classCode: updated.classes?.code,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      }
    });
  } catch (err) {
    console.error('Error in updateAnnouncement:', err);
    return ErrorResponse.internalServerError('An error occurred while updating announcement').send(res);
  }
};

/**
 * DELETE /api/teacher/announcements/:id
 * Delete an announcement
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: announcementId } = req.params;

    const supabase = getSupabaseClient();

    // Get announcement to verify ownership
    const { data: announcement, error: fetchError } = await supabase
      .from('class_announcements')
      .select('created_by')
      .eq('id', announcementId)
      .single();

    if (fetchError || !announcement) {
      return ErrorResponse.notFound('Announcement not found').send(res);
    }

    // Verify ownership
    if (announcement.created_by !== teacherId) {
      return ErrorResponse.forbidden('You do not have permission to delete this announcement').send(res);
    }

    // Delete announcement
    const { error: deleteError } = await supabase
      .from('class_announcements')
      .delete()
      .eq('id', announcementId);

    if (deleteError) {
      console.error('Error deleting announcement:', deleteError);
      return ErrorResponse.internalServerError('Failed to delete announcement').send(res);
    }

    res.status(200).json({
      message: 'Announcement deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteAnnouncement:', err);
    return ErrorResponse.internalServerError('An error occurred while deleting announcement').send(res);
  }
};


