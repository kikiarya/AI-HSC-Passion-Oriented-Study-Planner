import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/student/assignments
 * Get all assignments for student's enrolled classes
 */
export const getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, upcoming } = req.query;
    const supabase = getSupabaseClient();
    
    // Get student's enrolled classes
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', studentId);
    
    if (enrollError) throw enrollError;
    
    if (!enrollments || enrollments.length === 0) {
      return res.json({
        success: true,
        assignments: []
      });
    }
    
    const classIds = enrollments.map(e => e.class_id);
    
    // Build query
    let query = supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        class_id,
        due_date,
        status,
        weight,
        classes (
          id,
          name,
          code
        )
      `)
      .in('class_id', classIds)
      .order('due_date', { ascending: true });
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (upcoming === 'true') {
      query = query.gte('due_date', new Date().toISOString());
    }
    
    const { data: assignments, error: assignError } = await query;
    
    if (assignError) throw assignError;
    
    // Get submissions for these assignments
    const assignmentIds = assignments?.map(a => a.id) || [];
    let submissions = [];
    if (assignmentIds.length > 0) {
      const { data: submissionData, error: subError } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, status, submitted_at, grade')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds);
      
      if (subError && subError.code !== 'PGRST116') throw subError;
      submissions = submissionData || [];
    }
    
    // Format assignments with submission status
    const formattedAssignments = (assignments || []).map(assignment => {
      const submission = submissions.find(s => s.assignment_id === assignment.id);
      const now = new Date();
      const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
      const isDueDateValid = dueDate && !isNaN(dueDate.getTime());
      const diffDays = isDueDateValid ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;
      
      let priority = 'low';
      if (diffDays != null) {
        if (diffDays < 0) priority = 'high';
        else if (diffDays <= 3) priority = 'high';
        else if (diffDays <= 7) priority = 'medium';
      }
      
      let assignmentStatus = 'pending';
      if (submission) {
        assignmentStatus = submission.status || 'submitted';
      } else if (diffDays != null && diffDays < 0) {
        assignmentStatus = 'overdue';
      }
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        class: assignment.classes?.name || 'Unknown Class',
        classId: assignment.class_id,
        dueDate: isDueDateValid ? dueDate.toLocaleDateString() : null,
        dueTime: isDueDateValid ? dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
        status: assignmentStatus,
        priority: priority,
        weight: assignment.weight,
        submittedAt: submission?.submitted_at,
        score: submission?.grade,
        maxScore: null
      };
    });
    
    return res.json({
      success: true,
      assignments: formattedAssignments
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    return ErrorResponse.internalServerError('Failed to fetch assignments').send(res);
  }
};

/**
 * GET /api/student/assignments/:id
 * Get details for a specific assignment
 */
export const getAssignmentDetail = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id: assignmentId } = req.params;
    const supabase = getSupabaseClient();
    
    // Get assignment details
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .select(`
        *,
        classes (
          id,
          name,
          code
        )
      `)
      .eq('id', assignmentId)
      .single();
    
    if (assignError) {
      return ErrorResponse.notFound('Assignment not found').send(res);
    }
    
    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', assignment.class_id)
      .single();
    
    if (enrollError || !enrollment) {
      return ErrorResponse.forbidden('You are not enrolled in this class').send(res);
    }
    
    // Get assignment instructions
    const { data: instructions, error: instError } = await supabase
      .from('assignment_instructions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('position', { ascending: true });
    
    if (instError && instError.code !== 'PGRST116') throw instError;
    
    // Get requirements
    const { data: requirements, error: reqError } = await supabase
      .from('assignment_requirements')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('position', { ascending: true });
    
    if (reqError && reqError.code !== 'PGRST116') throw reqError;
    
    // Get resources
    const { data: resources, error: resError } = await supabase
      .from('assignment_resources')
      .select('*')
      .eq('assignment_id', assignmentId);
    
    if (resError && resError.code !== 'PGRST116') throw resError;
    
    // Get rubric
    const { data: rubric, error: rubricError } = await supabase
      .from('assignment_rubric_items')
      .select('*')
      .eq('assignment_id', assignmentId);
    
    if (rubricError && rubricError.code !== 'PGRST116') throw rubricError;
    
    // Get questions if any
    const { data: questions, error: qError } = await supabase
      .from('assignment_questions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('position', { ascending: true });
    
    if (qError && qError.code !== 'PGRST116') throw qError;
    
    // Get options for questions
    let questionsWithOptions = [];
    if (questions && questions.length > 0) {
      for (const question of questions) {
        const { data: options, error: optError } = await supabase
          .from('assignment_question_options')
          .select('*')
          .eq('question_id', question.id)
          .order('option_key', { ascending: true });
        
        if (optError && optError.code !== 'PGRST116') throw optError;
        
        questionsWithOptions.push({
          ...question,
          options: options || []
        });
      }
    }
    
    // Get student's submission if exists
    const { data: submission, error: subError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();
    
    if (subError && subError.code !== 'PGRST116') throw subError;
    
    // Get submission answers if submission exists
    let submissionAnswers = [];
    if (submission) {
      const { data: answers, error: ansError } = await supabase
        .from('assignment_submission_answers')
        .select('*')
        .eq('submission_id', submission.id);
      
      if (ansError && ansError.code !== 'PGRST116') throw ansError;
      submissionAnswers = answers || [];
    }
    
    // Format assignment data
    const now = new Date();
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
    const isDueDateValid = dueDate && !isNaN(dueDate.getTime());
    const diffDays = isDueDateValid ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;
    
    let priority = 'low';
    if (diffDays < 0) priority = 'high';
    else if (diffDays <= 3) priority = 'high';
    else if (diffDays <= 7) priority = 'medium';
    
    let status = 'pending';
    if (submission) {
      status = submission.status || 'submitted';
    } else if (diffDays != null && diffDays < 0) {
      status = 'overdue';
    }
    
    return res.json({
      success: true,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        class: assignment.classes?.name || 'Unknown',
        dueDate: isDueDateValid ? dueDate.toLocaleDateString() : null,
        dueTime: isDueDateValid ? dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
        postedDate: new Date(assignment.created_at).toLocaleDateString(),
        status: status,
        priority: priority,
        weight: assignment.weight,
        totalPoints: assignment.total_points || 100,
        submissionType: 'Online',
        instructions: instructions?.map(i => i.text) || [],
        requirements: requirements?.map(r => r.text) || [],
        resources: resources?.map(r => ({ name: r.name, type: r.type, url: r.url })) || [],
        rubric: rubric?.map(r => ({ criteria: r.criteria, points: r.points })) || [],
        hasQuestions: questionsWithOptions.length > 0,
        questions: questionsWithOptions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          points: q.points,
          options: q.options.map(o => ({ id: o.option_key, text: o.text }))
        })),
        submission: submission,
        submissionAnswers: submissionAnswers,
        submittedDate: submission?.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : null
      }
    });
  } catch (error) {
    console.error('Get assignment detail error:', error);
    return ErrorResponse.internalServerError('Failed to fetch assignment details').send(res);
  }
};

/**
 * POST /api/student/assignments/:id/submit
 * Submit an assignment
 */
export const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id: assignmentId } = req.params;
    const { text, answers } = req.body;
    const supabase = getSupabaseClient();
    
    // Verify assignment exists and student is enrolled
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .select('class_id, due_date')
      .eq('id', assignmentId)
      .single();
    
    if (assignError) {
      return ErrorResponse.notFound('Assignment not found').send(res);
    }
    
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', assignment.class_id)
      .single();
    
    if (enrollError || !enrollment) {
      return ErrorResponse.forbidden('You are not enrolled in this class').send(res);
    }
    
    // Check if already submitted
    const { data: existingSubmission, error: existError } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();
    
    if (existingSubmission) {
      return ErrorResponse.badRequest('Assignment already submitted').send(res);
    }
    
    // Create submission
    const { data: submission, error: subError } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: studentId,
        text_response: text || '',
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (subError) throw subError;
    
    // If there are answers, save them
    if (answers && Array.isArray(answers)) {
      const answerRecords = answers.map(answer => ({
        submission_id: submission.id,
        question_id: answer.questionId,
        text_answer: answer.answerText,
        selected_option_key: answer.selectedOption
      }));
      
      const { error: ansError } = await supabase
        .from('assignment_submission_answers')
        .insert(answerRecords);
      
      if (ansError) throw ansError;
    }
    
    return res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    return ErrorResponse.internalServerError('Failed to submit assignment').send(res);
  }
};

