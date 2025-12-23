import { useState, useEffect } from 'react'
import studentApi from '../../services/studentApi'

function GeneratePracticeQuestions() {
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [stats, setStats] = useState({
    totalGenerated: 0,
    lastGenerated: null
  })

  useEffect(() => {
    loadSelectedSubjects()
    loadStats()
  }, [])

  // Debug: Monitor generating state changes
  useEffect(() => {
    console.log('🔄 Generating state changed to:', generating)
  }, [generating])

  const loadSelectedSubjects = async () => {
    try {
      setLoading(true)
      const response = await studentApi.getSelectedSubjects()
      console.log('Selected subjects response:', response)
      setSelectedSubjects(response.subjects || [])
    } catch (err) {
      console.error('Failed to load selected subjects:', err)
      setError('Failed to load your selected subjects')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await studentApi.getPracticeStats()
      setStats({
        totalGenerated: response.totalGenerated || 0,
        lastGenerated: response.lastGenerated || null
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleStartPractice = async () => {
    if (selectedSubjects.length === 0) {
      setError('Please select HSC subjects first before generating practice questions')
      return
    }

    console.log('🚀 Starting to generate practice questions...')
    console.log('📊 Current generating state:', generating)
    
    setGenerating(true)
    setError(null)
    setSuccess(null)

    console.log('✅ State updated: generating = true')

    try {
      // Call API to generate practice questions
      console.log('📡 Calling API...')
      const response = await studentApi.generatePracticeQuestions()
      console.log('✅ API response received:', response)
      
      setSuccess(`Successfully generated ${response.questionsGenerated || 0} practice questions based on your selected subjects!`)
      console.log('✅ Success message set')
      
      await loadStats()
      console.log('✅ Stats loaded')
      
      // 自动触发刷新，显示新生成的题目
      setTimeout(() => {
        console.log('🔄 Triggering auto-refresh for practice questions...')
        window.dispatchEvent(new Event('practiceQuestionsGenerated'))
      }, 500)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
      
    } catch (err) {
      console.error('❌ Error during generation:', err)
      setError(err.message || err.response?.data?.error || 'Failed to generate practice questions. Please try again.')
    } finally {
      console.log('🏁 Finally block executing - setting generating to false')
      setGenerating(false)
      console.log('✅ Generation state should now be false')
    }
  }

  return (
    <div className="generate-practice-container">
      {/* Header */}
      <div className="practice-header">
        <div className="header-content">
          <h2>🎯 Generate Practice Questions</h2>
          <p>AI-generated practice questions based on your selected HSC subjects</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-start-practice"
            onClick={() => {
              console.log('🖱️ Button clicked, current generating state:', generating)
              handleStartPractice()
            }}
            disabled={generating || selectedSubjects.length === 0}
          >
            {generating ? '⏳ Generating...' : '✨ Start Practice Questions'}
          </button>
        </div>
      </div>

      {/* Generating Progress Message */}
      {generating && (
        <div className="alert alert-info">
          <span className="alert-icon">🤖</span>
          <div>
            <strong>AI is generating practice questions...</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>
              This may take 30-60 seconds depending on the number of subjects. Please wait...
            </p>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <span className="stat-value">{selectedSubjects.length}</span>
            <span className="stat-label">Selected Subjects</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalGenerated}</span>
            <span className="stat-label">Questions Generated</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🕒</div>
          <div className="stat-content">
            <span className="stat-value">
              {stats.lastGenerated 
                ? new Date(stats.lastGenerated).toLocaleDateString() 
                : 'Never'}
            </span>
            <span className="stat-label">Last Generated</span>
          </div>
        </div>
      </div>

      {/* Selected Subjects Display */}
      <div className="subjects-section">
        <h3>Your Selected HSC Subjects</h3>
        {loading ? (
          <div className="loading-message">Loading subjects...</div>
        ) : selectedSubjects.length === 0 ? (
          <div className="no-subjects">
            <p>You haven't selected any HSC subjects yet.</p>
            <p className="hint">
              Go to <strong>HSC Subjects</strong> tab to select subjects and receive AI recommendations.
            </p>
          </div>
        ) : (
          <div className="subjects-grid">
            {selectedSubjects.map((subject, index) => (
              <div key={index} className="subject-card">
                <div className="subject-header">
                  <span className="subject-code">{subject.subject_code}</span>
                  <span className="subject-category">{subject.category}</span>
                </div>
                <h4 className="subject-name">{subject.subject_name}</h4>
                {subject.reasoning && (
                  <p className="subject-reasoning">{subject.reasoning}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Practice Questions Section */}
      <PracticeQuestionsSection />
    </div>
  )
}

// 做题组件
function PracticeQuestionsSection() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [practicing, setPracticing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [singleQuestionMode, setSingleQuestionMode] = useState(false) // 是否是单题练习模式

  useEffect(() => {
    loadQuestions()
    
    // 监听生成完成事件，自动刷新题目列表
    const handleRefresh = () => {
      console.log('✅ Received practiceQuestionsGenerated event, refreshing questions...')
      loadQuestions()
    }
    window.addEventListener('practiceQuestionsGenerated', handleRefresh)
    
    return () => {
      window.removeEventListener('practiceQuestionsGenerated', handleRefresh)
    }
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const response = await studentApi.getPracticeQuestions()
      console.log(`📝 Loaded ${response.questions?.length || 0} practice questions`)
      setQuestions(response.questions || [])
    } catch (err) {
      console.error('Failed to load practice questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPractice = () => {
    if (questions.length > 0) {
      setPracticing(true)
      setSingleQuestionMode(false) // 全部题目模式
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  // 开始练习单个题目
  const handlePracticeSingleQuestion = (questionIndex) => {
    setPracticing(true)
    setSingleQuestionMode(true) // 单题模式
    setCurrentIndex(questionIndex)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  const handleAnswerSelect = (answer) => {
    if (!showResult) {
      setSelectedAnswer(answer)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || selectedAnswer.trim() === '') return

    const currentQuestion = questions[currentIndex]
    let correct = false

    // 判断答案是否正确
    if (currentQuestion.type === 'multiple_choice') {
      const correctOption = currentQuestion.options.find(opt => opt.is_correct)
      correct = selectedAnswer === correctOption?.option_text
    } else if (currentQuestion.type === 'short_answer' || currentQuestion.type === 'text') {
      // 简答题和文本题：与正确答案比较（忽略大小写和空格）
      const studentAnswer = selectedAnswer.trim().toLowerCase()
      const correctAnswer = (currentQuestion.correctAnswer || '').trim().toLowerCase()
      // 对于文本题，我们认为学生提交了答案就算attempted，但需要手动评分
      // 这里简单实现：如果有正确答案且匹配则正确
      if (correctAnswer && studentAnswer === correctAnswer) {
        correct = true
      } else {
        // 文本题没有自动判分，标记为需要复习
        correct = false
      }
    }

    setIsCorrect(correct)
    setShowResult(true)

    // 提交答案到后端
    try {
      const submitData = {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        correct: correct
      };
      
      console.log('=== Frontend Submit Debug ===');
      console.log('Submitting answer data:', submitData);
      console.log('Correct value:', correct);
      console.log('Correct type:', typeof correct);
      console.log('============================');
      
      await studentApi.submitPracticeAnswer(submitData);
      console.log('Answer submitted successfully');
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }

  const handleNextQuestion = () => {
    // 如果是单题模式，直接退出练习
    if (singleQuestionMode) {
      setPracticing(false)
      setSingleQuestionMode(false)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setShowResult(false)
      setIsCorrect(false)
      loadQuestions() // 重新加载题目状态
      return
    }

    // 全部题目模式：继续下一题或完成
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setIsCorrect(false)
    } else {
      // 完成所有题目
      setPracticing(false)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setShowResult(false)
      alert('🎉 Practice session completed! Check your incorrect questions in the Review tab.')
      loadQuestions() // 重新加载题目
    }
  }

  if (loading) {
    return (
      <div className="practice-questions-section">
        <h3>📝 Practice Questions</h3>
        <div className="loading-message">Loading questions...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="practice-questions-section">
        <h3>📝 Practice Questions</h3>
        <div className="no-questions">
          <p>No practice questions available yet.</p>
          <p className="hint">Generate some questions first using the button above!</p>
        </div>
      </div>
    )
  }

  // 做题模式
  if (practicing) {
    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100

    // Debug: 检查题目数据
    console.log('=== Practice Mode Debug ===');
    console.log('Current Question:', currentQuestion);
    console.log('Question Type:', currentQuestion?.type);
    console.log('Options:', currentQuestion?.options);
    console.log('Options length:', currentQuestion?.options?.length);
    console.log('==========================');

    return (
      <div className="practice-mode-container">
        <div className="practice-mode-header">
          <div className="progress-info">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span className="subject-badge">{currentQuestion.subject}</span>
          </div>
          <button 
            className="btn-exit-practice"
            onClick={() => setPracticing(false)}
          >
            Exit Practice
          </button>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="question-card-practice">
          <div className="question-header">
            <span className="question-number">Q{currentIndex + 1}</span>
            <span className="question-points">{currentQuestion.points} points</span>
          </div>

          <div className="question-text">
            {currentQuestion.question}
          </div>

          {/* 多选题选项 */}
          {(() => {
            console.log('Checking multiple_choice condition:', currentQuestion.type === 'multiple_choice');
            return null;
          })()}
          {currentQuestion.type === 'multiple_choice' && (
            <div className="options-list">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option.option_text
                const isCorrectOption = option.is_correct
                const showCorrectStyle = showResult && isCorrectOption
                const showWrongStyle = showResult && isSelected && !isCorrect

                return (
                  <div
                    key={idx}
                    className={`option-item ${isSelected ? 'selected' : ''} ${showCorrectStyle ? 'correct' : ''} ${showWrongStyle ? 'wrong' : ''}`}
                    onClick={() => handleAnswerSelect(option.option_text)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="option-text">{option.option_text}</span>
                    {showCorrectStyle && <span className="check-icon">✓</span>}
                    {showWrongStyle && <span className="check-icon">✗</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* 简答题/文本题输入框 */}
          {(() => {
            console.log('Checking short_answer/text condition:', 
              currentQuestion.type === 'short_answer' || currentQuestion.type === 'text');
            console.log('Actual type:', currentQuestion.type);
            return null;
          })()}
          {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'text') && (
            <div className="answer-input-section">
              <textarea
                className="answer-textarea"
                value={selectedAnswer || ''}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Enter your answer here..."
                rows={currentQuestion.type === 'text' ? 8 : 4}
                disabled={showResult}
              />
              {showResult && currentQuestion.correctAnswer && (
                <div className="correct-answer-display">
                  <strong>Expected Answer:</strong>
                  <div className="correct-answer-text">{currentQuestion.correctAnswer}</div>
                </div>
              )}
            </div>
          )}

          {showResult && (
            <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? (
                <>
                  <span className="result-icon">✅</span>
                  <span>Correct! Well done!</span>
                </>
              ) : (
                <>
                  <span className="result-icon">❌</span>
                  <span>Incorrect. This question will be added to your review list.</span>
                </>
              )}
              {currentQuestion.explanation && (
                <div className="explanation">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </div>
              )}
            </div>
          )}

          <div className="question-actions">
            {!showResult ? (
              <button
                className="btn-submit-answer"
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
              >
                Submit Answer
              </button>
            ) : (
              <button
                className="btn-next-question"
                onClick={handleNextQuestion}
              >
                {singleQuestionMode 
                  ? 'Finish' 
                  : (currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Practice')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 题目列表模式
  return (
    <div className="practice-questions-section">
      <div className="section-header">
        <h3>📝 Practice Questions ({questions.length})</h3>
        <button 
          className="btn-start-practice-session"
          onClick={handleStartPractice}
        >
          🎯 Start Practice Session (All)
        </button>
      </div>

      <div className="questions-grid">
        {questions.map((q, idx) => (
          <div 
            key={q.id} 
            className="question-preview-card"
            onClick={() => handlePracticeSingleQuestion(idx)}
            style={{ cursor: 'pointer' }}
            title="Click to practice this question"
          >
            <div className="question-preview-header">
              <span className="question-num">Q{idx + 1}</span>
              <span className="subject-tag">{q.subject}</span>
            </div>
            <div className="question-preview-text">
              {q.question.substring(0, 100)}...
            </div>
            <div className="question-preview-footer">
              <span className="question-type">{q.type}</span>
              <span className="question-points">{q.points} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GeneratePracticeQuestions

