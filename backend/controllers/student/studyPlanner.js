import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL 
  || process.env.OPENAI_URL 
  || process.env.VITE_OPENAI_BASE_URL 
  || 'https://api.zmon.me/v1';

/**
 * UC2: Personalized Study Plan Generation
 * Generate an AI-powered personalized study plan for a student
 */
export const generateStudyPlan = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      subjects,
      exam_dates,
      available_hours_per_week,
      preferences
    } = req.body;

    // Validate required fields
    if (!subjects || subjects.length === 0) {
      return ErrorResponse.badRequest('Subjects are required').send(res);
    }

    const supabase = getSupabaseClient();

    // Fetch student's performance data
    // Helper function to extract subject from class name
    const extractSubjectFromClassName = (className) => {
      if (!className) return 'General';
      
      const lowerName = className.toLowerCase();
      if (lowerName.includes('math')) return 'Mathematics';
      if (lowerName.includes('physic')) return 'Physics';
      if (lowerName.includes('chem')) return 'Chemistry';
      if (lowerName.includes('bio')) return 'Biology';
      if (lowerName.includes('english')) return 'English';
      if (lowerName.includes('history')) return 'History';
      if (lowerName.includes('geo')) return 'Geography';
      if (lowerName.includes('computer') || lowerName.includes('software') || lowerName.includes('elec')) return 'Computer Science';
      if (lowerName.includes('business') || lowerName.includes('commerce')) return 'Business Studies';
      if (lowerName.includes('econ')) return 'Economics';
      
      // Return first word as subject if no match
      return className.split(/[\s-]/)[0];
    };

    // Fetch recent graded submissions (removed subject to avoid DB error)
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        grade,
        submitted_at,
        assignments (
          id,
          title,
          class_id,
          classes (
            name
          )
        )
      `)
      .eq('student_id', studentId)
      .not('grade', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(20);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
    }

    // Fetch upcoming assignments (removed subject to avoid DB error)
    const { data: upcomingAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        due_date,
        total_points,
        classes (
          name
        )
      `)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(10);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
    }

    // Process performance data by subject
    const performanceData = [];
    if (submissions && submissions.length > 0) {
      const subjectGrades = {};
      
      submissions.forEach(sub => {
        if (sub.assignments?.classes?.name) {
          // Extract subject from class name (fallback if subject column doesn't exist)
          const subject = extractSubjectFromClassName(sub.assignments.classes.name);
          
          if (!subjectGrades[subject]) {
            subjectGrades[subject] = [];
          }
          if (sub.grade !== null) {
            subjectGrades[subject].push(sub.grade);
          }
        }
      });

      Object.keys(subjectGrades).forEach(subject => {
        const grades = subjectGrades[subject];
        if (grades.length > 0) {
          const recentGrades = grades.slice(0, 5);
          performanceData.push({
            subject: subject,
            recent_grades: recentGrades,
            average: Math.round(recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length)
          });
        }
      });
    }

    // Process upcoming assignments
    const upcomingData = [];
    if (upcomingAssignments && upcomingAssignments.length > 0) {
      upcomingAssignments.forEach(assignment => {
        if (assignment.classes?.name) {
          upcomingData.push({
            subject: extractSubjectFromClassName(assignment.classes.name),
            title: assignment.title,
            due_date: assignment.due_date,
            weight: assignment.total_points || 100
          });
        }
      });
    }

    // If no OpenAI API key, return mock data
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured - using mock data');
      console.log('📚 Selected subjects:', subjects);
      console.log('🎯 User preferences:', preferences);
      return res.json({
        study_plan: generateMockStudyPlan(subjects, performanceData, upcomingData),
        mock: true,
        message: 'OpenAI API key not configured, returning mock study plan'
      });
    }

    console.log('🤖 Calling OpenAI API for study plan generation');
    console.log('📚 Subjects:', subjects);
    console.log('⏰ Available hours:', available_hours_per_week);
    console.log('🎯 Preferences:', preferences);

    // Load instruction from file
    const instructionPath = path.join(__dirname, '../../instructions/study-plan-instruction.md');
    let instruction = '';
    try {
      instruction = fs.readFileSync(instructionPath, 'utf-8');
    } catch (error) {
      console.error('Error reading instruction file:', error);
      instruction = 'You are an expert educational AI assistant. Generate a personalized study plan for HSC students.';
    }

    // Prepare the prompt for OpenAI
    const requestData = {
      subjects: subjects,
      exam_dates: exam_dates || {},
      available_hours_per_week: available_hours_per_week || 20,
      performance_data: performanceData,
      upcoming_assignments: upcomingData,
      preferences: preferences || {}
    };

    const prompt = `Generate a personalized study plan based on the following student data:

**Selected Subjects (MUST generate suggestions for ALL subjects):**
${subjects.join(', ')}

**Student Performance Data:**
${JSON.stringify(performanceData, null, 2)}

**Upcoming Assignments:**
${JSON.stringify(upcomingData, null, 2)}

**Available Study Time:**
${available_hours_per_week} hours per week

**Learning Preferences (MUST consider these):**
- Learning Style: ${preferences?.learning_style || 'not specified'}
- Preferred Study Time: ${preferences?.study_time_preference || 'not specified'}
- Break Frequency: ${preferences?.break_frequency || 'not specified'}

**Exam Dates:**
${JSON.stringify(exam_dates || {}, null, 2)}

IMPORTANT REQUIREMENTS:
1. Generate at least one study suggestion for EACH subject: ${subjects.join(', ')}
2. Consider the student's learning style (${preferences?.learning_style || 'visual'}) when recommending study activities
3. Align study times with their preferred time (${preferences?.study_time_preference || 'evening'})
4. Respect their break frequency preference (${preferences?.break_frequency || 'every hour'})
5. Prioritize based on performance data and upcoming deadlines
6. Return a JSON array of ${Math.max(subjects.length, 4)}-${subjects.length + 3} study suggestions

Please return ONLY the JSON array following the format specified in the instructions.`;

    // Call OpenAI API
    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: instruction
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        // Gracefully handle non-2xx without noisy error logs; fallback handled below
        throw new Error(`Service unavailable: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Extract JSON from response (handle markdown code blocks)
      let studyPlan;
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        studyPlan = JSON.parse(jsonString);
      } else {
        studyPlan = JSON.parse(aiResponse);
      }

      console.log('✅ OpenAI API success! Generated', studyPlan.length, 'study suggestions');
      console.log('📊 AI considered:', subjects.length, 'subjects,', performanceData.length, 'performance data points');
      
      return res.json({
        study_plan: studyPlan,
        ai_generated: true,
        mock: false,
        used_preferences: preferences,
        student_data: {
          subjects_count: subjects.length,
          performance_data_points: performanceData.length,
          upcoming_assignments_count: upcomingData.length
        }
      });

    } catch (apiError) {
      console.warn('OpenAI 不可用，已自动降级为本地数据：', apiError?.message || apiError);
      console.log('⚠️ Falling back to mock data');
      
      // Fallback to mock data if API fails
      return res.json({
        study_plan: generateMockStudyPlan(subjects, performanceData, upcomingData),
        mock: true,
        error: 'ai_service_unavailable',
        message: apiError?.message || 'OpenAI unavailable',
        used_preferences: preferences
      });
    }

  } catch (error) {
    console.error('Generate study plan error:', error);
    return ErrorResponse.internalServerError('Failed to generate study plan').send(res);
  }
};

/**
 * Save study plan preferences
 */
export const saveStudyPlanPreferences = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { preferences } = req.body;

    const supabase = getSupabaseClient();

    // Try to update preferences (will fail if column doesn't exist)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      console.error('Error saving preferences:', error);
      console.log('⚠️ study_preferences column may not exist - preferences not persisted');
      // Return success anyway (preferences will be used for current session)
      return res.json({
        message: 'Preferences saved for current session (database migration needed for persistence)',
        warning: 'Run database migration to enable permanent storage'
      });
    }

    return res.json({
      message: 'Preferences saved for current session',
      note: 'Run database migration to enable permanent storage'
    });

  } catch (error) {
    console.error('Save preferences error:', error);
    // Return success anyway (preferences will be used for current session)
    return res.json({
      message: 'Preferences saved for current session',
      warning: 'Database migration needed for permanent storage'
    });
  }
};

/**
 * Get saved study plan preferences
 */
export const getStudyPlanPreferences = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      // Return empty preferences instead of error if column doesn't exist
      console.log('⚠️ study_preferences column may not exist in database - returning default preferences');
      return res.json({
        preferences: {},
        message: 'Using default preferences (database column may not exist yet)'
      });
    }

    // Return empty preferences (column may not exist in schema yet)
    // This will be populated once the database migration is run
    return res.json({
      preferences: {},
      message: 'Default preferences (run database migration to enable storage)'
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    // Return empty preferences instead of error
    return res.json({
      preferences: {},
      message: 'Using default preferences'
    });
  }
};

/**
 * Generate mock study plan for development/fallback
 */
function generateMockStudyPlan(subjects, performanceData, upcomingAssignments) {
  const mockPlan = [];
  let idCounter = 1;

  // High priority item based on upcoming assignment
  if (upcomingAssignments && upcomingAssignments.length > 0) {
    const nextAssignment = upcomingAssignments[0];
    const daysUntilDue = Math.ceil((new Date(nextAssignment.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    mockPlan.push({
      id: `plan_${idCounter++}`,
      subject: nextAssignment.subject,
      topic: `Preparation for "${nextAssignment.title}"`,
      duration: '2 hours',
      priority: daysUntilDue <= 7 ? 'high' : 'medium',
      reason: `Assignment due in ${daysUntilDue} days - focus on completing requirements and reviewing key concepts`,
      profileEvidence: [
        `Assignment "${nextAssignment.title}" due ${nextAssignment.due_date}`,
        `Worth ${nextAssignment.weight} points`,
        'Completing on time is crucial for maintaining good grades'
      ],
      curriculumRules: [
        `This assessment contributes to your final ${nextAssignment.subject} grade`,
        'Demonstrates understanding of recent course content'
      ],
      performanceData: [
        {
          label: 'Assignment Weight',
          value: `${nextAssignment.weight} pts`,
          color: '#3182ce'
        },
        {
          label: 'Days Remaining',
          value: `${daysUntilDue} days`,
          color: daysUntilDue <= 3 ? '#f56565' : '#ed8936'
        }
      ],
      expectedOutcome: `Complete the assignment with thorough understanding and quality work, targeting ${nextAssignment.weight * 0.8}+ points.`,
      recommended_resources: [
        'Course textbook - relevant chapters',
        'Lecture notes and slides',
        'Assignment rubric and requirements',
        'Past examples or samples (if available)'
      ],
      study_activities: [
        'Review assignment requirements and rubric (20 min)',
        'Gather and organize necessary materials (25 min)',
        'Work on assignment tasks (60 min)',
        'Review and refine your work (15 min)'
      ]
    });
  }

  // Medium priority item based on performance data
  if (performanceData && performanceData.length > 0) {
    performanceData.forEach((perf, index) => {
      if (index < 2) { // Limit to 2 performance-based suggestions
        const needsImprovement = perf.average < 75;
        
        mockPlan.push({
          id: `plan_${idCounter++}`,
          subject: perf.subject,
          topic: needsImprovement ? 'Review Challenging Concepts' : 'Practice and Consolidation',
          duration: needsImprovement ? '2 hours' : '1.5 hours',
          priority: needsImprovement ? 'high' : 'medium',
          reason: needsImprovement 
            ? `Recent average of ${perf.average}% suggests this subject needs focused attention`
            : `Strong performance at ${perf.average}% - maintain momentum with targeted practice`,
          profileEvidence: [
            `Recent average: ${perf.average}%`,
            `Based on last ${perf.recent_grades.length} assessments`,
            needsImprovement ? 'Below target performance level' : 'Strong consistent performance'
          ],
          curriculumRules: [
            `${perf.subject} is a core HSC subject`,
            'Regular practice maintains and improves understanding'
          ],
          performanceData: [
            {
              label: 'Recent Average',
              value: `${perf.average}%`,
              color: perf.average >= 85 ? '#48bb78' : perf.average >= 70 ? '#ed8936' : '#f56565'
            },
            {
              label: 'Target',
              value: '85%+',
              color: '#3182ce'
            }
          ],
          expectedOutcome: needsImprovement
            ? `Improve understanding of weak areas and raise average to 80%+`
            : `Solidify existing knowledge and push towards 90%+ excellence`,
          recommended_resources: [
            'Textbook chapters covering recent topics',
            'Khan Academy or similar online resources',
            'Practice problems and past papers',
            'Study group discussions'
          ],
          study_activities: needsImprovement ? [
            'Identify specific topics causing difficulty (15 min)',
            'Review lecture notes and textbook (45 min)',
            'Work through guided examples (30 min)',
            'Practice problems independently (30 min)'
          ] : [
            'Review recent material (20 min)',
            'Attempt challenging practice problems (40 min)',
            'Review mistakes and create summary notes (30 min)'
          ]
        });
      }
    });
  }

  // Generate study suggestions for ALL selected subjects
  // Create a Set to track subjects already covered
  const coveredSubjects = new Set(mockPlan.map(item => item.subject));
  
  subjects.forEach((subject) => {
    // Add suggestion for this subject if not already covered
    if (!coveredSubjects.has(subject)) {
      mockPlan.push({
        id: `plan_${idCounter++}`,
        subject: subject,
        topic: 'Regular Study and Review',
        duration: '1 hour',
        priority: 'medium',
        reason: 'Consistent study across all subjects maintains a strong foundation',
        profileEvidence: [
          'Part of your enrolled subjects',
          'Regular engagement needed for HSC success'
        ],
        curriculumRules: [
          'HSC requires comprehensive knowledge across all subjects',
          'Regular review prevents knowledge decay'
        ],
        performanceData: [
          {
            label: 'Study Frequency',
            value: 'Weekly',
            color: '#3182ce'
          }
        ],
        expectedOutcome: 'Stay current with course content and maintain understanding',
        recommended_resources: [
          'Course materials and textbooks',
          'Online learning platforms',
          'Practice exercises'
        ],
        study_activities: [
          'Review this week\'s lessons (20 min)',
          'Complete practice exercises (30 min)',
          'Prepare for upcoming classes (10 min)'
        ]
      });
    }
  });

  return mockPlan;
}

