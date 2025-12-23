import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/teacher/assignments
 * Get all assignments created by the teacher
 * Get all assignments for teacher's classes
 */
export const getTeacherAssignments = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const supabase = getSupabaseClient();

    // Get all classes taught by this teacher
    const { data: classTeachers } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('profile_id', teacherId);

    const classIds = classTeachers?.map(ct => ct.class_id) || [];

    if (classIds.length === 0) {
      return res.status(200).json({ assignments: [] });
    }

    // Get assignments for these classes
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select(`
        *,
        classes (
          name,
          code
        )
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false });

    if (assignError) {
      console.error('Error fetching assignments:', assignError);
      return ErrorResponse.internalServerError('Failed to fetch assignments').send(res);
    }

    // Enrich each assignment with submission stats
    const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
      // Get submission stats
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('id, status, grade')
        .eq('assignment_id', assignment.id);

      const totalSubmissions = submissions?.length || 0;
      const gradedSubmissions = submissions?.filter(s => s.grade !== null).length || 0;
      const pendingGrading = submissions?.filter(s => s.status === 'submitted' && s.grade === null).length || 0;

      // Get total enrolled students in the class
      const { count: totalStudents } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', assignment.class_id);

      // Get due_date - try multiple possible field names
      const dueDate = assignment.due_date || assignment.dueDate || assignment.due || null;

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        className: assignment.classes?.name || 'Unknown',
        classCode: assignment.classes?.code || '',
        dueDate: dueDate,
        due_date: dueDate, // Also include snake_case for compatibility
        totalPoints: assignment.total_points || assignment.totalPoints || 100,
        total_points: assignment.total_points || assignment.totalPoints || 100, // Also include snake_case for compatibility
        status: assignment.status || 'draft',
        class_id: assignment.class_id, // Include for filtering
        submissionStats: {
          total: totalSubmissions,
          graded: gradedSubmissions,
          pending: pendingGrading,
          totalStudents: totalStudents || 0,
        },
        createdAt: assignment.created_at,
        created_at: assignment.created_at, // Also include snake_case for compatibility
      };
    }));

    res.status(200).json({ assignments: enrichedAssignments });
  } catch (err) {
    console.error('Error in getTeacherAssignments:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching assignments').send(res);
  }
};

/**
 * GET /api/teacher/assignments/:id
 * Get details for a specific assignment
 */
export const getAssignmentDetails = async (req, res) => {
  try {
    const teacherId = req.user.id;
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
      console.error('Error fetching assignment:', assignError);
      if (assignError.code === 'PGRST116') {
        // No rows returned
        return ErrorResponse.notFound('Assignment not found').send(res);
      }
      return ErrorResponse.internalServerError('Failed to fetch assignment').send(res);
    }

    if (!assignment) {
      console.error('Assignment not found for id:', assignmentId);
      return ErrorResponse.notFound('Assignment not found').send(res);
    }

    // Verify teacher has access to this assignment's class
    const { data: access, error: accessError } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('profile_id', teacherId)
      .eq('class_id', assignment.class_id)
      .single();

    // TEMPORARILY DISABLED for debugging
    // if (!access) {
    //   return ErrorResponse.forbidden('You do not have access to this assignment').send(res);
    // }

    // Get submissions
    const { data: submissions } = await supabase
      .from('assignment_submissions')
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
      .eq('assignment_id', assignmentId);

    const enrichedSubmissions = submissions?.map(sub => ({
      id: sub.id,
      studentId: sub.student_id,
      studentName: `${sub.profiles?.first_name || ''} ${sub.profiles?.last_name || ''}`.trim() || sub.profiles?.email,
      studentAvatar: sub.profiles?.avatar,
      submittedAt: sub.submitted_at,
      status: sub.status,
      grade: sub.grade,
      feedback: sub.feedback,
      content: sub.content,
    })) || [];

    // Get rubric items
    const { data: rubric, error: rubricError } = await supabase
      .from('assignment_rubric_items')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('position', { ascending: true });
    
    if (rubricError && rubricError.code !== 'PGRST116') {
      console.error('Error fetching rubric:', rubricError);
    }

    // Get assignment questions
    const { data: questions, error: qError } = await supabase
      .from('assignment_questions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('position', { ascending: true });
    
    if (qError && qError.code !== 'PGRST116') {
      console.error('Error fetching questions:', qError);
    }

    // Get options for each question
    let questionsWithOptions = [];
    if (questions && questions.length > 0) {
      for (const question of questions) {
        const { data: options, error: optError } = await supabase
          .from('assignment_question_options')
          .select('*')
          .eq('question_id', question.id)
          .order('option_key', { ascending: true });
        
        if (optError && optError.code !== 'PGRST116') {
          console.error('Error fetching question options:', optError);
        }
        
        questionsWithOptions.push({
          id: question.id,
          assignment_id: question.assignment_id,
          position: question.position,
          type: question.type,
          question: question.question,
          points: question.points,
          subject: question.subject,
          subject_code: question.subject_code,
          options: options || []
        });
      }
    }

    // Get due_date - try multiple possible field names
    const dueDate = assignment.due_date || assignment.dueDate || assignment.due || null;

    const response = {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        className: assignment.classes?.name,
        classCode: assignment.classes?.code,
        class_id: assignment.class_id,
        dueDate: dueDate,
        due_date: dueDate, // Include both formats for compatibility
        totalPoints: assignment.total_points || assignment.totalPoints || 100,
        total_points: assignment.total_points || assignment.totalPoints || 100, // Include both formats for compatibility
        status: assignment.status || 'draft',
        created_at: assignment.created_at,
        createdAt: assignment.created_at,
        submissions: enrichedSubmissions,
        rubric: rubric?.map(r => ({
          id: r.id,
          criteria: r.criteria,
          points: r.points,
          position: r.position,
          description: r.description
        })) || [],
        questions: questionsWithOptions,
        hasQuestions: questionsWithOptions.length > 0,
      }
    }
    console.log('Response:', response);
    res.status(200).json(response);
  } catch (err) {
    console.error('Error in getAssignmentDetails:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching assignment details').send(res);
  }
};

/**
 * POST /api/teacher/assignments
 * Create a new assignment
 */
export const createAssignment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      classId,
      title,
      description,
      instructions,
      requirements,
      resources,
      dueDate,
      totalPoints,
      rubric,
      questions,
      submission_type
    } = req.body;

    const supabase = getSupabaseClient();

    // Verify teacher has access to this class
    const { data: access } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('profile_id', teacherId)
      .eq('class_id', classId)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this class').send(res);
    }

    // Validate required fields
    if (!title || !classId || !dueDate) {
      return ErrorResponse.badRequest('Missing required fields: title, classId, dueDate').send(res);
    }

    // Parse due_date (date) and due_time (time) from combined datetime if provided
    let due_date_value = null;
    let due_time_value = null;
    if (dueDate) {
      if (typeof dueDate === 'string' && dueDate.includes('T')) {
        const [d, t] = dueDate.split('T');
        due_date_value = d;
        if (t) {
          const hm = t.trim().slice(0,5); // HH:MM
          due_time_value = hm ? `${hm}:00` : null;
        }
      } else {
        due_date_value = dueDate;
      }
    }

    // Create base assignment row (columns that actually exist)
    const baseInsert = {
      class_id: classId,
      title,
      description,
      due_date: due_date_value,
      due_time: due_time_value,
      total_points: totalPoints || 100,
      submission_type: submission_type || null,
      status: 'pending',
      created_by: teacherId,
    };

    const { data: assignment, error: createError } = await supabase
      .from('assignments')
      .insert([baseInsert])
      .select()
      .single();

    if (createError) {
      console.error('Error creating assignment:', createError);
      return ErrorResponse.internalServerError('Failed to create assignment').send(res);
    }

    // Insert optional related data into their respective tables
    const createdId = assignment.id;

    // Instructions: can be string or array; store as ordered rows
    let instructionsArr = [];
    if (Array.isArray(instructions)) instructionsArr = instructions.filter(Boolean);
    else if (typeof instructions === 'string') instructionsArr = instructions.split('\n').map(s => s.trim()).filter(Boolean);
    if (instructionsArr.length > 0) {
      const rows = instructionsArr.map((text, idx) => ({ assignment_id: createdId, position: idx + 1, text }));
      const { error: instrError } = await supabase.from('assignment_instructions').insert(rows);
      if (instrError) console.error('Error inserting assignment_instructions:', instrError);
    }

    // Requirements (similar handling if provided)
    let requirementsArr = [];
    if (Array.isArray(requirements)) requirementsArr = requirements.filter(Boolean);
    else if (typeof requirements === 'string') requirementsArr = requirements.split('\n').map(s => s.trim()).filter(Boolean);
    if (requirementsArr.length > 0) {
      const rows = requirementsArr.map((text, idx) => ({ assignment_id: createdId, position: idx + 1, text }));
      const { error: reqError } = await supabase.from('assignment_requirements').insert(rows);
      if (reqError) console.error('Error inserting assignment_requirements:', reqError);
    }

    // Resources (name, optional type/url)
    if (Array.isArray(resources) && resources.length > 0) {
      const rows = resources.map((r) => {
        const name = r?.name || (typeof r === 'string' ? r : 'Resource');
        const value = r?.value || '';
        const isUrl = typeof value === 'string' && /^(https?:)?\/\//i.test(value);
        return {
          assignment_id: createdId,
          name,
          type: r?.type || (isUrl ? 'link' : 'text'),
          url: isUrl ? value : null,
        };
      });
      const { error: resError } = await supabase.from('assignment_resources').insert(rows);
      if (resError) console.error('Error inserting assignment_resources:', resError);
    }

    // Rubric items (criteria, points)
    if (Array.isArray(rubric) && rubric.length > 0) {
      const rows = rubric.map((item) => ({
        assignment_id: createdId,
        criteria: item?.criteria || 'Criteria',
        points: Number(item?.points) || 0,
      }));
      const { error: rubError } = await supabase.from('assignment_rubric_items').insert(rows);
      if (rubError) console.error('Error inserting assignment_rubric_items:', rubError);
    }

    // Questions and options (for MCQ)
    if (Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i] || {};
        let qType = q.type || 'short-answer';
        if (qType === 'text') {
          qType = 'short-answer';
        }
        const qText = q.question || q.prompt || '';
        const qPoints = Number(q.points) || 0;
        let question = { assignment_id: createdId, position: i + 1, type: qType, question: qText, points: qPoints }
        console.log('Question:', question);
        const { data: qRow, error: qError } = await supabase
          .from('assignment_questions')
          .insert([question])
          .select()
          .single();
        if (qError) {
          console.error('Error inserting assignment_question:', qError);
          continue;
        }

        // For MCQ, insert options
        if (qType === 'multiple-choice' && Array.isArray(q.options)) {
          const options = q.options;
          const correct = q.answer; // can be value or key
          const keyFromIndex = (idx) => String.fromCharCode('A'.charCodeAt(0) + idx);

          const rows = options.map((opt, idx) => ({
            question_id: qRow.id,
            option_key: keyFromIndex(idx),
            text: typeof opt === 'string' ? opt : (opt?.text || ''),
            is_correct: (() => {
              if (typeof correct === 'number') return idx === correct;
              if (typeof correct === 'string') {
                // match by option text or key
                return correct === options[idx] || correct.toUpperCase() === keyFromIndex(idx);
              }
              return false;
            })()
          }));
          const { error: optError } = await supabase.from('assignment_question_options').insert(rows);
          if (optError) console.error('Error inserting assignment_question_options:', optError);
        }
      }
    }

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (err) {
    console.error('Error in createAssignment:', err);
    return ErrorResponse.internalServerError('An error occurred while creating assignment').send(res);
  }
};

/**
 * PUT /api/teacher/assignments/:id
 * Update an existing assignment
 */
export const updateAssignment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: assignmentId } = req.params;
    const {
      classId,
      title,
      description,
      instructions,
      requirements,
      resources,
      dueDate,
      totalPoints,
      rubric,
      questions,
      submission_type,
      status
    } = req.body;

    const supabase = getSupabaseClient();

    // Get assignment to verify ownership
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('class_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      return ErrorResponse.notFound('Assignment not found').send(res);
    }

    // Verify teacher has access
    const { data: access } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('profile_id', teacherId)
      .eq('class_id', assignment.class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this assignment').send(res);
    }

    // Parse due_date and due_time from dueDate
    let due_date_value = null;
    let due_time_value = null;
    if (dueDate) {
      if (typeof dueDate === 'string' && dueDate.includes('T')) {
        const [d, t] = dueDate.split('T');
        due_date_value = d;
        if (t) {
          const hm = t.trim().slice(0, 5); // HH:MM
          due_time_value = hm ? `${hm}:00` : null;
        }
      } else {
        due_date_value = dueDate;
      }
    }

    // Build update data with correct column names
    const updateData = {};
    if (classId !== undefined) updateData.class_id = classId;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (due_date_value !== null) updateData.due_date = due_date_value;
    if (due_time_value !== null) updateData.due_time = due_time_value;
    if (totalPoints !== undefined) updateData.total_points = totalPoints || 100;
    if (submission_type !== undefined) updateData.submission_type = submission_type || null;
    if (status !== undefined) updateData.status = status;

    // Update assignment
    const { data: updated, error: updateError } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      return ErrorResponse.internalServerError('Failed to update assignment').send(res);
    }

    // Update related data if provided
    const updatedId = updated.id;

    // Update instructions if provided
    if (instructions !== undefined) {
      // Delete existing instructions
      await supabase.from('assignment_instructions').delete().eq('assignment_id', updatedId);
      
      // Insert new instructions
      let instructionsArr = [];
      if (Array.isArray(instructions)) instructionsArr = instructions.filter(Boolean);
      else if (typeof instructions === 'string') instructionsArr = instructions.split('\n').map(s => s.trim()).filter(Boolean);
      if (instructionsArr.length > 0) {
        const rows = instructionsArr.map((text, idx) => ({ assignment_id: updatedId, position: idx + 1, text }));
        const { error: instrError } = await supabase.from('assignment_instructions').insert(rows);
        if (instrError) console.error('Error inserting assignment_instructions:', instrError);
      }
    }

    // Update requirements if provided
    if (requirements !== undefined) {
      await supabase.from('assignment_requirements').delete().eq('assignment_id', updatedId);
      
      let requirementsArr = [];
      if (Array.isArray(requirements)) requirementsArr = requirements.filter(Boolean);
      else if (typeof requirements === 'string') requirementsArr = requirements.split('\n').map(s => s.trim()).filter(Boolean);
      if (requirementsArr.length > 0) {
        const rows = requirementsArr.map((text, idx) => ({ assignment_id: updatedId, position: idx + 1, text }));
        const { error: reqError } = await supabase.from('assignment_requirements').insert(rows);
        if (reqError) console.error('Error inserting assignment_requirements:', reqError);
      }
    }

    // Update resources if provided
    if (resources !== undefined) {
      await supabase.from('assignment_resources').delete().eq('assignment_id', updatedId);
      
      if (Array.isArray(resources) && resources.length > 0) {
        const rows = resources.map((r) => {
          const name = r?.name || (typeof r === 'string' ? r : 'Resource');
          const value = r?.value || '';
          const isUrl = typeof value === 'string' && /^(https?:)?\/\//i.test(value);
          return {
            assignment_id: updatedId,
            name,
            type: r?.type || (isUrl ? 'link' : 'text'),
            url: isUrl ? value : null,
          };
        });
        const { error: resError } = await supabase.from('assignment_resources').insert(rows);
        if (resError) console.error('Error inserting assignment_resources:', resError);
      }
    }

    // Update rubric if provided
    if (rubric !== undefined) {
      await supabase.from('assignment_rubric_items').delete().eq('assignment_id', updatedId);
      
      if (Array.isArray(rubric) && rubric.length > 0) {
        const rows = rubric.map((item) => ({
          assignment_id: updatedId,
          criteria: item?.criteria || 'Criteria',
          points: Number(item?.points) || 0,
        }));
        const { error: rubError } = await supabase.from('assignment_rubric_items').insert(rows);
        if (rubError) console.error('Error inserting assignment_rubric_items:', rubError);
      }
    }

    // Update questions if provided
    if (questions !== undefined) {
      // Delete existing questions and options
      const { data: existingQuestions } = await supabase
        .from('assignment_questions')
        .select('id')
        .eq('assignment_id', updatedId);
      
      if (existingQuestions && existingQuestions.length > 0) {
        const questionIds = existingQuestions.map(q => q.id);
        await supabase.from('assignment_question_options').delete().in('question_id', questionIds);
        await supabase.from('assignment_questions').delete().eq('assignment_id', updatedId);
      }

      // Insert new questions
      if (Array.isArray(questions) && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i] || {};
          let qType = q.type || 'short-answer';
          if (qType === 'text') {
            qType = 'short-answer';
          }
          const qText = q.question || q.prompt || '';
          const qPoints = Number(q.points) || 0;
          let question = { assignment_id: updatedId, position: i + 1, type: qType, question: qText, points: qPoints }
          
          const { data: qRow, error: qError } = await supabase
            .from('assignment_questions')
            .insert([question])
            .select()
            .single();
          
          if (qError) {
            console.error('Error inserting assignment_question:', qError);
            continue;
          }

          // For MCQ, insert options
          if (qType === 'multiple-choice' && Array.isArray(q.options)) {
            const options = q.options;
            const correct = q.answer;
            const keyFromIndex = (idx) => String.fromCharCode('A'.charCodeAt(0) + idx);

            const rows = options.map((opt, idx) => ({
              question_id: qRow.id,
              option_key: keyFromIndex(idx),
              text: typeof opt === 'string' ? opt : (opt?.text || ''),
              is_correct: (() => {
                if (typeof correct === 'number') return idx === correct;
                if (typeof correct === 'string') {
                  return correct === options[idx] || correct.toUpperCase() === keyFromIndex(idx);
                }
                return false;
              })()
            }));
            const { error: optError } = await supabase.from('assignment_question_options').insert(rows);
            if (optError) console.error('Error inserting assignment_question_options:', optError);
          }
        }
      }
    }

    res.status(200).json({
      message: 'Assignment updated successfully',
      assignment: updated
    });
  } catch (err) {
    console.error('Error in updateAssignment:', err);
    return ErrorResponse.internalServerError('An error occurred while updating assignment').send(res);
  }
};

/**
 * DELETE /api/teacher/assignments/:id
 * Delete an assignment
 */
export const deleteAssignment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: assignmentId } = req.params;

    const supabase = getSupabaseClient();

    // Get assignment to verify ownership
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('class_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      return ErrorResponse.notFound('Assignment not found').send(res);
    }

    // Verify teacher has access
    const { data: access } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('profile_id', teacherId)
      .eq('class_id', assignment.class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this assignment').send(res);
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError);
      return ErrorResponse.internalServerError('Failed to delete assignment').send(res);
    }

    res.status(200).json({
      message: 'Assignment deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteAssignment:', err);
    return ErrorResponse.internalServerError('An error occurred while deleting assignment').send(res);
  }
};

/**
 * POST /api/teacher/assignments/:id/publish
 * Publish an assignment (make it visible to students)
 */
export const publishAssignment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: assignmentId } = req.params;

    const supabase = getSupabaseClient();

    // Get assignment to verify ownership
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('class_id, status')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      return ErrorResponse.notFound('Assignment not found').send(res);
    }

    // Verify teacher has access
    const { data: access } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('profile_id', teacherId)
      .eq('class_id', assignment.class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this assignment').send(res);
    }

    // Update status to published
    const { data: updated, error: updateError } = await supabase
      .from('assignments')
      .update({ status: 'published' })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error publishing assignment:', updateError);
      return ErrorResponse.internalServerError('Failed to publish assignment').send(res);
    }

    res.status(200).json({
      message: 'Assignment published successfully',
      assignment: updated
    });
  } catch (err) {
    console.error('Error in publishAssignment:', err);
    return ErrorResponse.internalServerError('An error occurred while publishing assignment').send(res);
  }
};


