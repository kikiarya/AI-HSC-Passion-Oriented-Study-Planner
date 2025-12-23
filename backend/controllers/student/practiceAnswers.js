import { getSupabaseClient } from '../../clients/supabaseClient.js'

/**
 * （可选）把你原来的 getPracticeQuestions 也放这里，或者继续用你现有的版本
 */
export const getPracticeQuestions = async (req, res) => {
  try {
    const studentId = req.user.id
    const supabase = getSupabaseClient()

    const { data: questions, error } = await supabase
      .from('practice_questions')
      .select(`
        *,
        practice_question_options (
          id,
          option_text,
          is_correct,
          position
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: 'Failed to fetch practice questions' })

    const formatted = (questions || []).map(q => ({
      id: q.id,
      setId: q.set_id,
      question: q.question,
      type: q.type,
      subject: q.subject,
      subjectCode: q.subject_code,
      points: q.points,
      position: q.position,
      options: (q.practice_question_options || []).sort((a, b) => (a.position || 0) - (b.position || 0)),
      explanation: q.explanation,
      correctAnswer: q.correct_answer,     // ← 前端用的驼峰
      attempted: q.attempted,
      correct: q.correct,
      attemptCount: q.attempt_count
    }))

    return res.status(200).json({ questions: formatted, total: formatted.length })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch practice questions', details: e.message })
  }
}

/**
 * 提交答案（只在错误时写 incorrect_questions）
 * 接收 JSON: { questionId, answer, correct }
 */
export const submitPracticeAnswer = async (req, res) => {
  try {
    const studentId = req.user.id
    const { questionId, answer, correct } = req.body

    // 统一布尔，避免 "false" 字符串误判
    const isCorrect = (correct === true || correct === 'true')

    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required' })
    }

    const supabase = getSupabaseClient()

    // 校验题目归属 & 获取题目基础信息
    const { data: question, error: qErr } = await supabase
      .from('practice_questions')
      .select(`
        id, student_id, question, type, subject, subject_code, points, correct_answer, explanation,
        attempt_count,
        practice_question_options (id, option_text, is_correct, position)
      `)
      .eq('id', questionId)
      .eq('student_id', studentId)
      .single()

    if (qErr || !question) {
      return res.status(404).json({ error: 'Question not found or access denied' })
    }

    // 更新做题状态
    const updateData = {
      attempted: true,
      correct: isCorrect,
      attempt_count: (question.attempt_count || 0) + 1
    }
    
    // 尝试更新，如果student_answer字段存在也一并更新
    // 这样即使字段不存在也不会报错
    const { error: updErr } = await supabase
      .from('practice_questions')
      .update(updateData)
      .eq('id', questionId)
    if (updErr) {
      console.error('[practice_questions update]', updErr)
      return res.status(500).json({ error: 'Failed to save answer' })
    }

    // 仅当答错时写入错题表（完整字段）
    if (!isCorrect) {
      // 准备选项数据（转换为JSON格式）
      const options = question.practice_question_options?.map(opt => ({
        id: opt.id,
        text: opt.option_text,
        isCorrect: opt.is_correct,
        position: opt.position
      })) || []

      const incorrectPayload = {
        student_id: studentId,
        question_id: questionId,
        question: question.question,
        type: question.type,
        subject: question.subject || null,
        subject_code: question.subject_code || null,
        points: question.points || 10,
        student_answer: answer || '',
        correct_answer: question.correct_answer || '',
        explanation: question.explanation || '',
        options: options.length > 0 ? options : null,
        first_answered_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString()
      }

      console.log('[Incorrect Questions] Saving to incorrect_questions table:', {
        studentId,
        questionId,
        subject: incorrectPayload.subject
      })

      // 优先 upsert（需要唯一约束 student_id+question_id），失败则删后插兜底
      let dbErr = null
      const { error: upsertErr } = await supabase
        .from('incorrect_questions')
        .upsert(incorrectPayload, { onConflict: 'student_id,question_id' })
      
      if (upsertErr) {
        console.error('[incorrect_questions upsert]', upsertErr)
        dbErr = upsertErr
        
        // 尝试先删除后插入
        await supabase.from('incorrect_questions')
          .delete()
          .eq('student_id', studentId)
          .eq('question_id', questionId)
        
        const { error: insertErr } = await supabase
          .from('incorrect_questions')
          .insert(incorrectPayload)
        
        if (insertErr) {
          console.error('[incorrect_questions insert]', insertErr)
          dbErr = insertErr
        } else {
          console.log('[Incorrect Questions] ✅ Successfully saved to incorrect_questions')
          dbErr = null
        }
      } else {
        console.log('[Incorrect Questions] ✅ Successfully upserted to incorrect_questions')
      }

      if (dbErr) {
        // 不阻断主流程，但把原因回给前端，便于排查
        console.error('[Incorrect Questions] ❌ Failed to save:', dbErr)
        return res.status(200).json({
          success: true,
          correct: isCorrect,
          addedToReview: false,
          warn: 'Answer saved but failed to log incorrect question',
          dbError: dbErr.message || dbErr.details || String(dbErr)
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      correct: isCorrect,
      addedToReview: !isCorrect
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to submit answer', details: e.message })
  }
}
