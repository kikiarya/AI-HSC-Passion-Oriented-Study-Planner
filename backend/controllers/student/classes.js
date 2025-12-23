import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/student/classes
 * Get all classes the student is enrolled in with detailed information
 */
export const getStudentClasses = async (req, res) => {
  try {
    // Get student_id (user_id) from JWT token
    // req.user is set by verifyAuth middleware after validating the JWT token
    // req.user.id contains the user_id from the token
    const studentId = req.user.id;
    
    if (!studentId) {
      return ErrorResponse.unauthorized('Student ID (user_id) not found in JWT token').send(res);
    }

    const supabase = getSupabaseClient();

    // Get all enrollments for this student from the enrollments table
    // student_id = user_id from JWT token
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        class_id,
        progress,
        enrolled_at,
        classes (
          id,
          code,
          name,
          description,
          color,
          location,
          teacher,
          created_at
        )
      `)
      .eq('student_id', studentId); // Query enrollments table using student_id = user_id from JWT token

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      console.error(`Failed to fetch enrollments for student_id: ${studentId}`);
      return ErrorResponse.internalServerError('Failed to fetch student enrollments').send(res);
    }

    // If student is not enrolled in any classes, return empty array
    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({ classes: [] });
    }

    // Enrich each class with additional information
    const enrichedClasses = await Promise.all(enrollments.map(async (enrollment) => {
      const classData = enrollment.classes;
      const classId = classData.id;

      // Get assignment count for this class
      const { count: assignmentCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      // Get student's submissions for this class
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('class_id', classId);

      const assignmentIds = assignments?.map(a => a.id) || [];

      // Get student's grades for this class
      let studentAvgGrade = null;
      let completedAssignments = 0;
      let pendingAssignments = 0;

      if (assignmentIds.length > 0) {
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('grade, assignment_id, status')
          .eq('student_id', studentId)
          .in('assignment_id', assignmentIds);

        // Calculate average grade from graded submissions
        const gradedSubmissions = submissions?.filter(s => s.grade !== null && s.grade !== undefined) || [];
        if (gradedSubmissions.length > 0) {
          const total = gradedSubmissions.reduce((sum, s) => sum + (parseFloat(s.grade) || 0), 0);
          studentAvgGrade = Math.round(total / gradedSubmissions.length);
        }

        // Count completed and pending assignments
        const submittedAssignmentIds = new Set(submissions?.map(s => s.assignment_id) || []);
        completedAssignments = submittedAssignmentIds.size;
        pendingAssignments = assignmentIds.length - completedAssignments;
      }

      // Get upcoming assignments count (due in the future)
      const now = new Date().toISOString();
      const { count: upcomingCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'published')
        .gte('due_date', now.split('T')[0]); // Due date is today or in the future

      // Get teacher information for this class
      const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select(`
          profile_id,
          role_in_class,
          profiles (
            id,
            first_name,
            last_name,
            name,
            email,
            avatar
          )
        `)
        .eq('class_id', classId)
        .limit(1); // Get primary teacher

      const teacher = classTeachers?.[0]?.profiles || null;
      const teacherName = teacher
        ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.name || classData.teacher
        : classData.teacher || 'TBA';

      return {
        id: classData.id,
        code: classData.code,
        name: classData.name,
        progress: enrollment.progress || 0,
        description: classData.description || '',
        color: classData.color || '#667eea',
        location: classData.location || '',
        subject: classData.subject || '',
        teacher: teacherName,
        teacherInfo: teacher ? {
          id: teacher.id,
          name: teacherName,
          email: teacher.email,
          avatar: teacher.avatar
        } : null,
        enrolledAt: enrollment.enrolled_at || enrollment.classes?.created_at,
        assignmentCount: assignmentCount || 0,
        upcomingAssignments: upcomingCount || 0,
        completedAssignments,
        pendingAssignments,
        studentAvgGrade: studentAvgGrade !== null ? `${studentAvgGrade}%` : 'N/A',
        createdAt: classData.created_at,
      };
    }));

    res.status(200).json({ classes: enrichedClasses });
  } catch (err) {
    console.error('Error in getStudentClasses:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching student classes').send(res);
  }
};

