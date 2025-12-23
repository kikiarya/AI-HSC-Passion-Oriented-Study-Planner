import { useState, useEffect, useMemo } from 'react'
import studentApi from '../../services/studentApi'

function ReviewIncorrectQuestions() {
  const [questions, setQuestions] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedMasteryLevel, setSelectedMasteryLevel] = useState('All')
  const [showReviewMode, setShowReviewMode] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    dueForReview: 0,
    masteryRate: 0,
    mastered: 0
  })
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReviewQuestions()
    loadReviewStats()
  }, [])

  const loadReviewQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await studentApi.getReviewQuestions()
      setQuestions(response.questions || [])
    } catch (err) {
      console.error('Failed to load review questions:', err)
      setError('Failed to load review questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadReviewStats = async () => {
    try {
      const response = await studentApi.getReviewStats()
      setReviewStats({
        total: response.total || 0,
        dueForReview: response.dueForReview || 0,
        masteryRate: response.masteryRate || 0,
        mastered: response.mastered || 0
      })
    } catch (err) {
      console.error('Failed to load review stats:', err)
    }
  }

  // Get unique topics, subjects, and mastery levels for filters
  const topics = useMemo(() => {
    const uniqueTopics = [...new Set(questions.map(q => q.topic))]
    return ['All', ...uniqueTopics]
  }, [questions])

  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(questions.map(q => q.subject))]
    return ['All', ...uniqueSubjects]
  }, [questions])

  const masteryLevels = useMemo(() => {
    const uniqueLevels = [...new Set(questions.map(q => q.masteryLevel))]
    return ['All', ...uniqueLevels]
  }, [questions])

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    let filtered = questions

    if (selectedTopic !== 'All') {
      filtered = filtered.filter(q => q.topic === selectedTopic)
    }

    if (selectedSubject !== 'All') {
      filtered = filtered.filter(q => q.subject === selectedSubject)
    }

    if (selectedMasteryLevel !== 'All') {
      filtered = filtered.filter(q => q.masteryLevel === selectedMasteryLevel)
    }

    return filtered
  }, [questions, selectedTopic, selectedSubject, selectedMasteryLevel])

  const handleStartReview = () => {
    setShowReviewMode(true)
    setCurrentQuestionIndex(0)
    setShowAnswer(false)
  }

  const handleAnswerQuestion = (isCorrect) => {
    // TODO: Update question review status in Supabase
    const currentQuestion = filteredQuestions[currentQuestionIndex]
    if (currentQuestion) {
      // Update local state
      const updatedQuestions = questions.map(q =>
        q.id === currentQuestion.id
          ? { ...q, reviewCount: q.reviewCount + 1, masteryLevel: isCorrect ? 'Practicing' : 'Needs Review' }
          : q
      )
      setQuestions(updatedQuestions)
    }

    // Move to next question or finish review
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowAnswer(false)
    } else {
      setShowReviewMode(false)
      setCurrentQuestionIndex(0)
      setShowAnswer(false)
      alert('Review session completed! Great job!')
    }
  }

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowAnswer(false)
    } else {
      setShowReviewMode(false)
      setCurrentQuestionIndex(0)
      setShowAnswer(false)
    }
  }

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question)
  }

  const handleCloseQuestionDetail = () => {
    setSelectedQuestion(null)
  }

  const handleAnswerSingleQuestion = (isCorrect) => {
    // TODO: Update question review status in Supabase
    if (selectedQuestion) {
      const updatedQuestions = questions.map(q =>
        q.id === selectedQuestion.id
          ? { ...q, reviewCount: q.reviewCount + 1, masteryLevel: isCorrect ? 'Practicing' : 'Needs Review' }
          : q
      )
      setQuestions(updatedQuestions)
      setSelectedQuestion(null)
      alert(isCorrect ? 'Great! Keep it up!' : 'Keep practicing, you\'ll get it!')
    }
  }

  const getMasteryColor = (level) => {
    switch (level) {
      case 'Needs Review': return '#f56565'
      case 'Learning': return '#ed8936'
      case 'Practicing': return '#3182ce'
      case 'Mastered': return '#48bb78'
      default: return '#718096'
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#48bb78'
      case 'Medium': return '#ed8936'
      case 'Hard': return '#f56565'
      default: return '#718096'
    }
  }

  // Single Question Detail View
  if (selectedQuestion) {
    return (
      <div className="question-detail-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Question Review</h2>
            <button className="btn-close-modal" onClick={handleCloseQuestionDetail}>
              ✕
            </button>
          </div>

          <div className="question-detail-card">
            <div className="question-header">
              <div className="question-meta">
                <span className="subject-tag">{selectedQuestion.subject}</span>
                <span className="topic-tag">{selectedQuestion.topic}</span>
                <span 
                  className="difficulty-tag"
                  style={{ backgroundColor: getDifficultyColor(selectedQuestion.difficulty) }}
                >
                  {selectedQuestion.difficulty}
                </span>
                <span 
                  className="mastery-badge"
                  style={{ backgroundColor: getMasteryColor(selectedQuestion.masteryLevel) }}
                >
                  {selectedQuestion.masteryLevel}
                </span>
              </div>
              <div className="question-assignment">
                From: {selectedQuestion.assignment} • {new Date(selectedQuestion.dateAnswered).toLocaleDateString()}
              </div>
            </div>

            <div className="question-content">
              <h3>{selectedQuestion.question}</h3>
              
              <div className="answer-comparison">
                <div className="answer-item incorrect">
                  <span className="answer-label">❌ Your Answer:</span>
                  <span className="student-answer">{selectedQuestion.studentAnswer}</span>
                </div>
                <div className="answer-item correct">
                  <span className="answer-label">✅ Correct Answer:</span>
                  <span className="correct-answer">{selectedQuestion.correctAnswer}</span>
                </div>
              </div>
              
              <div className="explanation">
                <h4>📖 Explanation:</h4>
                <p>{selectedQuestion.explanation}</p>
              </div>

              <div className="review-info">
                <p><strong>Review Count:</strong> {selectedQuestion.reviewCount} times</p>
                {selectedQuestion.nextReviewDate && (
                  <p><strong>Next Review:</strong> {new Date(selectedQuestion.nextReviewDate).toLocaleDateString()}</p>
                )}
              </div>

              <div className="review-actions">
                <button 
                  className="btn-incorrect"
                  onClick={() => handleAnswerSingleQuestion(false)}
                >
                  ❌ Still Don't Understand
                </button>
                <button 
                  className="btn-correct"
                  onClick={() => handleAnswerSingleQuestion(true)}
                >
                  ✅ Now I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showReviewMode && filteredQuestions.length > 0) {
    const currentQuestion = filteredQuestions[currentQuestionIndex]
    
    return (
      <div className="review-mode-container">
        <div className="review-header">
          <div className="review-progress">
            <span>Question {currentQuestionIndex + 1} of {filteredQuestions.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <button 
            className="btn-exit-review"
            onClick={() => setShowReviewMode(false)}
          >
            Exit Review
          </button>
        </div>

        <div className="question-card">
          <div className="question-header">
            <div className="question-meta">
              <span className="subject-tag">{currentQuestion.subject}</span>
              <span className="topic-tag">{currentQuestion.topic}</span>
              <span 
                className="difficulty-tag"
                style={{ backgroundColor: getDifficultyColor(currentQuestion.difficulty) }}
              >
                {currentQuestion.difficulty}
              </span>
            </div>
            <div className="question-assignment">
              From: {currentQuestion.assignment}
            </div>
          </div>

          <div className="question-content">
            <h3>{currentQuestion.question}</h3>
            
            {!showAnswer ? (
              <div className="question-actions">
                <button 
                  className="btn-show-answer"
                  onClick={() => setShowAnswer(true)}
                >
                  Show Answer
                </button>
                <button 
                  className="btn-skip"
                  onClick={handleSkipQuestion}
                >
                  Skip Question
                </button>
              </div>
            ) : (
              <div className="answer-section">
                <div className="answer-comparison">
                  <div className="answer-item">
                    <span className="answer-label">Your Answer:</span>
                    <span className="student-answer">{currentQuestion.studentAnswer}</span>
                  </div>
                  <div className="answer-item">
                    <span className="answer-label">Correct Answer:</span>
                    <span className="correct-answer">{currentQuestion.correctAnswer}</span>
                  </div>
                </div>
                
                <div className="explanation">
                  <h4>Explanation:</h4>
                  <p>{currentQuestion.explanation}</p>
                </div>

                <div className="review-actions">
                  <button 
                    className="btn-incorrect"
                    onClick={() => handleAnswerQuestion(false)}
                  >
                    ❌ Still Don't Understand
                  </button>
                  <button 
                    className="btn-correct"
                    onClick={() => handleAnswerQuestion(true)}
                  >
                    ✅ Now I Understand
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="review-incorrect-container">
      {/* Header */}
      <div className="review-header">
        <div className="header-content">
          <h2>📚 Review Practice Questions</h2>
          <p>Review and practice your generated questions</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-start-review"
            onClick={handleStartReview}
            disabled={filteredQuestions.length === 0 || loading}
          >
            {loading ? '⏳ Loading...' : '🎯 Start Review Session'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{reviewStats.total}</span>
            <span className="stat-label">Total Questions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <span className="stat-value">{reviewStats.dueForReview}</span>
            <span className="stat-label">Due for Review</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <span className="stat-value">{reviewStats.masteryRate}%</span>
            <span className="stat-label">Mastery Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <span className="stat-value">{reviewStats.mastered}</span>
            <span className="stat-label">Mastered</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h3>Filter Questions</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Topic:</label>
            <select 
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Subject:</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Mastery Level:</label>
            <select 
              value={selectedMasteryLevel} 
              onChange={(e) => setSelectedMasteryLevel(e.target.value)}
            >
              {masteryLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="questions-section">
        <h3>Questions ({filteredQuestions.length})</h3>
        {loading ? (
          <div className="loading-message">
            <p>Loading practice questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="no-questions">
            <p>{questions.length === 0 
              ? 'No practice questions yet. Generate some first!' 
              : 'No questions match your current filters.'}</p>
            {questions.length > 0 && (
              <button 
                className="btn-clear-filters"
                onClick={() => {
                  setSelectedTopic('All')
                  setSelectedSubject('All')
                  setSelectedMasteryLevel('All')
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="questions-list">
            {filteredQuestions.map((question, index) => (
              <div 
                key={question.id} 
                className="question-item clickable"
                onClick={() => handleQuestionClick(question)}
              >
                <div className="question-info">
                  <div className="question-meta">
                    <span className="subject-tag">{question.subject}</span>
                    <span className="topic-tag">{question.topic}</span>
                    <span 
                      className="difficulty-tag"
                      style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
                    >
                      {question.difficulty}
                    </span>
                  </div>
                  <h4>{question.question}</h4>
                  <div className="question-details">
                    <span>Assignment: {question.assignment}</span>
                    <span>Date: {new Date(question.dateAnswered).toLocaleDateString()}</span>
                    <span>Reviews: {question.reviewCount}</span>
                  </div>
                </div>
                <div className="question-status">
                  <span 
                    className="mastery-badge"
                    style={{ backgroundColor: getMasteryColor(question.masteryLevel) }}
                  >
                    {question.masteryLevel}
                  </span>
                  {question.nextReviewDate && (
                    <span className="next-review">
                      Next: {new Date(question.nextReviewDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewIncorrectQuestions
