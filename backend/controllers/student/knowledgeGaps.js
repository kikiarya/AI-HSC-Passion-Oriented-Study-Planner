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
 * POST /api/student/knowledge-gaps/analyze
 * Analyze knowledge gaps based on incorrect questions and performance data
 */
export const analyzeKnowledgeGaps = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();
    
    console.log(`[analyzeKnowledgeGaps] Analyzing knowledge gaps for student_id: ${studentId}`);
    
    // Fetch incorrect questions from database
    const { data: incorrectQuestions, error: incorrectError } = await supabase
      .from('incorrect_questions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (incorrectError) {
      console.error('Error fetching incorrect questions:', incorrectError);
      // Don't fail if table doesn't exist yet, just use empty array
      console.log('Table may not exist yet, continuing with empty incorrect questions');
    }
    
    console.log(`[analyzeKnowledgeGaps] Found ${incorrectQuestions?.length || 0} incorrect questions`);
    
    // Fetch student's grades for additional context
    const { data: grades, error: gradeError } = await supabase
      .from('class_grade_history')
      .select(`
        score,
        max_score,
        assessment,
        created_at,
        classes (
          name
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (gradeError) {
      console.error('Error fetching grades:', gradeError);
    }
    
    console.log(`[analyzeKnowledgeGaps] Found ${grades?.length || 0} recent grades`);
    
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
      
      return className.split(/[\s-]/)[0];
    };
    
    // Group incorrect questions by subject and topic
    const questionGroups = {};
    if (incorrectQuestions && incorrectQuestions.length > 0) {
      incorrectQuestions.forEach(q => {
        const subject = q.subject || extractSubjectFromClassName(q.assignment_source || '');
        const topic = q.topic || 'General Topics';
        
        if (!questionGroups[subject]) {
          questionGroups[subject] = {};
        }
        if (!questionGroups[subject][topic]) {
          questionGroups[subject][topic] = [];
        }
        questionGroups[subject][topic].push(q);
      });
    }
    
    // If no OpenAI API key, return mock data
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured - using mock data');
      return res.json({
        knowledge_gaps: generateMockKnowledgeGaps(questionGroups, grades),
        overall_analysis: 'Mock analysis: Focus on areas with most incorrect questions.',
        suggested_study_order: Object.keys(questionGroups).slice(0, 5),
        mock: true,
        message: 'OpenAI API key not configured, returning mock knowledge gaps'
      });
    }
    
    console.log('🤖 Calling OpenAI API for knowledge gaps analysis');
    
    // Load instruction from file
    const instructionPath = path.join(__dirname, '../../instructions/knowledge-gaps-instruction.md');
    let instruction = '';
    try {
      instruction = fs.readFileSync(instructionPath, 'utf-8');
    } catch (error) {
      console.error('Error reading instruction file:', error);
      instruction = 'You are an expert educational AI assistant. Analyze student knowledge gaps based on their performance data.';
    }
    
    // Prepare the prompt for OpenAI
    const prompt = `Analyze the following student's knowledge gaps:

**Incorrect Questions by Subject/Topic:**
${JSON.stringify(questionGroups, null, 2)}

**Recent Grades Performance:**
${JSON.stringify(grades?.map(g => ({
  subject: g.classes?.name || 'Unknown',
  assessment: g.assessment,
  score: g.score,
  max_score: g.max_score,
  percentage: g.max_score > 0 ? Math.round((g.score / g.max_score) * 100) : 0,
  date: g.created_at
})), null, 2)}

Please identify:
1. The key knowledge gaps with their weakness levels (high, medium, low)
2. Evidence for each gap
3. Specific recommendations for improvement
4. Related topics that need attention
5. An overall analysis of the student's performance

Return ONLY the JSON response following the format specified in the instructions.`;

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
        throw new Error(`Service unavailable: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      console.log('✅ OpenAI API success! Generated knowledge gaps analysis');
      
      // Extract JSON from response (handle markdown code blocks)
      let knowledgeGaps;
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        knowledgeGaps = JSON.parse(jsonString);
      } else {
        knowledgeGaps = JSON.parse(aiResponse);
      }
      
      return res.json({
        knowledge_gaps: knowledgeGaps.knowledge_gaps || [],
        overall_analysis: knowledgeGaps.overall_analysis || 'Analysis completed.',
        suggested_study_order: knowledgeGaps.suggested_study_order || [],
        ai_generated: true,
        mock: false,
        data_summary: {
          incorrect_questions_count: incorrectQuestions?.length || 0,
          recent_grades_count: grades?.length || 0
        }
      });

    } catch (apiError) {
      console.warn('OpenAI 不可用，已自动降级为本地数据：', apiError?.message || apiError);
      console.log('⚠️ Falling back to mock data');
      
      // Fallback to mock data if API fails
      return res.json({
        knowledge_gaps: generateMockKnowledgeGaps(questionGroups, grades),
        overall_analysis: 'Mock analysis: Focus on areas with most incorrect questions.',
        suggested_study_order: Object.keys(questionGroups).slice(0, 5),
        mock: true,
        error: 'ai_service_unavailable',
        message: apiError?.message || 'OpenAI unavailable'
      });
    }

  } catch (error) {
    console.error('Analyze knowledge gaps error:', error);
    return ErrorResponse.internalServerError('Failed to analyze knowledge gaps').send(res);
  }
};

/**
 * Generate mock knowledge gaps based on incorrect questions
 */
function generateMockKnowledgeGaps(questionGroups, grades) {
  const gaps = [];
  
  // Generate gaps from incorrect questions
  Object.entries(questionGroups).forEach(([subject, topics]) => {
    Object.entries(topics).forEach(([topic, questions]) => {
      const weaknessLevel = questions.length >= 5 ? 'high' : questions.length >= 3 ? 'medium' : 'low';
      
      gaps.push({
        subject: subject,
        topic: topic,
        weakness_level: weaknessLevel,
        evidence: `${questions.length} incorrect question${questions.length > 1 ? 's' : ''} in this area`,
        recommendation: `Focus on reviewing ${topic} in ${subject}. Practice similar problems to strengthen understanding.`,
        related_topics: questions.slice(0, 3).map(q => q.question_text?.substring(0, 50) || topic)
      });
    });
  });
  
  // Generate gaps from grades
  if (grades && grades.length > 0) {
    const subjectGrades = {};
    grades.forEach(grade => {
      const subject = grade.classes?.name || 'Unknown';
      if (!subjectGrades[subject]) {
        subjectGrades[subject] = [];
      }
      subjectGrades[subject].push(grade);
    });
    
    Object.entries(subjectGrades).forEach(([subject, subjectGradesArray]) => {
      const avgScore = subjectGradesArray.reduce((sum, g) => sum + (g.score || 0), 0) / subjectGradesArray.length;
      const maxScore = subjectGradesArray[0]?.max_score || 100;
      const percentage = maxScore > 0 ? (avgScore / maxScore) * 100 : 0;
      
      if (percentage < 70) {
        gaps.push({
          subject: subject,
          topic: `${subject} Fundamentals`,
          weakness_level: percentage < 50 ? 'high' : 'medium',
          evidence: `Average score: ${percentage.toFixed(0)}%`,
          recommendation: `Focus on reviewing core concepts in ${subject}. Consider additional practice exercises.`,
          related_topics: ['Core Concepts', 'Basic Skills']
        });
      }
    });
  }
  
  return gaps;
}

/**
 * GET /api/student/knowledge-gaps/stats
 * Get statistics about knowledge gaps
 */
export const getKnowledgeGapsStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();
    
    console.log(`[getKnowledgeGapsStats] Fetching stats for student_id: ${studentId}`);
    
    // Fetch incorrect questions count
    const { data: incorrectQuestions, error: incorrectError } = await supabase
      .from('incorrect_questions')
      .select('*')
      .eq('student_id', studentId);
    
    if (incorrectError) {
      console.error('Error fetching incorrect questions:', incorrectError);
    }
    
    // Count by subject and topic
    const subjectCounts = {};
    const topicCounts = {};
    
    if (incorrectQuestions && incorrectQuestions.length > 0) {
      incorrectQuestions.forEach(q => {
        const subject = q.subject || 'Unknown';
        const topic = q.topic || 'Unknown';
        
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
    
    return res.json({
      success: true,
      stats: {
        total_incorrect_questions: incorrectQuestions?.length || 0,
        subject_distribution: subjectCounts,
        topic_distribution: topicCounts,
        subjects_affected: Object.keys(subjectCounts).length
      }
    });
    
  } catch (error) {
    console.error('Get knowledge gaps stats error:', error);
    return ErrorResponse.internalServerError('Failed to fetch knowledge gaps stats').send(res);
  }
};

