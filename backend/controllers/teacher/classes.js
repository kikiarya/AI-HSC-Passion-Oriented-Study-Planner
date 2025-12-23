import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/teacher/classes
 * Get all classes taught by the authenticated teacher
 */
export const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const supabase = getSupabaseClient();

    // Get classes taught by this teacher
    const { data: classTeachers, error: ctError } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('profile_id', teacherId);

    if (ctError) {
      console.error('Error fetching class teachers:', ctError);
      return ErrorResponse.internalServerError('Failed to fetch classes').send(res);
    }

    const classIds = classTeachers.map(ct => ct.class_id);

    if (classIds.length === 0) {
      return res.status(200).json({ classes: [] });
    }

    // Get class details
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        enrollments (
          student_id
        )
      `)
      .in('id', classIds);

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return ErrorResponse.internalServerError('Failed to fetch class details').send(res);
    }

    // For each class, get assignment count and calculate average grade
    const enrichedClasses = await Promise.all(classes.map(async (cls) => {
      // Get assignment count
      const { count: assignmentCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', cls.id);

      // Get student count
      const studentCount = cls.enrollments?.length || 0;

      // Get average grade (simplified - you may want more complex calculation)
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('grade')
        .not('grade', 'is', null)
        .in('assignment_id', 
          (await supabase
            .from('assignments')
            .select('id')
            .eq('class_id', cls.id)
          ).data?.map(a => a.id) || []
        );

      let avgGrade = null;
      if (submissions && submissions.length > 0) {
        const total = submissions.reduce((sum, s) => sum + (parseFloat(s.grade) || 0), 0);
        avgGrade = Math.round(total / submissions.length);
      }

      return {
        id: cls.id,
        code: cls.code,
        name: cls.name,
        description: cls.description,
        color: cls.color || '#667eea',
        studentCount,
        assignmentCount: assignmentCount || 0,
        avgGrade: avgGrade ? `${avgGrade}%` : 'N/A',
        // Include any additional fields from your classes table
      };
    }));

    res.status(200).json({ classes: enrichedClasses });
  } catch (err) {
    console.error('Error in getTeacherClasses:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching classes').send(res);
  }
};

/**
 * GET /api/teacher/classes/:id
 * Get details for a specific class
 */
export const getClassDetails = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: classId } = req.params;
    const supabase = getSupabaseClient();

    // Verify teacher has access to this class
    const { data: access, error: accessError } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('profile_id', teacherId)
      .eq('class_id', classId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle null gracefully

    // If no access record found, return 404 instead of 403
    if (accessError) {
      console.error('Error checking class access:', accessError);
      return ErrorResponse.internalServerError('Failed to verify class access').send(res);
    }

    if (!access) {
      return ErrorResponse.notFound('Class not found or you do not have access').send(res);
    }

    // Get class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('Error fetching class details:', classError);
      return ErrorResponse.internalServerError('Failed to fetch class details').send(res);
    }

    // Get enrollments count
    const { count: studentCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    // Get assignments count
    const { count: assignmentCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    // Get class materials
    const { data: materials } = await supabase
      .from('class_materials')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    // Get class schedule sessions
    const { data: schedule } = await supabase
      .from('class_schedule_sessions')
      .select('*')
      .eq('class_id', classId)
      .order('day_of_week');

    const enrichedClass = {
      ...classData,
      studentCount: studentCount || 0,
      assignmentCount: assignmentCount || 0,
      materials: materials || [],
      schedule: schedule || [],
    };

    res.status(200).json({ class: enrichedClass });
  } catch (err) {
    console.error('Error in getClassDetails:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching class details').send(res);
  }
};

/**
 * GET /api/teacher/classes/:id/students
 * Get roster (list of students) for a specific class
 */
export const getClassStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: classId } = req.params;
    const supabase = getSupabaseClient();

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

    // Get enrolled students
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        profiles (
          id,
          first_name,
          last_name,
          email,
          avatar
        )
      `)
      .eq('class_id', classId);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return ErrorResponse.internalServerError('Failed to fetch class roster').send(res);
    }

    // Enrich student data with grade information
    const students = await Promise.all(enrollments.map(async (enrollment) => {
      const studentId = enrollment.student_id;
      const profile = enrollment.profiles;

      // Get student's grades for this class
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('grade')
        .eq('student_id', studentId)
        .not('grade', 'is', null)
        .in('assignment_id',
          (await supabase
            .from('assignments')
            .select('id')
            .eq('class_id', classId)
          ).data?.map(a => a.id) || []
        );

      let avgGrade = null;
      if (submissions && submissions.length > 0) {
        const total = submissions.reduce((sum, s) => sum + (parseFloat(s.grade) || 0), 0);
        avgGrade = Math.round(total / submissions.length);
      }

      return {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        avatar: profile.avatar,
        enrolledAt: new Date().toISOString(), // Default value since column may not exist
        avgGrade: avgGrade ? `${avgGrade}%` : 'N/A',
      };
    }));

    res.status(200).json({ students });
  } catch (err) {
    console.error('Error in getClassStudents:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching class roster').send(res);
  }
};

/**
 * GET /api/teacher/classes/:id/analytics
 * Get analytics data for a specific class
 */
export const getClassAnalytics = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: classId } = req.params;
    const supabase = getSupabaseClient();

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

    // Get all assignments for this class
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('class_id', classId);

    const assignmentIds = assignments?.map(a => a.id) || [];

    if (assignmentIds.length === 0) {
      return res.status(200).json({
        analytics: {
          averageGrade: null,
          completionRate: 0,
          gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
          totalStudents: 0,
          totalAssignments: 0,
        }
      });
    }

    // Get all submissions for these assignments
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('grade, student_id')
      .in('assignment_id', assignmentIds);

    // Calculate average grade
    const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
    let averageGrade = null;
    if (gradedSubmissions.length > 0) {
      const total = gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.grade), 0);
      averageGrade = Math.round(total / gradedSubmissions.length);
    }

    // Calculate completion rate
    const { count: totalEnrollments } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    const expectedSubmissions = (totalEnrollments || 0) * assignmentIds.length;
    const completionRate = expectedSubmissions > 0
      ? Math.round(((submissions?.length || 0) / expectedSubmissions) * 100)
      : 0;

    // Calculate grade distribution
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradedSubmissions.forEach(s => {
      const grade = parseFloat(s.grade);
      if (grade >= 90) gradeDistribution.A++;
      else if (grade >= 80) gradeDistribution.B++;
      else if (grade >= 70) gradeDistribution.C++;
      else if (grade >= 60) gradeDistribution.D++;
      else gradeDistribution.F++;
    });

    res.status(200).json({
      analytics: {
        averageGrade: averageGrade ? `${averageGrade}%` : 'N/A',
        completionRate: `${completionRate}%`,
        gradeDistribution,
        totalStudents: totalEnrollments || 0,
        totalAssignments: assignmentIds.length,
      }
    });
  } catch (err) {
    console.error('Error in getClassAnalytics:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching class analytics').send(res);
  }
};

/**
 * POST /api/teacher/classes
 * Create a new class
 */
export const createClass = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { code, name, description, color, location } = req.body;
    const supabase = getSupabaseClient();

    // Validate required fields
    if (!code || !name) {
      return ErrorResponse.badRequest('Missing required fields: code and name').send(res);
    }

    // Check if class code already exists
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id')
      .eq('code', code)
      .single();

    if (existingClass) {
      return ErrorResponse.badRequest('Class with this code already exists').send(res);
    }

    // Create the class
    const { data: newClass, error: createError } = await supabase
      .from('classes')
      .insert([{
        code,
        name,
        description: description || '',
        color: color || '#667eea',
        location: location || '',
        teacher: req.user.email || 'Teacher'
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating class:', createError);
      return ErrorResponse.internalServerError('Failed to create class').send(res);
    }

    // Assign teacher to the class
    const { error: teacherError } = await supabase
      .from('class_teachers')
      .insert([{
        profile_id: teacherId,
        class_id: newClass.id,
        role_in_class: 'owner'
      }]);

    if (teacherError) {
      console.error('Error assigning teacher to class:', teacherError);
      // Note: Class is already created, so we don't rollback
    }

    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (err) {
    console.error('Error in createClass:', err);
    return ErrorResponse.internalServerError('An error occurred while creating class').send(res);
  }
};

/**
 * POST /api/teacher/classes/:id/enroll
 * Enroll a student in a class
 */
export const enrollStudent = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: classId } = req.params;
    const { studentId } = req.body;
    const supabase = getSupabaseClient();

    // Validate required fields
    if (!studentId) {
      return ErrorResponse.badRequest('Missing required field: studentId').send(res);
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

    // Verify student profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', studentId)
      .single();

    if (profileError || !profile) {
      return ErrorResponse.notFound('Student not found').send(res);
    }

    // Verify student has the 'student' role via profile_roles (source of truth)
    const { data: roleRow, error: roleError } = await supabase
      .from('profile_roles')
      .select('role')
      .eq('profile_id', studentId)
      .eq('role', 'student')
      .maybeSingle();

    if (roleError) {
      console.error('Error verifying student role:', roleError);
      return ErrorResponse.internalServerError('Failed to verify student role').send(res);
    }

    if (!roleRow) {
      return ErrorResponse.badRequest('User is not a student').send(res);
    }

    // Check if student is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingEnrollment) {
      return ErrorResponse.badRequest('Student is already enrolled in this class').send(res);
    }

    // Enroll the student
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert([{
        class_id: classId,
        student_id: studentId,
        enrolled_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (enrollError) {
      console.error('Error enrolling student:', enrollError);
      return ErrorResponse.internalServerError('Failed to enroll student').send(res);
    }

    res.status(201).json({
      message: 'Student enrolled successfully',
      enrollment
    });
  } catch (err) {
    console.error('Error in enrollStudent:', err);
    return ErrorResponse.internalServerError('An error occurred while enrolling student').send(res);
  }
};

/**
 * DELETE /api/teacher/classes/:id/students/:studentId
 * Remove a student from a class
 */
export const removeStudent = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: classId, studentId } = req.params;
    const supabase = getSupabaseClient();

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

    // Check if student is enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!existingEnrollment) {
      return ErrorResponse.notFound('Student is not enrolled in this class').send(res);
    }

    // Remove the enrollment
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (deleteError) {
      console.error('Error removing student:', deleteError);
      return ErrorResponse.internalServerError('Failed to remove student').send(res);
    }

    res.status(200).json({
      message: 'Student removed successfully'
    });
  } catch (err) {
    console.error('Error in removeStudent:', err);
    return ErrorResponse.internalServerError('An error occurred while removing student').send(res);
  }
};


