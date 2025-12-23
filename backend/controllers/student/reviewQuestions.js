import { getSupabaseClient } from '../../clients/supabaseClient.js';

/**
 * Get incorrect questions for review
 * Returns questions from incorrect_questions table
 */
const getReviewQuestions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();

    console.log('[Review Questions] Fetching from incorrect_questions table for student:', studentId);

    // Get all incorrect questions from the dedicated table
    const { data: incorrectQuestions, error: questionsError } = await supabase
      .from('incorrect_questions')
      .select('*')
      .eq('student_id', studentId)
      .order('last_reviewed_at', { ascending: false });

    if (questionsError) {
      console.error('[Review Questions] Error fetching:', questionsError);
      return res.status(500).json({ error: 'Failed to fetch incorrect questions' });
    }

    if (!incorrectQuestions || incorrectQuestions.length === 0) {
      console.log('[Review Questions] No incorrect questions found');
      return res.status(200).json({ 
        questions: [],
        message: 'No incorrect questions yet. Keep practicing!' 
      });
    }

    console.log(`[Review Questions] Found ${incorrectQuestions.length} incorrect questions`);

    // Format questions for frontend
    const formattedQuestions = incorrectQuestions.map(q => {
      // Parse options from JSON if they exist
      let options = [];
      if (q.options) {
        try {
          options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        } catch (e) {
          console.error('[Review Questions] Error parsing options:', e);
          options = [];
        }
      }

      return {
        id: q.id,
        questionId: q.question_id,
        question: q.question,
        type: q.type,
        subject: q.subject || 'General',
        subjectCode: q.subject_code || '',
        topic: q.subject || 'Practice',
        difficulty: 'Medium',
        points: q.points || 10,
        options: options,
        studentAnswer: q.student_answer || '',
        correctAnswer: q.correct_answer || '',
        explanation: q.explanation || '',
        // Review tracking fields
        reviewCount: q.review_count || 0,
        masteryLevel: q.mastery_level || 'Needs Review',
        nextReviewDate: q.next_review_date,
        dateAnswered: q.first_answered_at || q.created_at,
        lastReviewed: q.last_reviewed_at,
        assignment: 'Practice Questions'
      };
    });

    return res.status(200).json({
      questions: formattedQuestions,
      total: formattedQuestions.length
    });

  } catch (error) {
    console.error('[Review Questions] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch review questions',
      details: error.message 
    });
  }
};

/**
 * Get review statistics from incorrect_questions table
 */
const getReviewStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();

    console.log('[Review Stats] Fetching statistics for student:', studentId);

    // Get count of all incorrect questions
    const { count: totalQuestions, error: countError } = await supabase
      .from('incorrect_questions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);

    if (countError) {
      console.error('[Review Stats] Error counting incorrect questions:', countError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get count of mastered questions (mastery_level = 'Mastered')
    const { count: masteredCount, error: masteredError } = await supabase
      .from('incorrect_questions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('mastery_level', 'Mastered');

    if (masteredError) {
      console.error('[Review Stats] Error counting mastered questions:', masteredError);
    }

    // Get count from practice_questions for overall stats
    const { count: attemptedCount, error: attemptedError } = await supabase
      .from('practice_questions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('attempted', true);

    const { count: correctCount, error: correctError } = await supabase
      .from('practice_questions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('correct', true);

    if (attemptedError || correctError) {
      console.error('[Review Stats] Error getting practice stats');
    }

    const total = totalQuestions || 0;
    const mastered = masteredCount || 0;
    const attempted = attemptedCount || 0;
    const correct = correctCount || 0;
    const masteryRate = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    console.log('[Review Stats] Results:', { 
      total, 
      mastered, 
      masteryRate,
      attempted,
      correct 
    });

    return res.status(200).json({
      total: total,
      dueForReview: total - mastered, // Questions that need review
      masteryRate: masteryRate,
      mastered: mastered
    });

  } catch (error) {
    console.error('[Review Stats] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch review statistics',
      details: error.message 
    });
  }
};

export { getReviewQuestions, getReviewStats };
