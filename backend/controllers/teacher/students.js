import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/teacher/students
 * Get all students enrolled in classes taught by this teacher
 */
export const getTeacherStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const supabase = getSupabaseClient();

    // Get all classes taught by this teacher
    const { data: classTeachers, error: ctError } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('profile_id', teacherId);

    if (ctError) {
      console.error('Error fetching class teachers:', ctError);
      return ErrorResponse.internalServerError('Failed to fetch teacher classes').send(res);
    }

    const classIds = classTeachers?.map(ct => ct.class_id) || [];

    // If teacher has no classes, return empty array
    if (classIds.length === 0) {
      return res.status(200).json({ students: [] });
    }

    // Get all enrollments in teacher's classes
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        class_id,
        enrolled_at,
        profiles (
          id,
          first_name,
          last_name,
          name,
          email,
          avatar,
          created_at
        ),
        classes (
          id,
          name,
          code
        )
      `)
      .in('class_id', classIds);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return ErrorResponse.internalServerError('Failed to fetch students').send(res);
    }

    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({ students: [] });
    }

    // Group enrollments by student to avoid duplicates
    const studentMap = new Map();

    for (const enrollment of enrollments) {
      const studentId = enrollment.student_id;
      const profile = enrollment.profiles;

      if (!profile) {
        continue; // Skip if profile is missing
      }

      if (!studentMap.has(studentId)) {
        // Find the earliest enrollment date for this student
        const studentEnrollments = enrollments.filter(e => e.student_id === studentId);
        let earliestEnrolledAt = null;
        
        if (studentEnrollments.length > 0) {
          // Get all enrollment dates and find the earliest (filter out null/undefined/empty values)
          const enrollmentDates = studentEnrollments
            .map(e => e.enrolled_at)
            .filter(date => date !== null && date !== undefined && date !== '');
          
          if (enrollmentDates.length > 0) {
            earliestEnrolledAt = enrollmentDates.reduce((earliest, current) => {
              const earliestDate = earliest ? new Date(earliest) : new Date('9999-12-31');
              const currentDate = current ? new Date(current) : new Date('9999-12-31');
              return currentDate < earliestDate ? current : earliest;
            });
          }
        }

        // Determine enrolled_at: use earliest enrollment date, or created_at
        let finalEnrolledAt = earliestEnrolledAt;
        if (!finalEnrolledAt || finalEnrolledAt === null || finalEnrolledAt === undefined) {
          finalEnrolledAt = profile.created_at;
        }
        
        // Final fallback: use current date if everything is null
        if (!finalEnrolledAt || finalEnrolledAt === null || finalEnrolledAt === undefined) {
          finalEnrolledAt = new Date().toISOString();
        }

        // Extract first_name and last_name from name field if they're empty
        let firstName = profile.first_name;
        let lastName = profile.last_name;
        
        // If first_name and last_name are empty but name field has value, try to split it
        if ((!firstName || firstName === '') && (!lastName || lastName === '') && profile.name) {
          const nameParts = profile.name.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else if (nameParts.length === 1) {
            firstName = nameParts[0];
            lastName = '';
          }
        }
        
        // Build display name: first_name + last_name, or name, or email
        const displayName = (firstName || lastName) 
          ? `${firstName || ''} ${lastName || ''}`.trim() 
          : (profile.name || profile.email);

        studentMap.set(studentId, {
          id: profile.id,
          name: displayName,
          firstName: firstName || '',
          lastName: lastName || '',
          email: profile.email,
          avatar: profile.avatar,
          created_at: profile.created_at || finalEnrolledAt, // Ensure created_at is set
          enrolled_at: finalEnrolledAt, // Use earliest enrollment date or created_at
          classes: [],
        });
      }

      const student = studentMap.get(studentId);
      // Use enrolled_at if available, otherwise use profile's created_at
      const enrollmentDate = enrollment.enrolled_at || student.created_at || new Date().toISOString();
      student.classes.push({
        id: enrollment.classes.id,
        name: enrollment.classes.name,
        code: enrollment.classes.code,
        enrolledAt: enrollmentDate, // Use enrolled_at or fallback to created_at
      });
    }

    // Convert map to array and enrich with grade data
    const students = await Promise.all(
      Array.from(studentMap.values()).map(async (student) => {
        // Get all assignment IDs from student's classes
        const studentClassIds = student.classes.map(c => c.id);
        
        let assignmentIds = [];
        let avgGrade = null;
        let completedAssignments = 0;
        let totalAssignments = 0;

        if (studentClassIds.length > 0) {
          const { data: assignments } = await supabase
            .from('assignments')
            .select('id')
            .in('class_id', studentClassIds);

          assignmentIds = assignments?.map(a => a.id) || [];

          if (assignmentIds.length > 0) {
            // Get student's submissions
            const { data: submissions } = await supabase
              .from('assignment_submissions')
              .select('grade, assignment_id')
              .eq('student_id', student.id)
              .in('assignment_id', assignmentIds);

            const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
            if (gradedSubmissions.length > 0) {
              const total = gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.grade), 0);
              avgGrade = Math.round(total / gradedSubmissions.length);
            }

            completedAssignments = submissions?.length || 0;
            totalAssignments = assignmentIds.length;
          }
        }

        // Ensure enrolled_at is set - use first class's enrolledAt if student.enrolled_at is missing
        let finalEnrolledAt = student.enrolled_at;
        
        // If enrolled_at is missing, try to get it from classes
        if ((!finalEnrolledAt || finalEnrolledAt === null || finalEnrolledAt === undefined) && student.classes && student.classes.length > 0) {
          // Find the earliest enrolledAt from classes
          const classDates = student.classes
            .map(c => c.enrolledAt)
            .filter(date => date !== null && date !== undefined && date !== '');
          
          if (classDates.length > 0) {
            finalEnrolledAt = classDates.reduce((earliest, current) => {
              try {
                const earliestDate = earliest ? new Date(earliest) : new Date('9999-12-31');
                const currentDate = current ? new Date(current) : new Date('9999-12-31');
                return currentDate < earliestDate ? current : earliest;
              } catch (e) {
                console.error('Error comparing dates:', e, { earliest, current });
                return earliest || current;
              }
            });
          }
        }
        
        // If still no enrolled_at, use created_at
        if (!finalEnrolledAt || finalEnrolledAt === null || finalEnrolledAt === undefined) {
          finalEnrolledAt = student.created_at;
        }
        
        // Final fallback: use current date if everything is null
        if (!finalEnrolledAt || finalEnrolledAt === null || finalEnrolledAt === undefined) {
          finalEnrolledAt = new Date().toISOString();
        }

        return {
          ...student,
          enrolled_at: finalEnrolledAt, // Ensure enrolled_at is set
          created_at: student.created_at || finalEnrolledAt, // Ensure created_at is also set
          avgGrade: avgGrade ? `${avgGrade}%` : 'N/A',
          completedAssignments,
          totalAssignments,
        };
      })
    );

    res.status(200).json({ students });
  } catch (err) {
    console.error('Error in getTeacherStudents:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching students').send(res);
  }
};

/**
 * GET /api/teacher/students/all-students
 * Get all students in the system (for enrollment purposes)
 */
export const getAllStudents = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get all users with student role via profile_roles join (source of truth)
    const { data: roleRows, error: rolesError } = await supabase
      .from('profile_roles')
      .select(`
        profile_id,
        profiles (
          id,
          first_name,
          last_name,
          name,
          email,
          avatar,
          created_at
        )
      `)
      .eq('role', 'student');

    if (rolesError) {
      console.error('Error fetching student roles:', rolesError);
      return ErrorResponse.internalServerError('Failed to fetch students').send(res);
    }

    const students = (roleRows || [])
      .map(r => r.profiles)
      .filter(Boolean)
      // de-duplicate in case of multiple role rows
      .reduce((acc, p) => {
        if (!acc.some(x => x.id === p.id)) acc.push(p);
        return acc;
      }, [])
      // Sort by created_at desc
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Format the students data
    const formattedStudents = students.map(student => {
      // Extract first_name and last_name from name field if they're empty
      let firstName = student.first_name;
      let lastName = student.last_name;
      
      // If first_name and last_name are empty but name field has value, try to split it
      if ((!firstName || firstName === '') && (!lastName || lastName === '') && student.name) {
        const nameParts = student.name.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = '';
        }
      }
      
      // Build display name: first_name + last_name, or name, or email
      const displayName = (firstName || lastName) 
        ? `${firstName || ''} ${lastName || ''}`.trim() 
        : (student.name || student.email);

      return {
        id: student.id,
        name: displayName,
        firstName: firstName || '',
        lastName: lastName || '',
        email: student.email,
        avatar: student.avatar,
        created_at: student.created_at
      };
    });

    res.status(200).json({ students: formattedStudents });
  } catch (err) {
    console.error('Error in getAllStudents:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching students').send(res);
  }
};

/**
 * GET /api/teacher/students/:id
 * Get detailed information about a specific student
 */
export const getStudentDetails = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: studentId } = req.params;
    const supabase = getSupabaseClient();

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profileError || !profile) {
      return ErrorResponse.notFound('Student not found').send(res);
    }

    // Get all classes taught by this teacher that the student is enrolled in
    const { data: classTeachers } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('profile_id', teacherId);

    const teacherClassIds = classTeachers?.map(ct => ct.class_id) || [];

    // Get student's enrollments in teacher's classes
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        class_id,
        enrolled_at,
        classes (
          id,
          name,
          code,
          color
        )
      `)
      .eq('student_id', studentId)
      .in('class_id', teacherClassIds);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return ErrorResponse.internalServerError('Failed to fetch student details').send(res);
    }

    // Verify teacher has access to at least one of student's classes
    if (!enrollments || enrollments.length === 0) {
      return ErrorResponse.forbidden('You do not have access to this student').send(res);
    }

    // Get student's performance in each class
    const classesWithGrades = await Promise.all(
      enrollments.map(async (enrollment) => {
        const classId = enrollment.class_id;

        // Get assignments for this class
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('class_id', classId);

        const assignmentIds = assignments?.map(a => a.id) || [];

        // Get student's submissions for this class
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('grade')
          .eq('student_id', studentId)
          .in('assignment_id', assignmentIds);

        const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
        let avgGrade = null;
        if (gradedSubmissions.length > 0) {
          const total = gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.grade), 0);
          avgGrade = Math.round(total / gradedSubmissions.length);
        }

        return {
          classId: enrollment.classes.id,
          className: enrollment.classes.name,
          classCode: enrollment.classes.code,
          color: enrollment.classes.color,
          enrolledAt: enrollment.enrolled_at,
          avgGrade: avgGrade ? `${avgGrade}%` : 'N/A',
          completedAssignments: submissions?.length || 0,
          totalAssignments: assignmentIds.length,
        };
      })
    );

    // Get recent activity (recent submissions)
    const allClassIds = enrollments.map(e => e.class_id);
    const { data: allAssignments } = await supabase
      .from('assignments')
      .select('id, title')
      .in('class_id', allClassIds);

    const allAssignmentIds = allAssignments?.map(a => a.id) || [];

    const { data: recentSubmissions } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        submitted_at,
        grade,
        assignment_id,
        assignments (
          title
        )
      `)
      .eq('student_id', studentId)
      .in('assignment_id', allAssignmentIds)
      .order('submitted_at', { ascending: false })
      .limit(10);

    const recentActivity = recentSubmissions?.map(sub => ({
      id: sub.id,
      assignmentTitle: sub.assignments?.title || 'Unknown',
      submittedAt: sub.submitted_at,
      grade: sub.grade,
    })) || [];

    // Get or create student notes
    const { data: notes } = await supabase
      .from('student_notes')
      .select('notes')
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .single();

    // Extract first_name and last_name from name field if they're empty
    let firstName = profile.first_name;
    let lastName = profile.last_name;
    
    // If first_name and last_name are empty but name field has value, try to split it
    if ((!firstName || firstName === '') && (!lastName || lastName === '') && profile.name) {
      const nameParts = profile.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        firstName = nameParts[0];
        lastName = '';
      }
    }
    
    // Build display name: first_name + last_name, or name, or email
    const displayName = (firstName || lastName) 
      ? `${firstName || ''} ${lastName || ''}`.trim() 
      : (profile.name || profile.email);

    res.status(200).json({
      student: {
        id: profile.id,
        name: displayName,
        firstName: firstName || '',
        lastName: lastName || '',
        email: profile.email,
        avatar: profile.avatar,
        classes: classesWithGrades,
        recentActivity,
        notes: notes?.notes || '',
      }
    });
  } catch (err) {
    console.error('Error in getStudentDetails:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching student details').send(res);
  }
};

/**
 * GET /api/teacher/students/:id/grades
 * Get all grades for a specific student across all assignments
 */
export const getStudentGrades = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: studentId } = req.params;
    const { classId } = req.query; // Optional filter by class
    const supabase = getSupabaseClient();

    // Get all classes taught by this teacher
    const { data: classTeachers } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('profile_id', teacherId);

    const classIds = classTeachers?.map(ct => ct.class_id) || [];

    if (classIds.length === 0) {
      return res.status(200).json({ grades: [], student: null });
    }

    // Verify student is enrolled in at least one of teacher's classes
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select(`
        *,
        profiles (
          id,
          first_name,
          last_name,
          email,
          avatar
        )
      `)
      .eq('student_id', studentId)
      .in('class_id', classIds)
      .limit(1)
      .single();

    if (!enrollment) {
      return ErrorResponse.forbidden('Student not found in your classes').send(res);
    }

    // Build query for assignments and submissions
    let assignmentsQuery = supabase
      .from('assignments')
      .select(`
        id,
        title,
        due_date,
        due_time,
        total_points,
        weight,
        status,
        class_id,
        classes (
          id,
          name,
          code,
          color
        )
      `)
      .in('class_id', classIds)
      .eq('status', 'published')
      .order('due_date', { ascending: false });

    // Filter by specific class if provided
    if (classId && classId !== 'all') {
      assignmentsQuery = assignmentsQuery.eq('class_id', classId);
    }

    const { data: assignments } = await assignmentsQuery;

    // Get all submissions for this student
    const assignmentIds = assignments?.map(a => a.id) || [];
    
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', studentId)
      .in('assignment_id', assignmentIds);

    // Combine assignments with submission data
    const gradesData = assignments?.map(assignment => {
      const submission = submissions?.find(s => s.assignment_id === assignment.id);
      
      return {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        className: assignment.classes?.name || 'Unknown',
        classCode: assignment.classes?.code || '',
        classColor: assignment.classes?.color || '#3b82f6',
        dueDate: assignment.due_date,
        dueTime: assignment.due_time,
        totalPoints: assignment.total_points,
        weight: assignment.weight,
        grade: submission?.grade || null,
        feedback: submission?.feedback || null,
        submittedAt: submission?.submitted_at || null,
        gradedAt: submission?.graded_at || null,
        status: submission ? submission.status : 'not_submitted',
        percentage: submission?.grade && assignment.total_points 
          ? Math.round((submission.grade / assignment.total_points) * 100) 
          : null
      };
    }) || [];

    // Calculate overall statistics
    const gradedAssignments = gradesData.filter(g => g.grade !== null);
    const totalWeightedScore = gradedAssignments.reduce((sum, g) => {
      const percentage = g.percentage || 0;
      const weight = g.weight || 0;
      return sum + (percentage * weight);
    }, 0);
    const totalWeight = gradedAssignments.reduce((sum, g) => sum + (g.weight || 0), 0);
    const overallGrade = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : null;

    res.status(200).json({
      student: {
        id: enrollment.profiles.id,
        firstName: enrollment.profiles.first_name,
        lastName: enrollment.profiles.last_name,
        email: enrollment.profiles.email,
        avatar: enrollment.profiles.avatar
      },
      stats: {
        totalAssignments: gradesData.length,
        gradedAssignments: gradedAssignments.length,
        overallGrade: overallGrade,
        submittedCount: gradesData.filter(g => g.status !== 'not_submitted').length
      },
      grades: gradesData
    });
  } catch (err) {
    console.error('Error fetching student grades:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching student grades').send(res);
  }
};

/**
 * PUT /api/teacher/students/:id/notes
 * Save or update notes for a student
 */
export const updateStudentNotes = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: studentId } = req.params;
    const { notes } = req.body;

    if (typeof notes !== 'string') {
      return ErrorResponse.badRequest('Notes must be a string').send(res);
    }

    const supabase = getSupabaseClient();

    // Verify teacher has access to this student
    const { data: classTeachers } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('profile_id', teacherId);

    const teacherClassIds = classTeachers?.map(ct => ct.class_id) || [];

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', studentId)
      .in('class_id', teacherClassIds)
      .limit(1)
      .single();

    if (!enrollment) {
      return ErrorResponse.forbidden('You do not have access to this student').send(res);
    }

    // Upsert notes
    const { data: updatedNotes, error: upsertError } = await supabase
      .from('student_notes')
      .upsert(
        {
          student_id: studentId,
          teacher_id: teacherId,
          notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'student_id,teacher_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error updating notes:', upsertError);
      return ErrorResponse.internalServerError('Failed to update notes').send(res);
    }

    res.status(200).json({
      message: 'Notes updated successfully',
      notes: updatedNotes
    });
  } catch (err) {
    console.error('Error in updateStudentNotes:', err);
    return ErrorResponse.internalServerError('An error occurred while updating notes').send(res);
  }
};


