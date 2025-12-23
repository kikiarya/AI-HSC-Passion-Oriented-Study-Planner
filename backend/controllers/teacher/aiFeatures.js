import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: OpenAI integration requires OPENAI_API_KEY (or compatible alias) in environment
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY
  || process.env.OPENAI_KEY
  || process.env.VITE_OPENAI_API_KEY
  || '').trim();
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL
  || process.env.OPENAI_URL
  || process.env.VITE_OPENAI_BASE_URL
  || 'https://api.zmon.me/v1';

/**
 * UC10: AI-Generated Assessment Rubric
 * Generate a rubric for an assignment using AI
 */
export const generateRubric = async (req, res) => {
  try {
    const {
      assignment_title,
      assignment_description,
      submission_type,
      total_points,
      learning_objectives,
      force_mock
    } = req.body;

    if (!assignment_title) {
      return ErrorResponse.badRequest('Assignment title is required').send(res);
    }

    const pointsTarget = Number(total_points) || 100;

    // Force mock path (or when API key not configured)
    if (force_mock || !OPENAI_API_KEY) {
      // Return a mock rubric for development
      return res.json({
        rubric: generateMockRubric(assignment_title, pointsTarget),
        ai_generated: true,
        mock: true,
        message: force_mock ? 'Forced mock rubric' : 'OpenAI API key not configured, returning mock rubric'
      });
    }

    // Load instruction from file
    const instructionPath = path.join(__dirname, '../../instructions/assignment-rubric-instruction.md');
    let instruction = '';
    try {
      instruction = fs.readFileSync(instructionPath, 'utf-8');
    } catch (error) {
      instruction = 'You are an educational assessment expert. Generate a rubric JSON array with criteria, description, points, and levels.';
    }

    // Prepare details for user message
    const prompt = `Generate a rubric for this assignment:\n\nTitle: ${assignment_title}\nDescription: ${assignment_description || 'Not provided'}\nType: ${submission_type || 'General assignment'}\nTotal Points: ${pointsTarget}\nLearning Objectives: ${Array.isArray(learning_objectives) ? learning_objectives.join(', ') : (learning_objectives || 'Not specified')}\n\nReturn ONLY the JSON array.`;

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
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rubricText = data.choices[0].message.content;
      
      // Try to parse JSON from response
      let rubric;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = rubricText.match(/```json\n([\s\S]*?)\n```/) || rubricText.match(/\[[\s\S]*\]/);
        rubric = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : rubricText);
      } catch (parseError) {
        console.error('Failed to parse AI rubric:', parseError);
        rubric = generateMockRubric(assignment_title, pointsTarget);
      }
      // Scale rubric points to target total if needed
      rubric = Array.isArray(rubric) ? rubric : [];
      const scaled = scaleRubricToTotal(rubric, pointsTarget);

      return res.json({
        rubric: scaled,
        ai_generated: true,
        mock: false
      });

    } catch (apiError) {
      console.warn('AI rubric service unavailable, using fallback:', apiError?.message || apiError);
      // Fallback to mock rubric
      return res.json({
        rubric: generateMockRubric(assignment_title, pointsTarget),
        ai_generated: true,
        mock: true,
        message: 'AI generation failed, returning mock rubric'
      });
    }

  } catch (err) {
    console.error('Generate rubric error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * UC13: AI-Generated Assignment
 * Generate a complete assignment spec (title, description, questions, rubric)
 */
export const generateAssignment = async (req, res) => {
  try {
    const {
      subject,
      topic,
      difficulty,
      assignment_type,
      question_count,
      total_points,
      class_id,
      source
    } = req.body || {};

    const pointsTargetA = Number(total_points) || 100;

    // Always prefer DB-driven generation unless explicitly forced to AI
    if (!source || source === 'db') {
      const dbAssignment = await generateAssignmentFromDatabase({
        req,
        subject,
        topic,
        difficulty,
        assignment_type,
        question_count: Number(question_count) || 6,
        total_points: pointsTargetA,
        class_id
      });
      return res.json({ assignment: dbAssignment, ai_generated: false, mock: false, source: 'db' });
    }

    // Load instruction from file
    const instructionPath = path.join(__dirname, '../../instructions/assignment-generation-instruction.md');
    let instruction = '';
    try {
      instruction = fs.readFileSync(instructionPath, 'utf-8');
    } catch (error) {
      instruction = 'You generate complete assignments with questions and rubric. Return a JSON object as specified.';
    }

    const details = {
      subject: subject || 'General Studies',
      topic: topic || 'Core Concepts',
      difficulty: difficulty || 'medium',
      assignment_type: assignment_type || 'quiz',
      question_count: Number(question_count) || 5,
      total_points: pointsTargetA
    };

    const userPrompt = `Generate an assignment using these details:\n${JSON.stringify(details, null, 2)}\n\nReturn ONLY the JSON object.`;

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
            { role: 'system', content: instruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1800
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const assignment = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
      assignment.total_points = pointsTargetA;
      if (Array.isArray(assignment.rubric)) {
        assignment.rubric = scaleRubricToTotal(assignment.rubric, pointsTargetA);
      }

      return res.json({ assignment, ai_generated: true, mock: false });
    } catch (apiError) {
      console.error('OpenAI assignment generation failed:', apiError);
      // Fall back to database-driven generation instead of mock
      const dbAssignment = await generateAssignmentFromDatabase({
        req,
        subject: details.subject,
        topic: details.topic,
        difficulty: details.difficulty,
        assignment_type: details.assignment_type,
        question_count: details.question_count,
        total_points: pointsTargetA,
        class_id
      });
      return res.json({ assignment: dbAssignment, ai_generated: false, mock: false, source: 'db_fallback' });
    }
  } catch (err) {
    console.error('Generate assignment error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * UC11: Content Summarisation
 * Summarize student submissions or learning materials
 */
export const summarizeContent = async (req, res) => {
  try {
    const { content, content_type, max_length } = req.body;

    if (!content) {
      return ErrorResponse.badRequest('Content is required').send(res);
    }

    if (!OPENAI_API_KEY) {
      return res.json({
        summary: `Summary not available (OpenAI API key not configured). Original content: ${content.substring(0, 200)}...`,
        mock: true
      });
    }

    const prompt = `Summarize the following ${content_type || 'text'} concisely${max_length ? ` in about ${max_length} words` : ''}:

${content}

Provide a clear, informative summary that captures the main points.`;

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
              content: 'You are a helpful assistant that summarizes content clearly and concisely.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const summary = data.choices[0].message.content;

      return res.json({
        summary,
        ai_generated: true,
        mock: false
      });

    } catch (apiError) {
      console.error('OpenAI API call failed:', apiError);
      return res.json({
        summary: `AI summarization unavailable. Content preview: ${content.substring(0, 300)}...`,
        mock: true,
        error: apiError.message
      });
    }

  } catch (err) {
    console.error('Summarize content error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * UC04: Auto-grade submission using AI
 */
export const autoGradeSubmission = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { submission_id, assignment_id } = req.body;
    const supabase = getSupabaseClient();

    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
      assignments:assignment_id (
        id,
        title,
        description,
        total_points,
        class_id,
        submission_type
      )
      `)
      .eq('id', submission_id)
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

    // Get submission answers
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
      .eq('submission_id', submission_id);

    if (!OPENAI_API_KEY) {
      // Check if there's any submission content
      const hasContent = (submission.text_response && submission.text_response.trim().length > 0) || (answers && answers.length > 0);
      
      if (!hasContent) {
        return res.json({
          grade: null,
          feedback: 'No submission content found. Please ensure the student has submitted their work.',
          mock: true,
          error: 'No submission content'
        });
      }
      
      // Return mock grading
      const mockGrade = Math.floor(Math.random() * 20) + 80; // 80-100
      return res.json({
        grade: mockGrade,
        feedback: 'Auto-grading not available (OpenAI API key not configured). This is a mock grade based on the submission content.',
        mock: true,
        answer_grades: answers?.map(a => ({
          answer_id: a.id,
          points_earned: Math.floor((mockGrade / 100) * (a.questions?.points || 0)),
          feedback: 'Mock feedback'
        }))
      });
    }

    // Build prompt for AI grading
    const hasTextResponse = submission.text_response && submission.text_response.trim().length > 0;
    const hasAnswers = answers && answers.length > 0;

    let submissionContent = '';
    
    if (hasTextResponse) {
      submissionContent += `\nWritten Response:\n${submission.text_response}\n`;
    }
    
    if (hasAnswers) {
      submissionContent += `\nQuiz/Question Answers:\n${answers.map((a, idx) => `
Question ${idx + 1}: ${a.questions.question_text}
Student Answer: ${a.answer_text || 'No answer provided'}
Points Available: ${a.questions.points}
`).join('\n')}`;
    }

    if (!hasTextResponse && !hasAnswers) {
      return res.json({
        grade: null,
        feedback: 'No submission was received. The answers field shows \'undefined\', indicating that no responses were provided for this assignment. Please submit your completed work to receive a grade and feedback.',
        mock: true,
        error: 'No submission content found'
      });
    }

    const prompt = `Grade the following student submission:

Assignment: ${submission.assignments.title}
Description: ${submission.assignments.description || 'Not provided'}
Total Points: ${submission.assignments.total_points}
Type: ${submission.assignments.submission_type || 'General'}

Student Submission:${submissionContent}

Provide:
1. Total grade (out of ${submission.assignments.total_points})
2. Overall feedback (2-3 sentences)
3. Individual grades for each question (if applicable)
4. Brief feedback for each answer (if applicable)

Format as JSON:
{
  "total_grade": number,
  "overall_feedback": "string",
  "answer_grades": [
    {
      "question_number": number,
      "points_earned": number,
      "feedback": "string"
    }
  ]
}`;

    try {
      console.log(`[AI Auto-Grade] Calling OpenAI API with key: ${OPENAI_API_KEY.substring(0, 7)}...${OPENAI_API_KEY.slice(-4)}`);
      
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
              content: 'You are a fair and constructive educational grader. Provide accurate grades and helpful feedback.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      console.log(`[AI Auto-Grade] OpenAI API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[AI Auto-Grade] OpenAI API error response:`, errorBody);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const gradingText = data.choices[0].message.content;
      
      // Parse JSON response
      const jsonMatch = gradingText.match(/```json\n([\s\S]*?)\n```/) || gradingText.match(/\{[\s\S]*\}/);
      const grading = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : gradingText);

      return res.json({
        grade: grading.total_grade,
        feedback: grading.overall_feedback,
        answer_grades: grading.answer_grades?.map((ag, idx) => ({
          answer_id: answers[idx]?.id,
          points_earned: ag.points_earned,
          feedback: ag.feedback
        })),
        ai_generated: true,
        mock: false
      });

    } catch (apiError) {
      console.error('OpenAI auto-grading failed:', apiError);
      const mockGrade = Math.floor(Math.random() * 20) + 80;
      const isUnauthorized = typeof apiError?.message === 'string' && apiError.message.includes('401');
      return res.json({
        grade: mockGrade,
        feedback: isUnauthorized
          ? '自动评分暂不可用（OpenAI API 未授权）。当前返回的是模拟分数，请手动检查后调整。'
          : 'AI 自动评分出现异常，已返回备用分数，请手动检查后调整。',
        mock: true,
        error: apiError.message
      });
    }

  } catch (err) {
    console.error('Auto-grade submission error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * UC07: Analyze class performance with AI insights
 */
export const analyzeClassPerformance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { class_id } = req.body;
    const supabase = getSupabaseClient();

    // Verify teacher has access
    const { data: access } = await supabase
      .from('class_teachers')
      .select('role_in_class')
      .eq('profile_id', teacherId)
      .eq('class_id', class_id)
      .single();

    if (!access) {
      return ErrorResponse.forbidden('You do not have access to this class').send(res);
    }

    // Get class performance data
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('grade, total_points, submitted_at')
      .eq('class_id', class_id)
      .not('grade', 'is', null);

    const grades = submissions?.map(s => (s.grade / s.total_points) * 100) || [];
    const avgGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

    if (!OPENAI_API_KEY) {
      return res.json({
        insights: [
          `Class average: ${Math.round(avgGrade)}%`,
          `Total graded submissions: ${grades.length}`,
          'AI insights not available (OpenAI API key not configured)'
        ],
        recommendations: [
          'Review assignments with low completion rates',
          'Provide additional support for struggling students'
        ],
        mock: true
      });
    }

    const prompt = `Analyze this class performance data and provide insights:

Average Grade: ${Math.round(avgGrade)}%
Total Submissions: ${grades.length}
Grade Distribution: 
- A (90-100): ${grades.filter(g => g >= 90).length}
- B (80-89): ${grades.filter(g => g >= 80 && g < 90).length}
- C (70-79): ${grades.filter(g => g >= 70 && g < 80).length}
- D (60-69): ${grades.filter(g => g >= 60 && g < 70).length}
- F (0-59): ${grades.filter(g => g < 60).length}

Provide:
1. 3-5 key insights about class performance
2. 3-5 actionable recommendations for the teacher
3. Areas of concern (if any)

Format as JSON:
{
  "insights": ["string"],
  "recommendations": ["string"],
  "concerns": ["string"]
}`;

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
              content: 'You are an educational data analyst providing actionable insights for teachers.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || analysisText.match(/\{[\s\S]*\}/);
      const analysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText);

      return res.json({
        ...analysis,
        class_average: Math.round(avgGrade),
        total_submissions: grades.length,
        ai_generated: true,
        mock: false
      });

    } catch (apiError) {
      console.error('OpenAI analysis failed:', apiError);
      const isUnauthorized = typeof apiError?.message === 'string' && apiError.message.includes('401');
      return res.json({
        insights: [
          `Class average: ${Math.round(avgGrade)}%`,
          `Total graded submissions: ${grades.length}`,
          isUnauthorized
            ? 'AI 分析暂不可用（OpenAI API 未授权）。'
            : 'AI 分析暂不可用，已提供基础数据。'
        ],
        recommendations: [
          '关注低提交率或低分学生，及时跟进支持',
          '请在稍后再次尝试生成 AI 洞察'
        ],
        mock: true,
        error: apiError.message
      });
    }

  } catch (err) {
    console.error('Analyze class performance error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Helper function to generate mock rubric
 */
function generateMockRubric(title, totalPoints) {
  const criteriaCount = 4;
  const pointsPerCriteria = Math.floor(totalPoints / criteriaCount);
  
  const criteria = [
    {
      criteria: 'Content Quality',
      description: 'Demonstrates understanding of key concepts and provides thorough analysis',
      points: pointsPerCriteria,
      levels: {
        excellent: 'Exceptional depth of understanding with insightful analysis',
        good: 'Good understanding with adequate analysis',
        fair: 'Basic understanding with limited analysis',
        poor: 'Minimal understanding or analysis'
      }
    },
    {
      criteria: 'Organization',
      description: 'Clear structure with logical flow of ideas',
      points: pointsPerCriteria,
      levels: {
        excellent: 'Highly organized with seamless transitions',
        good: 'Well organized with clear structure',
        fair: 'Somewhat organized but could be clearer',
        poor: 'Disorganized or confusing structure'
      }
    },
    {
      criteria: 'Evidence & Support',
      description: 'Use of relevant examples and supporting details',
      points: pointsPerCriteria,
      levels: {
        excellent: 'Compelling evidence with strong support',
        good: 'Adequate evidence and support',
        fair: 'Limited evidence or weak support',
        poor: 'Little to no evidence or support'
      }
    },
    {
      criteria: 'Technical Quality',
      description: 'Grammar, spelling, formatting, and presentation',
      points: totalPoints - (pointsPerCriteria * (criteriaCount - 1)),
      levels: {
        excellent: 'Professional quality with no errors',
        good: 'Few minor errors',
        fair: 'Several noticeable errors',
        poor: 'Many errors affecting readability'
      }
    }
  ];

  return criteria;
}

function buildMockAssignment(subject, topic, type, questionCount, totalPoints = 100) {
  const count = Math.max(4, Math.min(8, Number(questionCount) || 5));
  const pointsPer = Math.floor(totalPoints / count);
  const remaining = totalPoints - (pointsPer * (count - 1));
  const questions = Array.from({ length: count }).map((_, idx) => {
    if (idx % 2 === 0) {
      return {
        type: 'multiple-choice',
        question: `(${subject}) ${topic}: Which statement is correct?`,
        points: idx === count - 1 ? remaining : pointsPer,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 'Option B',
        explanation: 'Mock explanation for correct choice.'
      };
    }
    return {
      type: 'short-answer',
      question: `(${subject}) ${topic}: Briefly explain the core idea.`,
      points: idx === count - 1 ? remaining : pointsPer,
      expected_answer: 'A concise explanation covering the key concept.'
    };
  });

  return {
    title: `${topic} ${type === 'quiz' ? 'Quiz' : 'Assignment'}`,
    description: `This ${type} assesses understanding of ${topic}.`,
    submission_type: type === 'project' ? 'project' : (type === 'quiz' ? 'quiz' : 'online'),
    total_points: totalPoints,
    questions,
    rubric: generateMockRubric(`${topic} ${type}`, totalPoints),
    resources: [
      { name: 'Textbook Chapter', type: 'reference', value: topic },
      { name: 'Practice Set', type: 'link', value: 'Provide relevant practice materials' }
    ]
  };
}

// Scale rubric items' points so the total equals targetTotal
function scaleRubricToTotal(rubric, targetTotal) {
  const pts = Number(targetTotal) || 100;
  const safeRubric = Array.isArray(rubric) ? rubric : [];
  const sum = safeRubric.reduce((s, r) => s + (Number(r.points) || 0), 0);
  if (sum <= 0) return generateMockRubric('Rubric', pts);
  const factor = pts / sum;
  const scaled = safeRubric.map((r) => ({
    ...r,
    points: Math.max(0, Math.round((Number(r.points) || 0) * factor))
  }));
  // Fix rounding to match exactly
  const diff = pts - scaled.reduce((s, r) => s + (Number(r.points) || 0), 0);
  if (scaled.length > 0 && diff !== 0) {
    scaled[scaled.length - 1].points = (Number(scaled[scaled.length - 1].points) || 0) + diff;
  }
  return scaled;
}

// ---------------------------
// DB-driven assignment generation
// ---------------------------
async function generateAssignmentFromDatabase({ req, subject, topic, difficulty, assignment_type, question_count, total_points, class_id }) {
  const supabase = getSupabaseClient();
  const teacherId = req.user.id;

  // Helper to extract subject name from class name
  const extractSubjectFromClassName = (className) => {
    if (!className) return 'General';
    const lower = String(className).toLowerCase();
    if (lower.includes('math')) return 'Mathematics';
    if (lower.includes('physic')) return 'Physics';
    if (lower.includes('chem')) return 'Chemistry';
    if (lower.includes('bio')) return 'Biology';
    if (lower.includes('english')) return 'English';
    if (lower.includes('history')) return 'History';
    if (lower.includes('geo')) return 'Geography';
    if (lower.includes('computer') || lower.includes('software') || lower.includes('elec')) return 'Computer Science';
    if (lower.includes('business') || lower.includes('commerce')) return 'Business Studies';
    if (lower.includes('econ')) return 'Economics';
    return className.split(/\s|-/)[0];
  };

  // 1) Resolve teacher classes
  const { data: classTeachers } = await supabase
    .from('class_teachers')
    .select('class_id')
    .eq('profile_id', teacherId);
  const teacherClassIds = (classTeachers || []).map(c => c.class_id);

  // 2) Resolve subject name
  let subjectName = subject && String(subject).trim();
  let className = '';
  if (!subjectName && class_id) {
    const { data: cls } = await supabase
      .from('classes')
      .select('name')
      .eq('id', class_id)
      .single();
    className = cls?.name || '';
    subjectName = extractSubjectFromClassName(cls?.name);
  }
  if (!subjectName) subjectName = 'General';

  // 3) Try to fetch recent assignments in teacher classes as templates
  let templateAssignmentIds = [];
  if (teacherClassIds.length > 0) {
    const { data: recentAssignments } = await supabase
      .from('assignments')
      .select('id,title,description,total_points,submission_type,class_id')
      .in('class_id', teacherClassIds)
      .order('created_at', { ascending: false })
      .limit(10);
    templateAssignmentIds = (recentAssignments || []).map(a => a.id);
  }

  // 4) Aggregate rubric items from historical data
  let rubricItems = [];
  if (templateAssignmentIds.length > 0) {
    const { data: rubricRows } = await supabase
      .from('assignment_rubric_items')
      .select('criteria,points,assignment_id')
      .in('assignment_id', templateAssignmentIds);
    const freq = {};
    (rubricRows || []).forEach(r => {
      const key = (r.criteria || 'Quality').trim();
      if (!freq[key]) freq[key] = { criteria: key, total: 0, count: 0 };
      freq[key].total += Number(r.points) || 0;
      freq[key].count += 1;
    });
    const averaged = Object.values(freq).map(x => ({ criteria: x.criteria, points: Math.round(x.total / Math.max(1, x.count)) }));
    // pick top 4
    rubricItems = averaged.sort((a,b) => b.points - a.points).slice(0, 4);
  }
  if (rubricItems.length === 0) {
    // default rubric from subject (but data-driven from DB total)
    rubricItems = generateMockRubric(`${subjectName} ${topic || ''}`.trim(), total_points);
  } else {
    rubricItems = scaleRubricToTotal(rubricItems, total_points);
  }

  // 5) Build questions: try reuse distribution from history
  let questionTemplates = [];
  if (templateAssignmentIds.length > 0) {
    const { data: questionRows } = await supabase
      .from('assignment_questions')
      .select('type,points,assignment_id')
      .in('assignment_id', templateAssignmentIds);
    const typeCounts = {};
    (questionRows || []).forEach(q => {
      const t = q.type || 'multiple-choice';
      if (!typeCounts[t]) typeCounts[t] = { type: t, count: 0, avgPoints: 0, totalPoints: 0 };
      typeCounts[t].count += 1;
      typeCounts[t].totalPoints += Number(q.points) || 0;
    });
    Object.values(typeCounts).forEach(x => { x.avgPoints = Math.round(x.totalPoints / Math.max(1, x.count)); });
    const sortedTypes = Object.values(typeCounts).sort((a,b) => b.count - a.count);
    const desired = Math.max(1, Number(question_count) || 6);
    for (let i = 0; i < desired; i++) {
      const t = (sortedTypes[i % sortedTypes.length]?.type) || 'multiple-choice';
      questionTemplates.push({ type: t, points: sortedTypes[0]?.avgPoints || 5 });
    }
  }
  if (questionTemplates.length === 0) {
    const desired = Math.max(1, Number(question_count) || 6);
    for (let i = 0; i < desired; i++) {
      const t = i % 2 === 0 ? 'multiple-choice' : 'short-answer';
      questionTemplates.push({ type: t, points: 5 });
    }
  }
  // scale points and generate question texts according to assignment type
  const normalizedType = (assignment_type || '').toLowerCase();
  const desiredCount = Math.max(1, Number(question_count) || (normalizedType === 'quiz' ? 6 : 2));

  // For quiz: all MCQ; For homework/project: all text coding tasks
  let baseTemplates;
  if (normalizedType === 'quiz') {
    baseTemplates = Array.from({ length: desiredCount }).map((_, i) => ({ type: 'multiple-choice', points: 1 }));
  } else {
    baseTemplates = Array.from({ length: desiredCount }).map((_, i) => ({ type: 'text', points: 1 }));
  }

  const sumBase = baseTemplates.reduce((s,q)=> s + (Number(q.points)||0), 0) || baseTemplates.length;
  const factorBase = total_points / sumBase;
  const scaledBase = baseTemplates.map(q => ({ ...q, points: Math.max(1, Math.round((Number(q.points)||0) * factorBase)) }));
  const diffBase = total_points - scaledBase.reduce((s,q)=> s + (Number(q.points)||0),0);
  if (scaledBase.length > 0 && diffBase !== 0) scaledBase[0].points += diffBase;

  const courseLabel = className ? `${className}` : subjectName;
  const topicLabel = topic || subjectName;

  // Try to fetch subject description to enrich options (best-effort)
  let subjectDesc = '';
  try {
    const { data: subj } = await supabase
      .from('hsc_subjects')
      .select('name, description')
      .ilike('name', `%${subjectName}%`)
      .limit(1)
      .maybeSingle();
    subjectDesc = subj?.description || '';
  } catch (_) {}

  const buildMcq = (idx, pts) => {
    const templates = [
      `In ${courseLabel}, which statement about ${topicLabel} is correct?`,
      `Which of the following best describes ${topicLabel} in ${courseLabel}?`,
      `Select the true statement regarding ${topicLabel} for ${courseLabel}.`,
      `About ${topicLabel} in ${courseLabel}, which option is accurate?`
    ];
    const qText = templates[idx % templates.length];

    const descSentences = String(subjectDesc || '')
      .split(/\.|。|!/)
      .map(s => s.trim())
      .filter(Boolean);
    const descSnippet = descSentences.length > 0
      ? descSentences[idx % descSentences.length]
      : `${topicLabel} is commonly assessed in ${courseLabel}`;

    const correct = `${topicLabel} is a key concept in ${courseLabel} — ${descSnippet}.`;

    const distractorPool = [
      `It mainly measures attendance rather than understanding of ${topicLabel}.`,
      `${topicLabel} is unrelated to ${courseLabel}.`,
      `${topicLabel} requires no prior knowledge and is optional.`,
      `${topicLabel} is primarily about sports activities.`,
      `It focuses on formatting only, not on ${topicLabel}.`,
      `It discourages applying ${topicLabel} in real tasks.`
    ];
    // pick 3 distinct distractors starting from rotating index
    const start = idx % distractorPool.length;
    const distractors = [];
    for (let i = 0; i < distractorPool.length && distractors.length < 3; i++) {
      const cand = distractorPool[(start + i) % distractorPool.length];
      if (!distractors.includes(cand)) distractors.push(cand);
    }
    const letters = ['A','B','C','D'];
    const correctPos = idx % 4; // rotate correct answer position
    const options = [];
    let dIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctPos) options.push(correct);
      else options.push(distractors[dIdx++]);
    }
    return {
      type: 'multiple-choice',
      question: qText,
      points: pts,
      options,
      answer: `Option ${letters[correctPos]}`
    };
  };

  const scaledQuestions = scaledBase.map((q, idx) => {
    if (q.type === 'multiple-choice') {
      return buildMcq(idx, q.points);
    }
    // coding/text task for homework/project
    return {
      type: 'text',
      question: `Coding Task ${idx + 1} · ${courseLabel}: Implement a solution for ${topicLabel}. Provide your code in the editor and include brief comments explaining your approach.`,
      points: q.points,
      expected_answer: 'Working code that satisfies the described requirements with clear comments.'
    };
  });

  // 6) Construct assignment payload
  const submission_type = normalizedType === 'project' ? 'project' : (normalizedType === 'quiz' ? 'quiz' : 'online');
  const assignment = {
    title: `${topic || subjectName} ${normalizedType === 'quiz' ? 'Quiz' : 'Assignment'}`.trim(),
    description: normalizedType === 'quiz'
      ? `This quiz assesses your understanding of ${courseLabel} - ${topicLabel}.`
      : `This homework assesses your ability to apply ${courseLabel} concepts to ${topicLabel} by writing code.`,
    submission_type,
    total_points,
    questions: scaledQuestions,
    rubric: rubricItems,
    resources: []
  };

  return assignment;
}



