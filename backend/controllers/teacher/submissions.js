import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * UC04: Submit Answers for Auto-Grading (Teacher View)
 * Get all submissions for a specific assignment
 */
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;
    const { status } = req.query;
    const supabase = getSupabaseClient();

    // Get assignment and verify access
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .select('class_id, title, total_points, description, submission_type')
      .eq('id', assignmentId)
      .single();

    if (assignError || !assignment) {
      console.error('Error fetching assignment in getAssignmentSubmissions:', assignError);
      return ErrorResponse.notFound('Assignment not found').send(res);
    }

    const { data: access } = await supabase
      .from('class_teachers')
      .select('role_in_class')
      .eq('profile_id', teacherId)
      .eq('class_id', assignment.class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this assignment').send(res);
    }

    // Get rubric items
    const { data: rubricItems } = await supabase
      .from('assignment_rubric_items')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: true });

    // Build query for submissions
    let query = supabase
      .from('assignment_submissions')
      .select(`
        *,
        profiles:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error: subError } = await query;

    if (subError) throw subError;

    // Get answers for each submission
    const submissionsWithAnswers = await Promise.all(
      submissions.map(async (submission) => {
        const { data: answers } = await supabase
          .from('assignment_submission_answers')
          .select(`
            *,
            questions:question_id (
              question_text,
              question_type,
              points
            )
          `)
          .eq('submission_id', submission.id)
          .order('question_id', { ascending: true });

        return {
          ...submission,
          student: submission.profiles,
          answers: answers || []
        };
      })
    );

    return res.json({
      data: submissionsWithAnswers, // For compatibility with frontend expecting .data
      submissions: submissionsWithAnswers, // Also include direct submissions key
      total: submissionsWithAnswers.length,
      assignment: {
        id: assignmentId,
        title: assignment.title,
        description: assignment.description,
        total_points: assignment.total_points,
        submission_type: assignment.submission_type,
        rubric: rubricItems || []
      }
    });

  } catch (err) {
    console.error('Get assignment submissions error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Get a specific submission detail
 */
export const getSubmissionDetail = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { submissionId } = req.params;
    const supabase = getSupabaseClient();

    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        profiles:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar
        ),
        assignments:assignment_id (
          id,
          title,
          description,
          total_points,
          class_id
        )
      `)
      .eq('id', submissionId)
      .single();

    if (subError) throw subError;
    if (!submission) {
      return ErrorResponse.notFound('Submission not found').send(res);
    }

    // Verify teacher has access
    const { data: access } = await supabase
      .from('class_teachers')
      .select('role_in_class')
      .eq('profile_id', teacherId)
      .eq('class_id', submission.assignments.class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this submission').send(res);
    }

    // Get answers with questions
    const { data: answers } = await supabase
      .from('assignment_submission_answers')
      .select(`
        *,
        questions:question_id (
          id,
          question_text,
          question_type,
          points,
          order_num
        )
      `)
      .eq('submission_id', submissionId)
      .order('question_id', { ascending: true });

    return res.json({
      submission: {
        ...submission,
        student: submission.profiles,
        assignment: submission.assignments,
        answers: answers || []
      }
    });

  } catch (err) {
    console.error('Get submission detail error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Grade a submission
 */
export const gradeSubmission = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { submissionId } = req.params;
    const { grade, feedback, answer_grades } = req.body;
    const supabase = getSupabaseClient();

    // Get submission and verify access
    const { data: submission } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments:assignment_id (
          class_id,
          total_points
        )
      `)
      .eq('id', submissionId)
      .single();

    if (!submission) {
      return ErrorResponse.notFound('Submission not found').send(res);
    }

    const { data: access } = await supabase
      .from('class_teachers')
      .select('role_in_class')
      .eq('profile_id', teacherId)
      .eq('class_id', submission.assignments.class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to grade this submission').send(res);
    }

    // Validate grade
    const maxPoints = submission.assignments.total_points || 100;
    if (grade !== undefined && grade !== null) {
      if (grade < 0 || grade > maxPoints) {
        return ErrorResponse.badRequest(
          `Grade must be between 0 and ${maxPoints}`
        ).send(res);
      }
    }

    // Update submission
    const { data: updated, error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        grade: grade,
        feedback: feedback || null,
        graded_by: teacherId,
        graded_at: new Date().toISOString(),
        status: 'graded'
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update individual answer grades if provided
    if (answer_grades && Array.isArray(answer_grades)) {
      for (const answerGrade of answer_grades) {
        if (answerGrade.answer_id) {
          await supabase
            .from('assignment_submission_answers')
            .update({
              points_earned: answerGrade.points_earned,
              feedback: answerGrade.feedback || null
            })
            .eq('id', answerGrade.answer_id);
        }
      }
    }

    return res.json({
      message: 'Submission graded successfully',
      submission: updated
    });

  } catch (err) {
    console.error('Grade submission error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Update feedback for a submission
 */
export const updateSubmissionFeedback = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { submissionId } = req.params;
    const { feedback } = req.body;
    const supabase = getSupabaseClient();

    // Get submission and verify access
    const { data: submission } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments:assignment_id (
          class_id
        )
      `)
      .eq('id', submissionId)
      .single();

    if (!submission) {
      return ErrorResponse.notFound('Submission not found').send(res);
    }

    const { data: access } = await supabase
      .from('class_teachers')
      .select('role_in_class')
      .eq('profile_id', teacherId)
      .eq('class_id', submission.assignments.class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this submission').send(res);
    }

    // Update feedback
    const { data: updated, error: updateError } = await supabase
      .from('assignment_submissions')
      .update({ feedback })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      message: 'Feedback updated successfully',
      submission: updated
    });

  } catch (err) {
    console.error('Update submission feedback error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Get grading summary for an assignment
 */
export const getGradingSummary = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;
    const supabase = getSupabaseClient();

    // Get assignment and verify access
    const { data: assignment } = await supabase
      .from('assignments')
      .select('class_id, title, total_points')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      return ErrorResponse.notFound('Assignment not found').send(res);
    }

    const { data: access } = await supabase
      .from('class_teachers')
      .select('role_in_class')
      .eq('profile_id', teacherId)
      .eq('class_id', assignment.class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this assignment').send(res);
    }

    // Get submission counts
    const { count: totalSubmissions } = await supabase
      .from('assignment_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId);

    const { count: gradedCount } = await supabase
      .from('assignment_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId)
      .not('grade', 'is', null);

    const { count: pendingCount } = await supabase
      .from('assignment_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId)
      .eq('status', 'submitted')
      .is('grade', null);

    // Get graded submissions for stats
    const { data: gradedSubmissions } = await supabase
      .from('assignment_submissions')
      .select('grade, total_points')
      .eq('assignment_id', assignmentId)
      .not('grade', 'is', null);

    let avgGrade = null;
    let highestGrade = null;
    let lowestGrade = null;

    if (gradedSubmissions && gradedSubmissions.length > 0) {
      const grades = gradedSubmissions.map(s => s.grade);
      avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
      highestGrade = Math.max(...grades);
      lowestGrade = Math.min(...grades);
    }

    return res.json({
      summary: {
        assignment_id: assignmentId,
        assignment_title: assignment.title,
        points_possible: assignment.total_points,
        total_submissions: totalSubmissions || 0,
        graded_count: gradedCount || 0,
        pending_count: pendingCount || 0,
        average_grade: avgGrade ? Math.round(avgGrade * 10) / 10 : null,
        highest_grade: highestGrade,
        lowest_grade: lowestGrade
      }
    });

  } catch (err) {
    console.error('Get grading summary error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};



