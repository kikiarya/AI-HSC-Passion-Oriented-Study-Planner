import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

/**
 * GET /api/student/dashboard
 * Get dashboard overview data for student
 */
export const getDashboardData = async (req, res) => {
  try {
    console.log('req.user', req.user);
    console.log('getDashboardData');
    const studentId = req.user.id;
    const supabase = getSupabaseClient();
    
    // Get enrolled classes count
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', studentId);
    
    if (enrollError) throw enrollError;
    
    // Get upcoming assignments count
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('id, class_id, due_date, status')
      .in('class_id', enrollments.map(e => e.class_id))
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });
    
    if (assignError && assignError.code !== 'PGRST116') throw assignError;
    
    // Get recent grades (for count and recent table elsewhere)
    const { data: grades, error: gradeError } = await supabase
      .from('class_grade_history')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (gradeError && gradeError.code !== 'PGRST116') throw gradeError;

    // Get all grades to compute overall average consistently with grades summary
    const { data: allGrades, error: allGradeError } = await supabase
      .from('class_grade_history')
      .select('score, max_score')
      .eq('student_id', studentId);

    if (allGradeError && allGradeError.code !== 'PGRST116') throw allGradeError;
    
    // Calculate average grade if available (across all grades)
    let averageGrade = null;
    if (allGrades && allGrades.length > 0) {
      const validGrades = allGrades.filter(g => g.score !== null && g.max_score !== null && g.max_score > 0);
      if (validGrades.length > 0) {
        const totalPercentage = validGrades.reduce((sum, g) => sum + (g.score / g.max_score * 100), 0);
        averageGrade = Math.round(totalPercentage / validGrades.length);
      }
    }
    
    return res.json({
      success: true,
      data: {
        enrolledClassesCount: enrollments?.length || 0,
        upcomingAssignmentsCount: assignments?.length || 0,
        recentGradesCount: grades?.length || 0,
        averageGrade: averageGrade,
        completionRate: 89 // This would be calculated from actual completion data
      }
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    return ErrorResponse.internalServerError('Failed to fetch dashboard data').send(res);
  }
};

/**
 * GET /api/student/weekly-report
 * Aggregate real weekly data for the student
 */
export const getWeeklyReport = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();

    const now = new Date();
    const startOfWindow = new Date(now);
    startOfWindow.setDate(now.getDate() - 7);

    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);

    // Enrollments and classes
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`class_id, classes ( id, name )`)
      .eq('student_id', studentId);
    if (enrollError) throw enrollError;

    const classIds = (enrollments || []).map(e => e.class_id);

    // Assignments for enrolled classes
    let assignments = [];
    if (classIds.length > 0) {
      const { data: assignmentsData, error: assignError } = await supabase
      .from('assignments')
      .select(`id, title, class_id, due_date, status, weight, classes ( id, name )`)
        .in('class_id', classIds);
      if (assignError && assignError.code !== 'PGRST116') throw assignError;
      assignments = assignmentsData || [];
    }

    // Submissions in the last 7 days for this student
    let recentSubmissions = [];
    if (assignments.length > 0) {
      const assignmentIds = assignments.map(a => a.id);
      const { data: submissions, error: subError } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, status, submitted_at, grade')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds)
        .gte('submitted_at', startOfWindow.toISOString());
      if (subError && subError.code !== 'PGRST116') throw subError;
      recentSubmissions = submissions || [];
    }

    // Grades in the last 30 days for trends
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const { data: recentGrades, error: gradeError } = await supabase
      .from('class_grade_history')
      .select('class_id, score, max_score, created_at')
      .eq('student_id', studentId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    if (gradeError && gradeError.code !== 'PGRST116') throw gradeError;

    // Practice attempts (if study planner tables are present)
    let practiceAttempts = [];
    const { data: practiceData, error: practiceError } = await supabase
      .from('practice_attempts')
      .select('id, set_id, score_correct, score_total, created_at')
      .eq('student_id', studentId)
      .gte('created_at', startOfWindow.toISOString());
    // Table may not exist in some environments; ignore error PGRST116 (no rows)
    if (!practiceError || practiceError.code === 'PGRST116') {
      practiceAttempts = practiceData || [];
    }

    // Upcoming deadlines next 7 days
    let upcomingDeadlines = [];
    if (classIds.length > 0) {
      const { data: upcoming, error: upcomingError } = await supabase
        .from('assignments')
        .select(`id, title, class_id, due_date, classes ( id, name )`)
        .in('class_id', classIds)
        .gt('due_date', now.toISOString())
        .lte('due_date', next7Days.toISOString())
        .order('due_date', { ascending: true });
      if (upcomingError && upcomingError.code !== 'PGRST116') throw upcomingError;
      upcomingDeadlines = upcoming || [];
    }

    // Helper maps
    const classIdToName = new Map();
    (enrollments || []).forEach(e => {
      if (e.classes) classIdToName.set(e.class_id, e.classes.name);
    });

    const assignmentIdToAssignment = new Map(assignments.map(a => [a.id, a]));

    // Assignments completed in the last 7 days
    const assignmentsCompleted = recentSubmissions
      .filter(s => s.status === 'submitted' || s.status === 'graded')
      .map(s => {
        const a = assignmentIdToAssignment.get(s.assignment_id);
        const gradeValue = s.grade != null ? s.grade : null;
        return {
          title: a?.title || 'Assignment',
          subject: a?.classes?.name || classIdToName.get(a?.class_id) || 'Class',
          grade: gradeValue != null ? `${gradeValue}` : null,
          submittedAt: s.submitted_at
        };
      });

    // Overdue assignments count (due date passed and no submission)
    const submittedAssignmentIds = new Set(recentSubmissions.map(s => s.assignment_id));
    const overdueCount = assignments.filter(a => new Date(a.due_date) < now && !submittedAssignmentIds.has(a.id)).length;

    // Completion rate: submissions over assignments with due in window
    const dueInWindow = assignments.filter(a => {
      const d = new Date(a.due_date);
      return d >= startOfWindow && d <= now;
    });
    const completedInWindow = assignmentsCompleted.length;
    const completionRate = dueInWindow.length > 0 ? Math.round((completedInWindow / dueInWindow.length) * 100) : null;

    // Subject breakdown
    const perClassStats = new Map();
    classIds.forEach(id => perClassStats.set(id, { submissions: 0, lastStudied: null, assignmentsTotal: 0 }));
    assignments.forEach(a => {
      const stats = perClassStats.get(a.class_id) || { submissions: 0, lastStudied: null, assignmentsTotal: 0 };
      stats.assignmentsTotal += 1;
      perClassStats.set(a.class_id, stats);
    });
    recentSubmissions.forEach(s => {
      const a = assignmentIdToAssignment.get(s.assignment_id);
      if (!a) return;
      const stats = perClassStats.get(a.class_id) || { submissions: 0, lastStudied: null, assignmentsTotal: 0 };
      stats.submissions += 1;
      const ls = stats.lastStudied ? new Date(stats.lastStudied) : null;
      if (!ls || new Date(s.submitted_at) > ls) {
        stats.lastStudied = s.submitted_at;
      }
      perClassStats.set(a.class_id, stats);
    });
    (recentGrades || []).forEach(g => {
      const stats = perClassStats.get(g.class_id) || { submissions: 0, lastStudied: null, assignmentsTotal: 0 };
      const ls = stats.lastStudied ? new Date(stats.lastStudied) : null;
      if (!ls || new Date(g.created_at) > ls) {
        stats.lastStudied = g.created_at;
      }
      perClassStats.set(g.class_id, stats);
    });
    const subjects = classIds.map(id => {
      const stats = perClassStats.get(id) || { submissions: 0, lastStudied: null, assignmentsTotal: 0 };
      const progress = stats.assignmentsTotal > 0 ? Math.round((stats.submissions / stats.assignmentsTotal) * 100) : 0;
      return {
        name: classIdToName.get(id) || 'Class',
        sessions: stats.submissions,
        lastStudied: stats.lastStudied,
        progress,
        topics: []
      };
    });

    // Insights & Top focus areas
    const insights = [];
    if (overdueCount > 0) {
      insights.push({ type: 'warning', title: 'Overdue assignments', message: `${overdueCount} assignment(s) are overdue. Prioritize completing them.` });
    }

    // Grade trend: compare avg of last 7 days vs previous 7 days
    const sevenDaysAgo = startOfWindow;
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);
    const last7 = (recentGrades || []).filter(g => new Date(g.created_at) >= sevenDaysAgo);
    const prev7 = (recentGrades || []).filter(g => new Date(g.created_at) >= fourteenDaysAgo && new Date(g.created_at) < sevenDaysAgo);
    const avgPct = arr => {
      const valid = arr.filter(g => g.score != null && g.max_score != null && g.max_score > 0);
      if (valid.length === 0) return null;
      const total = valid.reduce((s, g) => s + (g.score / g.max_score * 100), 0);
      return total / valid.length;
    };
    const lastAvg = avgPct(last7);
    const prevAvg = avgPct(prev7);
    if (lastAvg != null && prevAvg != null) {
      const delta = Math.round(lastAvg - prevAvg);
      if (delta > 0) {
        insights.push({ type: 'info', title: 'Improvement noted', message: `Average grade up by ${delta}% compared to the previous week.` });
      } else if (delta < 0) {
        insights.push({ type: 'warning', title: 'Slight decline', message: `Average grade down by ${Math.abs(delta)}% vs previous week.` });
      }
    }

    // Build upcoming deadlines list with priorities
    const upcomingList = upcomingDeadlines.map(d => {
      const due = new Date(d.due_date);
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      let priority = 'Low';
      if (diffDays <= 3) priority = 'High';
      else if (diffDays <= 7) priority = 'Medium';
      return {
        title: d.title,
        subject: d.classes?.name || classIdToName.get(d.class_id) || 'Class',
        priority,
        dueDate: d.due_date
      };
    });

    // Top focus areas: choose by nearest deadlines and lowest progress subjects
    const subjectsByProgress = [...subjects].sort((a, b) => a.progress - b.progress);
    const focusAreas = [];
    if (upcomingList.length > 0) {
      const urgent = upcomingList.filter(u => u.priority === 'High').slice(0, 2);
      urgent.forEach(u => {
        focusAreas.push({
          subject: u.subject,
          priority: 'High',
          reason: `Deadline in ${Math.max(0, Math.ceil((new Date(u.dueDate) - now) / (1000*60*60*24)))} day(s).`,
          recommendation: 'Allocate time to complete before due date.'
        });
      });
    }
    if (focusAreas.length < 3 && subjectsByProgress.length > 0) {
      const low = subjectsByProgress.slice(0, 3 - focusAreas.length);
      low.forEach(s => {
        focusAreas.push({
          subject: s.name,
          priority: 'Medium',
          reason: `Low completion progress (${s.progress}%).`,
          recommendation: 'Schedule a session to catch up on pending tasks.'
        });
      });
    }

    // Study summary based on real activity counts
    const studySummary = {
      totalSessions: subjects.reduce((sum, s) => sum + (s.sessions || 0), 0),
      assignmentsCompleted: assignmentsCompleted.length,
      practiceAttempts: practiceAttempts.length,
      completionRate: completionRate,
      recommendation: completionRate != null && completionRate < 80
        ? 'Completion is below target; aim to finish pending tasks.'
        : 'Good momentum; keep up consistent study sessions.'
    };

    const startStr = startOfWindow.toLocaleDateString();
    const endStr = now.toLocaleDateString();

    return res.json({
      success: true,
      report: {
        week: `${startStr} - ${endStr}`,
        generatedAt: now.toISOString(),
        topFocusAreas: focusAreas.slice(0, 3),
        studySummary,
        insights,
        subjects,
        assignments: assignmentsCompleted,
        upcomingDeadlines: upcomingList
      }
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    return ErrorResponse.internalServerError('Failed to generate weekly report').send(res);
  }
};

/**
 * GET /api/student/classes
 * Get all enrolled classes for a student
 */
export const getStudentClasses = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();
    
    // Get enrollments with class details
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        class_id,
        enrolled_at,
        classes (
          id,
          name,
          code,
          description,
          color,
          created_at
        )
      `)
      .eq('student_id', studentId);
    
    if (enrollError) throw enrollError;
    
    if (!enrollments || enrollments.length === 0) {
      return res.json({
        success: true,
        classes: []
      });
    }
    
    // Get class teachers for each class
    const classIds = enrollments.map(e => e.class_id);
    const { data: classTeachers, error: teacherError } = await supabase
      .from('class_teachers')
      .select(`
        class_id,
        profiles!class_teachers_profile_id_fkey (
          id,
          name,
          email
        )
      `)
      .in('class_id', classIds);
    
    if (teacherError && teacherError.code !== 'PGRST116') throw teacherError;
    
    // Get assignment counts for each class
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('id, class_id, status')
      .in('class_id', classIds);
    
    if (assignError && assignError.code !== 'PGRST116') throw assignError;
    
    // Get grades for calculating progress
    const { data: grades, error: gradeError } = await supabase
      .from('class_grade_history')
      .select('class_id, score, max_score')
      .eq('student_id', studentId)
      .in('class_id', classIds);
    
    if (gradeError && gradeError.code !== 'PGRST116') throw gradeError;
    
    // Build class list with additional data
    const classes = enrollments.map(enrollment => {
      const classData = enrollment.classes;
      const teachers = classTeachers?.filter(ct => ct.class_id === enrollment.class_id) || [];
      const classAssignments = assignments?.filter(a => a.class_id === enrollment.class_id) || [];
      const classGrades = grades?.filter(g => g.class_id === enrollment.class_id) || [];
      
      // Calculate average grade for this class
      let grade = 'N/A';
      if (classGrades.length > 0) {
        const validGrades = classGrades.filter(g => g.score !== null && g.max_score !== null);
        if (validGrades.length > 0) {
          const avgPercentage = validGrades.reduce((sum, g) => sum + (g.score / g.max_score * 100), 0) / validGrades.length;
          if (avgPercentage >= 90) grade = 'A+';
          else if (avgPercentage >= 85) grade = 'A';
          else if (avgPercentage >= 80) grade = 'A-';
          else if (avgPercentage >= 75) grade = 'B+';
          else if (avgPercentage >= 70) grade = 'B';
          else if (avgPercentage >= 65) grade = 'B-';
          else if (avgPercentage >= 60) grade = 'C+';
          else if (avgPercentage >= 55) grade = 'C';
          else grade = 'D';
        }
      }
      
      const teacherName = teachers.length > 0 && teachers[0].profiles
        ? (teachers[0].profiles.name || 'TBA')
        : 'TBA';
      
      return {
        id: classData.id,
        name: classData.name,
        code: classData.code,
        description: classData.description,
        teacher: teacherName,
        grade: grade,
        progress: Math.min(100, classGrades.length * 10), // Simple progress calculation
        assignments: classAssignments.length,
        nextClass: 'TBA', // Would need schedule data
        color: classData.color || '#718096'
      };
    });
    
    return res.json({
      success: true,
      classes
    });
  } catch (error) {
    console.error('Get student classes error:', error);
    return ErrorResponse.internalServerError('Failed to fetch student classes').send(res);
  }
};

/**
 * GET /api/student/classes/:id
 * Get details for a specific class
 */
export const getClassDetail = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id: classId } = req.params;
    const supabase = getSupabaseClient();
    
    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single();
    
    if (enrollError || !enrollment) {
      return ErrorResponse.notFound('Class not found or you are not enrolled').send(res);
    }
    
    // Get class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();
    
    if (classError) throw classError;
    
    // Get teacher info
    const { data: teachers, error: teacherError } = await supabase
      .from('class_teachers')
      .select(`
        profiles!class_teachers_profile_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('class_id', classId);
    
    if (teacherError && teacherError.code !== 'PGRST116') throw teacherError;
    
    // Get schedule sessions
    const { data: schedule, error: scheduleError } = await supabase
      .from('class_schedule_sessions')
      .select('*')
      .eq('class_id', classId)
      .order('time_range', { ascending: true });
    
    if (scheduleError && scheduleError.code !== 'PGRST116') throw scheduleError;
    
    return res.json({
      success: true,
      class: {
        ...classData,
        teachers: teachers || [],
        schedule: schedule || []
      }
    });
  } catch (error) {
    console.error('Get class detail error:', error);
    return ErrorResponse.internalServerError('Failed to fetch class details').send(res);
  }
};

// Helper function to assign colors based on subject
function getSubjectColor(subject) {
  const colors = {
    'Mathematics': '#667eea',
    'English': '#f56565',
    'Science': '#48bb78',
    'History': '#ed8936',
    'default': '#718096'
  };
  return colors[subject] || colors.default;
}

