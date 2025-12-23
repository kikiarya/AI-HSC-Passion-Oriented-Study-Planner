import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/student/grades
 * Get all grades for a student
 */
export const getStudentGrades = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();
    
    // 1) Pull grades from assignment_submissions (what teachers update when grading)
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        grade,
        feedback,
        status,
        created_at,
        updated_at,
        assignment_id,
        assignments:assignment_id (
          id,
          title,
          total_points,
          weight,
          class_id,
          due_date,
          due_time,
          classes:class_id (
            id,
            name,
            code,
            color
          )
        )
      `)
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });
    
    if (submissionsError) {
      console.error('Error fetching assignment submissions for grades:', submissionsError);
    }
    
    const submissionGrades = (submissions || [])
      // Prefer showing only graded items to avoid blanks
      .filter(s => s.grade != null || s.status === 'graded')
      .map(s => {
        const maxScore = s.assignments?.total_points ?? 0;
        const score = s.grade ?? 0;
        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        let letterGrade = 'F';
        if (percentage >= 90) letterGrade = 'A';
        else if (percentage >= 80) letterGrade = 'B';
        else if (percentage >= 70) letterGrade = 'C';
        else if (percentage >= 60) letterGrade = 'D';
        return {
          id: s.id,
          assignment: s.assignments?.title || 'Assignment',
          class: s.assignments?.classes?.name || 'Unknown Class',
          classCode: s.assignments?.classes?.code || '',
          classColor: s.assignments?.classes?.color || '#6366f1',
          score: score,
          maxScore: maxScore,
          weight: s.assignments?.weight ?? null,
          percentage: percentage,
          grade: s.grade != null ? letterGrade : '-',
          date: s.updated_at || s.created_at,
          classId: s.assignments?.class_id
        };
      });

    // 2) Also include any historical manual grades from class_grade_history (if used anywhere)
    const { data: gradeHistory, error: gradeHistoryError } = await supabase
      .from('class_grade_history')
      .select(`
        id,
        assessment,
        score,
        max_score,
        weight,
        created_at,
        class_id,
        classes (
          id,
          name,
          code,
          color
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (gradeHistoryError) {
      console.error('Error fetching class grade history:', gradeHistoryError);
    }

    const historyGrades = (gradeHistory || []).map(grade => {
      const percentage = grade.max_score > 0
        ? Math.round((grade.score / grade.max_score) * 100)
        : 0;
      let letterGrade = 'F';
      if (percentage >= 90) letterGrade = 'A';
      else if (percentage >= 80) letterGrade = 'B';
      else if (percentage >= 70) letterGrade = 'C';
      else if (percentage >= 60) letterGrade = 'D';
      return {
        id: grade.id,
        assignment: grade.assessment,
        class: grade.classes?.name || 'Unknown Class',
        classCode: grade.classes?.code || '',
        classColor: grade.classes?.color || '#6366f1',
        score: grade.score,
        maxScore: grade.max_score,
        weight: grade.weight,
        percentage: percentage,
        grade: letterGrade,
        date: grade.created_at,
        classId: grade.class_id
      };
    });

    // Merge, sort by date desc, and return
    const merged = [...submissionGrades, ...historyGrades]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return res.status(200).json({
      success: true,
      grades: merged
    });
    
  } catch (error) {
    console.error('Unexpected error in getStudentGrades:', error);
    return ErrorResponse.internalServerError('An unexpected error occurred').send(res);
  }
};

